import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { createTask } from '../../src/features/tasks/taskService';
import { CalendarPage } from '../../src/pages/CalendarPage';
import { TaskCalendarPage } from '../../src/pages/TaskCalendarPage';
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

/**
 * Regression coverage for the spec's "two distinct calendar experiences
 * must coexist" requirement: Tasks & Reminders' own calendar (reached via
 * its own calendar icon) must keep showing Tasks-only data and must never
 * accidentally pick up another module's events, while the General
 * Calendar aggregates across every module including Tasks.
 */
describe('Tasks Calendar vs. General Calendar isolation', () => {
  it('a Family event and a Task due on the same day: the Tasks Calendar shows only the Task, the General Calendar shows both', async () => {
    const today = getLocalToday();
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Sara',
      civilIdExpiryDate: today,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({ groupId: 'g1', title: 'Water the plants', priority: 'normal', recurrenceUnit: 'none', dueDate: today });

    renderWithLocale(
      <MemoryRouter>
        <TaskCalendarPage />
      </MemoryRouter>,
      'en',
    );
    await waitFor(() => expect(screen.getByText('Water the plants')).toBeInTheDocument());
    expect(screen.queryByText(/Civil ID/)).not.toBeInTheDocument();
  });

  it('the General Calendar shows both the Family event and the Task on the same day', async () => {
    const today = getLocalToday();
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Sara',
      civilIdExpiryDate: today,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({ groupId: 'g1', title: 'Water the plants', priority: 'normal', recurrenceUnit: 'none', dueDate: today });

    renderWithLocale(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
      'en',
    );
    await waitFor(() => expect(screen.getByText('Water the plants')).toBeInTheDocument());
    expect(screen.getByText(/Civil ID/)).toBeInTheDocument();
  });
});
