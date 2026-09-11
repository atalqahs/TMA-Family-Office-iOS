import { generateId } from '../../utils/id';
import * as taskRepository from './taskRepository';
import { getOccurrenceDatesInRange } from './taskRecurrence';
import { computeTaskOccurrenceStatus, groupCompletionsByTaskId } from './taskStatus';
import { UNSCHEDULED_OCCURRENCE_KEY } from './types';
import type { Task, TaskCompletion, TaskFormValues, TaskGroup, TaskGroupFormValues } from './types';

export { GroupNotEmptyError } from './taskRepository';

export async function createTask(values: TaskFormValues): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: generateId(),
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await taskRepository.saveTaskWithGroupGuard(task);
  return task;
}

/**
 * Editing a recurring task's schedule changes the definition going
 * forward only — existing `TaskCompletion` history rows are never
 * mutated or deleted here, so history stays exactly as it happened. The
 * new `dueDate`/`recurrenceUnit`/`recurrenceInterval` becomes the anchor
 * for all future occurrence calculations (see taskRecurrence.ts); any
 * ambiguity this creates against past completions is intentionally left
 * as-is rather than attempting "this occurrence / future occurrences /
 * entire series" calendar semantics, per the Phase 8 prototype scope.
 */
export async function updateTask(id: string, values: TaskFormValues): Promise<Task> {
  const existing = await taskRepository.getTask(id);
  if (!existing) {
    throw new Error(`Task ${id} not found`);
  }
  const updated: Task = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await taskRepository.saveTaskWithGroupGuard(updated);
  return updated;
}

/** Direct, permanent delete of the task and all of its completion history (see taskRepository for the transactional cascade). */
export async function removeTask(id: string): Promise<void> {
  await taskRepository.deleteTaskWithCompletions(id);
}

export async function createTaskGroup(values: TaskGroupFormValues): Promise<TaskGroup> {
  const now = new Date().toISOString();
  const group: TaskGroup = {
    id: generateId(),
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await taskRepository.saveTaskGroup(group);
  return group;
}

export async function updateTaskGroup(id: string, values: TaskGroupFormValues): Promise<TaskGroup> {
  const existing = await taskRepository.getTaskGroup(id);
  if (!existing) {
    throw new Error(`Task group ${id} not found`);
  }
  const updated: TaskGroup = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await taskRepository.saveTaskGroup(updated);
  return updated;
}

/** Deletes a group only if it has zero Tasks (see taskRepository.deleteTaskGroupIfEmpty) -- throws GroupNotEmptyError otherwise, never silently orphaning or bulk-deleting its Tasks. */
export async function removeTaskGroup(id: string): Promise<void> {
  await taskRepository.deleteTaskGroupIfEmpty(id);
}

/**
 * How many tasks currently have an overdue occurrence -- for the small,
 * dashboard-level "needs attention" indicator (see DashboardPage.tsx).
 * Reuses the exact same derivation as everywhere else in the module
 * (see taskStatus.ts) rather than a second, dashboard-specific notion of
 * "overdue".
 */
export async function getOverdueTaskCount(): Promise<number> {
  const [tasks, completions] = await Promise.all([taskRepository.listTasks(), taskRepository.listAllCompletions()]);
  const completionsByTask = groupCompletionsByTaskId(completions);
  let overdueCount = 0;
  for (const task of tasks) {
    const { state } = computeTaskOccurrenceStatus(task, completionsByTask.get(task.id) ?? []);
    if (state === 'overdue') overdueCount += 1;
  }
  return overdueCount;
}

/** Thrown when a completion would create a second record for the same (taskId, occurrenceKey) occurrence — callers show a specific, localized message for this rather than the generic save-failure one. */
export class DuplicateTaskOccurrenceError extends Error {
  constructor() {
    super('This task occurrence has already been completed');
    this.name = 'DuplicateTaskOccurrenceError';
  }
}

function isConstraintError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'ConstraintError';
}

/** Thrown when `occurrenceKey` does not correspond to any actionable occurrence of the given task's own schedule (Section I hardening — see `isValidOccurrenceKey` below). */
export class InvalidTaskOccurrenceError extends Error {
  constructor() {
    super('This is not a valid occurrence of this task');
    this.name = 'InvalidTaskOccurrenceError';
  }
}

/**
 * Whether `occurrenceKey` is actually a legitimate occurrence of `task`'s
 * own dueDate/recurrence schedule -- closing the gap where
 * `completeTaskOccurrence` used to accept ANY string as long as it hadn't
 * been completed yet (only the unique `(taskId, occurrenceKey)` DB index
 * stopped a second completion of the SAME key; nothing stopped completing
 * a nonsense key in the first place, e.g. an arbitrary date never produced
 * by the task's own schedule, the `UNSCHEDULED_OCCURRENCE_KEY` sentinel on
 * a dated task, or a real date on an undated one-time task).
 *
 * Deliberately reuses `getOccurrenceDatesInRange` (taskRecurrence.ts)
 * rather than re-deriving any recurrence math here, so this schedule logic
 * continues to exist in exactly one place.
 */
function isValidOccurrenceKey(
  task: Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'>,
  occurrenceKey: string,
): boolean {
  if (!task.dueDate) {
    return occurrenceKey === UNSCHEDULED_OCCURRENCE_KEY;
  }
  if (occurrenceKey === UNSCHEDULED_OCCURRENCE_KEY) {
    return false;
  }
  if (task.recurrenceUnit === 'none') {
    return occurrenceKey === task.dueDate;
  }
  return getOccurrenceDatesInRange(task, task.dueDate, occurrenceKey).includes(occurrenceKey);
}

/**
 * Completes exactly one occurrence of a task, identified by its stable
 * `occurrenceKey` (a real 'YYYY-MM-DD' date for a dated occurrence, or
 * `UNSCHEDULED_OCCURRENCE_KEY` for an undated one-time task's single
 * occurrence -- see types.ts). `occurrenceKey` is validated against the
 * task's own schedule (see `isValidOccurrenceKey`) before anything is
 * written. Duplicate completion of the same, already-valid occurrence is
 * additionally rejected atomically by the unique `taskId_occurrenceKey`
 * IndexedDB index (see taskRepository.ts) rather than by a separate
 * read-then-write existence check, so a race between two concurrent
 * completions of the same occurrence can never both succeed.
 */
export async function completeTaskOccurrence(
  taskId: string,
  occurrenceKey: string,
  notes?: string,
): Promise<TaskCompletion> {
  const task = await taskRepository.getTask(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }
  if (!isValidOccurrenceKey(task, occurrenceKey)) {
    throw new InvalidTaskOccurrenceError();
  }

  const completion: TaskCompletion = {
    id: generateId(),
    taskId,
    occurrenceKey,
    completedAt: new Date().toISOString(),
    notes,
  };
  try {
    await taskRepository.completeTaskOccurrence(completion);
  } catch (error) {
    if (isConstraintError(error)) {
      throw new DuplicateTaskOccurrenceError();
    }
    throw error;
  }
  return completion;
}
