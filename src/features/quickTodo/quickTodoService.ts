import { generateId } from '../../utils/id';
import * as quickTodoRepository from './quickTodoRepository';
import type { QuickTodoItem } from './types';

/** Thrown when the text submitted for a Quick To-Do item is empty/whitespace-only -- callers show a specific message rather than silently saving a blank item. */
export class EmptyQuickTodoTextError extends Error {
  constructor() {
    super('Quick to-do text must not be empty');
    this.name = 'EmptyQuickTodoTextError';
  }
}

function requireTrimmedText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new EmptyQuickTodoTextError();
  }
  return trimmed;
}

export async function createQuickTodoItem(text: string): Promise<QuickTodoItem> {
  const now = new Date().toISOString();
  const item: QuickTodoItem = {
    id: generateId(),
    text: requireTrimmedText(text),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  await quickTodoRepository.saveQuickTodoItem(item);
  return item;
}

export async function updateQuickTodoItemText(id: string, text: string): Promise<QuickTodoItem> {
  const existing = await quickTodoRepository.getQuickTodoItem(id);
  if (!existing) {
    throw new Error(`Quick to-do item ${id} not found`);
  }
  const updated: QuickTodoItem = { ...existing, text: requireTrimmedText(text), updatedAt: new Date().toISOString() };
  await quickTodoRepository.saveQuickTodoItem(updated);
  return updated;
}

/** Flips `completed` -- the one and only way an item's completion state changes (both marking done and un-marking it, per Section 2's "allow unchecking a completed item"). */
export async function toggleQuickTodoItemCompleted(id: string): Promise<QuickTodoItem> {
  const existing = await quickTodoRepository.getQuickTodoItem(id);
  if (!existing) {
    throw new Error(`Quick to-do item ${id} not found`);
  }
  const updated: QuickTodoItem = { ...existing, completed: !existing.completed, updatedAt: new Date().toISOString() };
  await quickTodoRepository.saveQuickTodoItem(updated);
  return updated;
}

/** Direct, permanent delete -- there is no archive/trash state for Quick To-Do items. */
export async function removeQuickTodoItem(id: string): Promise<void> {
  await quickTodoRepository.deleteQuickTodoItem(id);
}

/** The small, discreet "incomplete items" counter (Section 2) -- always derived, never stored. */
export function countIncompleteQuickTodoItems(items: QuickTodoItem[]): number {
  return items.filter((item) => !item.completed).length;
}

/**
 * Display order: every incomplete item first (oldest first), then every
 * completed item after (oldest first) -- keeps what's still outstanding
 * at the top while completed items stay fully visible and reachable
 * (Section 2: "Keep completed items accessible until the user deletes
 * them") rather than being hidden or auto-removed. Pure and derived --
 * never persisted as its own ordering.
 */
export function sortQuickTodoItemsForDisplay(items: QuickTodoItem[]): QuickTodoItem[] {
  return [...items].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
