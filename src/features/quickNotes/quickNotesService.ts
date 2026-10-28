import { generateId } from '../../utils/id';
import * as quickNotesRepository from './quickNotesRepository';
import type { QuickNote } from './types';

/** Thrown when the text submitted for a Quick Note is empty/whitespace-only -- callers show a specific message rather than silently saving a blank note. */
export class EmptyQuickNoteTextError extends Error {
  constructor() {
    super('Quick note text must not be empty');
    this.name = 'EmptyQuickNoteTextError';
  }
}

/**
 * Trims only leading/trailing whitespace of the note as a whole --
 * internal line breaks are never touched, so a multiline note's own
 * formatting is preserved exactly as typed (Section 3: "Preserve line
 * breaks in multiline notes").
 */
function requireTrimmedText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new EmptyQuickNoteTextError();
  }
  return trimmed;
}

export async function createQuickNote(text: string): Promise<QuickNote> {
  const now = new Date().toISOString();
  const note: QuickNote = {
    id: generateId(),
    text: requireTrimmedText(text),
    createdAt: now,
    updatedAt: now,
  };
  await quickNotesRepository.saveQuickNote(note);
  return note;
}

export async function updateQuickNoteText(id: string, text: string): Promise<QuickNote> {
  const existing = await quickNotesRepository.getQuickNote(id);
  if (!existing) {
    throw new Error(`Quick note ${id} not found`);
  }
  const updated: QuickNote = { ...existing, text: requireTrimmedText(text), updatedAt: new Date().toISOString() };
  await quickNotesRepository.saveQuickNote(updated);
  return updated;
}

/** Direct, permanent delete -- there is no archive/trash state for Quick Notes. */
export async function removeQuickNote(id: string): Promise<void> {
  await quickNotesRepository.deleteQuickNote(id);
}
