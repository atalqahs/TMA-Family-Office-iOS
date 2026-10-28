import { getDB } from '../../storage/db';
import type { QuickTodoItem } from './types';

/**
 * All IndexedDB access for the Quick To-Do List widget goes through this
 * file. Presentation components and hooks never call `getDB()`/idb
 * directly -- they go through this repository (or `quickTodoService.ts`,
 * which builds on it) instead.
 */

export async function listQuickTodoItems(): Promise<QuickTodoItem[]> {
  const db = await getDB();
  const all = await db.getAll('quickTodoItems');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getQuickTodoItem(id: string): Promise<QuickTodoItem | undefined> {
  const db = await getDB();
  return db.get('quickTodoItems', id);
}

export async function saveQuickTodoItem(item: QuickTodoItem): Promise<void> {
  const db = await getDB();
  await db.put('quickTodoItems', item);
}

export async function deleteQuickTodoItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('quickTodoItems', id);
}
