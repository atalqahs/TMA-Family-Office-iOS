import { describe, expect, it } from 'vitest';
import { getCurrentOccurrence, getOccurrenceDatesInRange } from '../../src/features/tasks/taskRecurrence';
import { UNSCHEDULED_OCCURRENCE_KEY } from '../../src/features/tasks/types';
import type { Task } from '../../src/features/tasks/types';

function task(overrides: Partial<Task> = {}): Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'> {
  return { dueDate: '2026-01-15', recurrenceUnit: 'none', recurrenceInterval: undefined, ...overrides };
}

describe('Recurrence: undated task', () => {
  it('an undated task has exactly one occurrence, keyed by the UNSCHEDULED sentinel', () => {
    const occurrence = getCurrentOccurrence(task({ dueDate: undefined }), new Set());
    expect(occurrence).toEqual({ occurrenceKey: UNSCHEDULED_OCCURRENCE_KEY, occurrenceDate: undefined });
  });

  it('an undated task has no calendar presence at all', () => {
    expect(getOccurrenceDatesInRange(task({ dueDate: undefined }), '2026-01-01', '2026-12-31')).toEqual([]);
  });
});

describe('Recurrence: one-time dated task', () => {
  it('has exactly one occurrence: its own dueDate', () => {
    const occurrence = getCurrentOccurrence(task(), new Set());
    expect(occurrence).toEqual({ occurrenceKey: '2026-01-15', occurrenceDate: '2026-01-15' });
  });

  it('appears in getOccurrenceDatesInRange only when its date falls inside the range', () => {
    expect(getOccurrenceDatesInRange(task(), '2026-01-01', '2026-01-31')).toEqual(['2026-01-15']);
    expect(getOccurrenceDatesInRange(task(), '2026-02-01', '2026-02-28')).toEqual([]);
  });
});

describe('Recurrence: daily/weekly/monthly/yearly anchor-based math', () => {
  it('day recurrence advances by interval days from the fixed anchor', () => {
    const t = task({ recurrenceUnit: 'day', recurrenceInterval: 3 });
    expect(getCurrentOccurrence(t, new Set(['2026-01-15', '2026-01-18'])).occurrenceKey).toBe('2026-01-21');
  });

  it('week recurrence advances by interval*7 days from the fixed anchor', () => {
    const t = task({ recurrenceUnit: 'week', recurrenceInterval: 2 });
    expect(getCurrentOccurrence(t, new Set()).occurrenceKey).toBe('2026-01-15');
    expect(getCurrentOccurrence(t, new Set(['2026-01-15'])).occurrenceKey).toBe('2026-01-29');
  });

  it('month recurrence never permanently drifts to a clamped day (Jan 31 monthly stays on 31 whenever possible)', () => {
    const t = task({ dueDate: '2026-01-31', recurrenceUnit: 'month', recurrenceInterval: 1 });
    // occurrence 0: Jan 31, occurrence 1: Feb 28 (clamped), occurrence 2: Mar 31 (back to 31, not stuck on 28)
    expect(getCurrentOccurrence(t, new Set(['2026-01-31', '2026-02-28'])).occurrenceKey).toBe('2026-03-31');
  });

  it('year recurrence advances by interval*12 months from the fixed anchor', () => {
    const t = task({ dueDate: '2024-02-29', recurrenceUnit: 'year', recurrenceInterval: 1 });
    // Feb 29 anchor in a leap year -> next occurrence clamps to Feb 28 in a non-leap year
    expect(getCurrentOccurrence(t, new Set(['2024-02-29'])).occurrenceKey).toBe('2025-02-28');
  });
});

describe('Recurrence: oldest-uncompleted-occurrence rule (never silently skip an overdue occurrence)', () => {
  it('stays on the oldest uncompleted occurrence even when several later ones would otherwise be "due"', () => {
    const t = task({ dueDate: '2026-01-01', recurrenceUnit: 'month', recurrenceInterval: 1 });
    // August (n=7) occurrence never completed -- must stay there, not jump to the newest.
    const completed = new Set(['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01']);
    expect(getCurrentOccurrence(t, completed).occurrenceKey).toBe('2026-08-01');
  });

  it('advances past a completed occurrence to the next uncompleted one', () => {
    const t = task({ recurrenceUnit: 'day', recurrenceInterval: 1 });
    expect(getCurrentOccurrence(t, new Set(['2026-01-15'])).occurrenceKey).toBe('2026-01-16');
  });
});

describe('getOccurrenceDatesInRange: calendar range listing', () => {
  it('includes both past and future occurrences regardless of completion state', () => {
    const t = task({ recurrenceUnit: 'week', recurrenceInterval: 1 });
    const dates = getOccurrenceDatesInRange(t, '2026-01-01', '2026-02-28');
    expect(dates).toContain('2026-01-15');
    expect(dates).toContain('2026-01-22');
    expect(dates.length).toBeGreaterThan(2);
  });

  it('returns an empty array when the range is entirely before the anchor date', () => {
    const t = task({ dueDate: '2026-06-01', recurrenceUnit: 'month', recurrenceInterval: 1 });
    expect(getOccurrenceDatesInRange(t, '2026-01-01', '2026-01-31')).toEqual([]);
  });
});
