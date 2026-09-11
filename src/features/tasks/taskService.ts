import { generateId } from '../../utils/id';
import * as taskRepository from './taskRepository';
import { computeTaskOccurrenceStatus, groupCompletionsByTaskId } from './taskStatus';
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

/** Direct, permanent delete of the task and all of its completion history (see taskRepository for the transactional cascade). Never touches the linked entity, if any. */
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

/** Thrown when a completion would create a second record for the same (taskId, occurrenceDate) occurrence — callers show a specific, localized message for this rather than the generic save-failure one. */
export class DuplicateTaskOccurrenceError extends Error {
  constructor() {
    super('This task occurrence has already been completed');
    this.name = 'DuplicateTaskOccurrenceError';
  }
}

function isConstraintError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'ConstraintError';
}

/**
 * Completes exactly one occurrence of a task. Duplicate completion of the
 * same occurrence is rejected atomically by the unique
 * `taskId_occurrenceDate` IndexedDB index (see taskRepository.ts) rather
 * than by a separate read-then-write existence check, so a race between
 * two concurrent completions of the same occurrence can never both
 * succeed.
 */
export async function completeTaskOccurrence(
  taskId: string,
  occurrenceDate: string,
  notes?: string,
): Promise<TaskCompletion> {
  const completion: TaskCompletion = {
    id: generateId(),
    taskId,
    occurrenceDate,
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
