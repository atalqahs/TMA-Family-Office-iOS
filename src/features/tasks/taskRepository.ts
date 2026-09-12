import { getDB } from '../../storage/db';
import type { Task, TaskCompletion, TaskGroup } from './types';

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

/**
 * Saves a Task, verifying its `groupId` refers to a real TaskGroup INSIDE
 * the same IndexedDB transaction before the Task is ever written -- the
 * same existence-guard pattern already proven for Vehicle maintenance +
 * mileage sync and for Task completion. A Task can therefore never be
 * created or edited to reference a group that doesn't exist.
 */
export async function saveTaskWithGroupGuard(task: Task): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tasks', 'taskGroups'], 'readwrite');

  const group = await tx.objectStore('taskGroups').get(task.groupId);
  if (!group) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new Error(`Task group ${task.groupId} not found`);
  }

  await tx.objectStore('tasks').put(task);
  await tx.done;
}

export async function getTaskCount(): Promise<number> {
  const db = await getDB();
  return db.count('tasks');
}

/** Every group, ARCHIVED ONES INCLUDED -- the read path for Archive, which must see archived groups too (see features/archive/). Tasks themselves are never filtered by their group's archive state (see taskRecurrence.ts/Notifications -- archiving a group never disables its Tasks' business logic). */
export async function listAllTaskGroups(): Promise<TaskGroup[]> {
  const db = await getDB();
  const all = await db.getAll('taskGroups');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Non-archived -- the normal top-level active Groups list (TasksPage). Centralized here so no component ever filters `archivedAt` itself. */
export async function listTaskGroups(): Promise<TaskGroup[]> {
  const all = await listAllTaskGroups();
  return all.filter((group) => !group.archivedAt);
}

export async function getTaskGroup(id: string): Promise<TaskGroup | undefined> {
  const db = await getDB();
  return db.get('taskGroups', id);
}

export async function saveTaskGroup(group: TaskGroup): Promise<void> {
  const db = await getDB();
  await db.put('taskGroups', group);
}

/** Sets `archivedAt` on the GROUP only -- never touches its Tasks or their TaskCompletion history, recurrence, or Notification behavior (see TaskGroup's own doc comment). */
export async function archiveTaskGroup(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('taskGroups', id);
  if (!existing) return;
  await db.put('taskGroups', { ...existing, archivedAt: new Date().toISOString() });
}

/** Clears `archivedAt`, returning the group to the active top-level list exactly as it was -- never recreates/copies the group or its Tasks. */
export async function unarchiveTaskGroup(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('taskGroups', id);
  if (!existing) return;
  const { archivedAt: _archivedAt, ...rest } = existing;
  await db.put('taskGroups', rest);
}

/** Thrown by `deleteTaskGroupIfEmpty` when the group still has Tasks assigned to it -- Tasks are never silently orphaned or bulk-deleted as a side effect of removing their group. */
export class GroupNotEmptyError extends Error {
  constructor() {
    super('Cannot delete a group that still has tasks');
    this.name = 'GroupNotEmptyError';
  }
}

/**
 * Deletes a TaskGroup only if it currently has zero Tasks, checked INSIDE
 * the same transaction as the delete itself so a Task can never end up
 * pointing at a group that's mid-deletion. Never touches or moves the
 * group's Tasks -- the caller must move or delete them first.
 */
export async function deleteTaskGroupIfEmpty(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tasks', 'taskGroups'], 'readwrite');

  const remainingTaskCount = await tx.objectStore('tasks').index('groupId').count(id);
  if (remainingTaskCount > 0) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new GroupNotEmptyError();
  }

  await tx.objectStore('taskGroups').delete(id);
  await tx.done;
}

export async function listCompletionsForTask(taskId: string): Promise<TaskCompletion[]> {
  const db = await getDB();
  const completions = await db.getAllFromIndex('taskCompletions', 'taskId', taskId);
  return completions.sort((a, b) => b.occurrenceKey.localeCompare(a.occurrenceKey));
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
 * `taskId_occurrenceKey` index rejects a second completion for the same
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

  try {
    await completionsStore.add(completion);
    await tx.done;
  } catch (error) {
    // The unique `taskId_occurrenceKey` index rejects a duplicate `.add()`
    // (see DuplicateTaskOccurrenceError in taskService.ts), which also
    // aborts this transaction — drain `tx.done`'s own rejection here too,
    // the same way the explicit `tx.abort()` branch above already does,
    // so it can never surface as a second, unhandled promise rejection.
    await tx.done.catch(() => {});
    throw error;
  }
}

/**
 * Direct, permanent delete (acceptable for this experimental prototype).
 * Deletes the task and every completion record that belongs to it in a
 * single IndexedDB transaction spanning both stores, so the operation
 * either fully commits or fully rolls back — never leaving orphaned
 * completion history. Tasks & Reminders has no relationship to any other
 * module, so this only ever removes the Task's own records.
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
