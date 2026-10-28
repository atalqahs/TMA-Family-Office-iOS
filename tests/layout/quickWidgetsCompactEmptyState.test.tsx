import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { QuickNotesWidget } from '../../src/features/quickNotes/components/QuickNotesWidget';
import { QuickTodoWidget } from '../../src/features/quickTodo/components/QuickTodoWidget';
import { LanguageContext } from '../../src/localization/language-context';
import { LOCALE_DIR, translations, type Locale } from '../../src/localization/translations';

/**
 * Regression coverage for the "bulky, especially when empty" complaint:
 * both widgets used to render the shared, full-page-sized <EmptyState>
 * (its own border + large margin/padding) stacked inside the widget's
 * own already-bordered card -- three nested bordered boxes around a
 * single line of text. They now render a lightweight, borderless
 * paragraph instead. <EmptyState> itself is left untouched, since ~28
 * other, full-page call sites still rely on its larger treatment.
 */

function renderWithLocale(ui: ReactElement) {
  const locale: Locale = 'en';
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

describe('QuickTodoWidget: compact empty state', () => {
  it('shows the empty-state text without the heavy shared EmptyState card', async () => {
    renderWithLocale(<QuickTodoWidget />);
    const empty = await waitFor(() => screen.getByText('No quick tasks yet.'));
    expect(document.querySelector('.empty-state')).toBeNull();
    expect(empty.className).toContain('quick-todo-widget__empty');
  });
});

describe('QuickNotesWidget: compact empty state', () => {
  it('shows the empty-state text without the heavy shared EmptyState card', async () => {
    renderWithLocale(<QuickNotesWidget />);
    const empty = await waitFor(() => screen.getByText('No notes yet.'));
    expect(document.querySelector('.empty-state')).toBeNull();
    expect(empty.className).toContain('quick-notes-widget__empty');
  });
});
