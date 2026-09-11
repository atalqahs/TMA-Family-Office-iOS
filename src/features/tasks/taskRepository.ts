import { getDB } from '../../storage/db';
import type { Task, TaskCompletion } from './types';

/**
 * All IndexedDB access for the Tasks module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `taskService.ts`, which builds on
 * it) instead.
 */

export async function listTasks(): Promise<Task[]> {
  const db = await getDB();
  const all = await db.getAll('tasks');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return db.get('tasks', id);
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function getTaskCount(): Promise<number> {
  const db = await getDB();
  return db.count('tasks');
}

export async function listCompletionsForTask(taskId: string): Promise<TaskCompletion[]> {
  const db = await getDB();
  const completions = await db.getAllFromIndex('taskCompletions', 'taskId', taskId);
  return completions.sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));
}

/** Every completion across all tasks, for computing card-level/derived status without an N+1 query per task. */
export async function listAllCompletions(): Promise<TaskCompletion[]> {
  const db = await getDB();
  return db.getAll('taskCompletions');
}

/**
 * Marks one occurrence of a task complete, in a single IndexedDB
 * transaction spanning `tasks` and `taskCompletions`.
 *
 * The task is read and verified INSIDE this same transaction before the
 * completion record is ever written — the same existence-guard pattern
 * proven for Vehicle maintenance + mileage sync — so a completion can
 * never end up orphaned from a concurrently-deleted task.
 *
 * The completion is added (never `put`) so the unique
 * `taskId_occurrenceDate` index rejects a second completion for the same
 * occurrence atomically at the IndexedDB level; callers translate that
 * failure into `DuplicateTaskOccurrenceError` (see taskService.ts).
 */
export async function completeTaskOccurrence(completion: TaskCompletion): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tasks', 'taskCompletions'], 'readwrite');
  const tasksStore = tx.objectStore('tasks');
  const completionsStore = tx.objectStore('taskCompletions');

  const task = await tasksStore.get(completion.taskId);
  if (!task) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new Error(`Task ${completion.taskId} not found`);
  }

  await completionsStore.add(completion);
  await tx.done;
}

/**
 * Direct, permanent delete (acceptable for this experimental prototype).
 * Deletes the task and every completion record that belongs to it in a
 * single IndexedDB transaction spanning both stores, so the operation
 * either fully commits or fully rolls back — never leaving orphaned
 * completion history.
 *
 * This only removes the Task's own records. It never touches the linked
 * Family/Property/Vehicle/Staff/Contract entity (if any).
 */
export async function deleteTaskWithCompletions(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tasks', 'taskCompletions'], 'readwrite');
  const completionsStore = tx.objectStore('taskCompletions');

  const completionIds = await completionsStore.index('taskId').getAllKeys(id);

  await Promise.all([
    tx.objectStore('tasks').delete(id),
    ...completionIds.map((completionId) => completionsStore.delete(completionId)),
  ]);
  await tx.done;
}
