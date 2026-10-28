import { describe, expect, it } from 'vitest';
import * as quickNotesRepository from '../../src/features/quickNotes/quickNotesRepository';
import {
  createQuickNote,
  EmptyQuickNoteTextError,
  removeQuickNote,
  updateQuickNoteText,
} from '../../src/features/quickNotes/quickNotesService';

describe('createQuickNote', () => {
  it('creates a note and trims leading/trailing whitespace', async () => {
    const note = await createQuickNote('  Remember an idea for later  ');
    expect(note.text).toBe('Remember an idea for later');
    expect(await quickNotesRepository.getQuickNote(note.id)).toMatchObject({ text: 'Remember an idea for later' });
  });

  it('preserves internal multiline line breaks exactly', async () => {
    const multiline = 'The driver needs:\n- Oil change\n- New tires';
    const note = await createQuickNote(multiline);
    expect(note.text).toBe(multiline);
  });

  it('rejects empty/whitespace-only text without writing anything', async () => {
    await expect(createQuickNote('   \n  ')).rejects.toThrow(EmptyQuickNoteTextError);
    expect(await quickNotesRepository.listQuickNotes()).toEqual([]);
  });
});

describe('updateQuickNoteText', () => {
  it('edits an existing note\'s text, leaving createdAt untouched', async () => {
    const note = await createQuickNote('A family member might travel soon');
    const updated = await updateQuickNoteText(note.id, 'A family member might travel next month');
    expect(updated.text).toBe('A family member might travel next month');
    expect(updated.createdAt).toBe(note.createdAt);
  });

  it('rejects empty text on edit', async () => {
    const note = await createQuickNote('General household observation');
    await expect(updateQuickNoteText(note.id, '')).rejects.toThrow(EmptyQuickNoteTextError);
  });

  it('throws for a non-existent note', async () => {
    await expect(updateQuickNoteText('missing', 'text')).rejects.toThrow();
  });
});

describe('removeQuickNote', () => {
  it('permanently deletes a note', async () => {
    const note = await createQuickNote('Temporary note');
    await removeQuickNote(note.id);
    expect(await quickNotesRepository.getQuickNote(note.id)).toBeUndefined();
  });
});

describe('multiple independent notes', () => {
  it('supports several notes coexisting independently', async () => {
    await createQuickNote('Note one');
    await createQuickNote('Note two');
    await createQuickNote('Note three');
    const notes = await quickNotesRepository.listQuickNotes();
    expect(notes).toHaveLength(3);
    expect(notes.map((n) => n.text).sort()).toEqual(['Note one', 'Note three', 'Note two']);
  });
});
