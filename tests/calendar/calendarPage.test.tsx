import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import * as familyRepository from '../../src/features/family/familyRepository';
import { CompactCalendar } from '../../src/features/calendar/components/CompactCalendar';
import { CalendarPage } from '../../src/pages/CalendarPage';
import { LanguageContext } from '../../src/localization/language-context';
import { LOCALE_DIR, translations, type Locale } from '../../src/localization/translations';
import { getLocalToday } from '../../src/utils/localDate';

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

describe('CalendarPage (expanded General Calendar)', () => {
  it('shows the exact Arabic empty-state copy when the selected date has no events', async () => {
    renderWithLocale(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
      'ar',
    );
    await waitFor(() => expect(screen.getByText('لا توجد أحداث في هذا التاريخ.')).toBeInTheDocument());
  });

  it('shows the exact English empty-state copy when the selected date has no events', async () => {
    renderWithLocale(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
      'en',
    );
    await waitFor(() => expect(screen.getByText('No events on this date.')).toBeInTheDocument());
  });

  it("today's events (the default selected date) render the event's title, category label, and tapping navigates to the real source record", async () => {
    const today = getLocalToday();
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Sara',
      civilIdExpiryDate: today,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    renderWithLocale(
      <MemoryRouter initialEntries={['/calendar']}>
        <Routes>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/family/:memberId" element={<div>Family Profile Page</div>} />
        </Routes>
      </MemoryRouter>,
      'en',
    );

    const row = await screen.findByRole('button', { name: /Sara's Civil ID/ });
    expect(row.textContent).toContain('Family');
    fireEvent.click(row);
    expect(await screen.findByText('Family Profile Page')).toBeInTheDocument();
  });
});

describe('CompactCalendar (Dashboard widget)', () => {
  it('renders the General Calendar title with no "View Full Calendar" button', async () => {
    renderWithLocale(
      <MemoryRouter initialEntries={['/']}>
        <CompactCalendar />
      </MemoryRouter>,
      'en',
    );

    await waitFor(() => expect(screen.getByText('General Calendar')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'View Full Calendar' })).not.toBeInTheDocument();
  });

  it('selects a tapped day in place, without navigating away', async () => {
    renderWithLocale(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<CompactCalendar />} />
          <Route path="/calendar" element={<div>Full Calendar Page</div>} />
        </Routes>
      </MemoryRouter>,
      'en',
    );

    await waitFor(() => expect(screen.getByText('No events on this date.')).toBeInTheDocument());
    // Day 15 never collides with a padding day from an adjacent month (the
    // grid only ever pads a handful of days at either edge), so this is
    // the one day number guaranteed to render exactly once.
    const day15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15);

    await waitFor(() => expect(day15.className).toContain('calendar-month-grid__day--selected'));
    expect(screen.queryByText('Full Calendar Page')).not.toBeInTheDocument();
  });

  it('changing months in place updates the month label and keeps selection within the grid, without navigating away', async () => {
    renderWithLocale(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<CompactCalendar />} />
          <Route path="/calendar" element={<div>Full Calendar Page</div>} />
        </Routes>
      </MemoryRouter>,
      'en',
    );

    await waitFor(() => expect(screen.getByText('General Calendar')).toBeInTheDocument());
    const monthLabelBefore = screen.getByText(/\d{4}/).textContent;

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await waitFor(() => expect(screen.getByText(/\d{4}/).textContent).not.toBe(monthLabelBefore));
    expect(screen.queryByText('Full Calendar Page')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    await waitFor(() => expect(screen.getByText(/\d{4}/).textContent).toBe(monthLabelBefore));
  });

  it("shows today's event in the compact widget and tapping it navigates straight to the source record", async () => {
    const today = getLocalToday();
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Layla',
      passportExpiryDate: today,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    renderWithLocale(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<CompactCalendar />} />
          <Route path="/family/:memberId" element={<div>Family Profile Page</div>} />
        </Routes>
      </MemoryRouter>,
      'en',
    );

    const row = await screen.findByRole('button', { name: /Layla's Passport/ });
    fireEvent.click(row);
    expect(await screen.findByText('Family Profile Page')).toBeInTheDocument();
  });
});
