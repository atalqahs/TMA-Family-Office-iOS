import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { QuickNotesWidget } from '../../src/features/quickNotes/components/QuickNotesWidget';
import { LanguageContext } from '../../src/localization/language-context';
import { LOCALE_DIR, translations, type Locale } from '../../src/localization/translations';

function renderWithLocale(ui: ReactElement, locale: Locale) {
  const value = {
    locale,
    dir: LOCALE_DIR[locale],
    setLocale: async () => true,
    toggleLocale: () => {},
    localeSaveError: false,
    t: (key: keyof (typeof translations)['ar']) => translations[locale][key],
  };
  return render(<LanguageContext.Provider value={value}>{ui}</LanguageContext.Provider>);
}

/**
 * Waits for `text` to appear as a rendered note (a `.quick-notes-widget__text`
 * paragraph) specifically -- never matching the add textarea's own typed
 * content, which (unlike a plain `<input>`) a controlled `<textarea>`
 * renders as a real child text node in the DOM and so WOULD otherwise be
 * found by a plain `getByText`/`findByText` call, resolving before the
 * actual async save completes.
 */
function findRenderedNoteText(text: string) {
  return waitFor(() => {
    const match = Array.from(document.querySelectorAll('.quick-notes-widget__text')).find(
      (el) => el.textContent === text,
    );
    expect(match).toBeTruthy();
  });
}

async function addNote(text: string) {
  const textarea = screen.getByPlaceholderText('Add a quick note…');
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
  await findRenderedNoteText(text);
}

describe('QuickNotesWidget: empty state', () => {
  it('shows the exact English empty-state copy with no notes', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
  });

  it('shows the exact Arabic empty-state copy with no notes', async () => {
    renderWithLocale(<QuickNotesWidget />, 'ar');
    await waitFor(() => expect(screen.getByText('لا توجد ملاحظات حالياً.')).toBeInTheDocument());
  });
});

describe('QuickNotesWidget: adding notes', () => {
  it('adds a new note and clears the input afterward', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
    await addNote('Remember an idea for later');
    expect(screen.getByPlaceholderText('Add a quick note…')).toHaveValue('');
    expect(screen.queryByText('No notes yet.')).not.toBeInTheDocument();
  });

  it('preserves multiline line breaks exactly as typed', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
    const multiline = 'The driver needs:\nOil change\nNew tires';
    await addNote(multiline);
    const paragraph = screen.getByText(/The driver needs/);
    expect(paragraph.textContent).toBe(multiline);
  });

  it('the add button stays disabled for blank input', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add note' })).toBeDisabled());
  });

  it('supports multiple independent notes', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
    await addNote('Note one');
    await addNote('Note two');
    expect(screen.getByText('Note one')).toBeInTheDocument();
    expect(screen.getByText('Note two')).toBeInTheDocument();
  });
});

describe('QuickNotesWidget: editing and deleting', () => {
  it('editing a note updates its displayed text', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
    await addNote('Original note text');

    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    const editArea = screen.getByDisplayValue('Original note text');
    fireEvent.change(editArea, { target: { value: 'Updated note text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Updated note text')).toBeInTheDocument();
  });

  it('canceling an edit leaves the original note untouched', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
    await addNote('Original note text');

    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    const editArea = screen.getByDisplayValue('Original note text');
    fireEvent.change(editArea, { target: { value: 'Discarded edit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Original note text')).toBeInTheDocument();
    expect(screen.queryByText('Discarded edit')).not.toBeInTheDocument();
  });

  it('deleting a note removes it and the empty state returns when it was the last one', async () => {
    renderWithLocale(<QuickNotesWidget />, 'en');
    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
    await addNote('Temporary note');

    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }));

    await waitFor(() => expect(screen.getByText('No notes yet.')).toBeInTheDocument());
  });
});
