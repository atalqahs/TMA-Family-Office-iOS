import { getDB } from '../../storage/db';
import type { QuickNote } from './types';

/**
 * All IndexedDB access for the Quick Notes widget goes through this
 * file. Presentation components and hooks never call `getDB()`/idb
 * directly -- they go through this repository (or `quickNotesService.ts`,
 * which builds on it) instead.
 */

export async function listQuickNotes(): Promise<QuickNote[]> {
  const db = await getDB();
  const all = await db.getAll('quickNotes');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getQuickNote(id: string): Promise<QuickNote | undefined> {
  const db = await getDB();
  return db.get('quickNotes', id);
}

export async function saveQuickNote(note: QuickNote): Promise<void> {
  const db = await getDB();
  await db.put('quickNotes', note);
}

export async function deleteQuickNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('quickNotes', id);
}
