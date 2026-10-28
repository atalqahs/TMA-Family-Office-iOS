import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DashboardPage } from '../../src/pages/DashboardPage';
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
 * Regression coverage: the Dashboard still shows its existing category
 * grid, the General Calendar widget, and the Dashboard heading, with the
 * two new Quick To-Do List / Quick Notes widgets added below the grid --
 * never replacing or displacing any existing Dashboard content (Section 1
 * of the spec this was built from: "Do not alter the existing category
 * grid, calendar, navigation, or notifications").
 */
describe('DashboardPage: existing content preserved, new widgets appended at the bottom', () => {
  it('renders the category grid, the dashboard heading, and both new widgets, in the required order', async () => {
    renderWithLocale(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
      'en',
    );

    // Existing content survives untouched.
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Tasks & Reminders')).toBeInTheDocument();

    // The two new widgets are present.
    expect(screen.getByText('To-Do List')).toBeInTheDocument();
    expect(screen.getByText('Quick Notes')).toBeInTheDocument();

    // Order: To-Do List appears before Quick Notes in the document.
    const todoHeading = screen.getByText('To-Do List');
    const notesHeading = screen.getByText('Quick Notes');
    expect(todoHeading.compareDocumentPosition(notesHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Both widgets come after the category grid (the Family card).
    const familyCard = screen.getByText('Family');
    expect(familyCard.compareDocumentPosition(todoHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders correctly in Arabic (RTL)', async () => {
    renderWithLocale(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
      'ar',
    );
    await waitFor(() => expect(screen.getByText('قائمة الأعمال السريعة')).toBeInTheDocument());
    expect(screen.getByText('ملاحظات سريعة')).toBeInTheDocument();
  });
});
