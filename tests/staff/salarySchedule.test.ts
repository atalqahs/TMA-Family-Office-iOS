import { describe, expect, it } from 'vitest';
import { buildScheduleOccurrences, generateOccurrences, nextOccurrenceAfter } from '../../src/features/staff/salarySchedule';
import type { StaffSalarySchedule } from '../../src/features/staff/types';

function schedule(overrides: Partial<StaffSalarySchedule> = {}): StaffSalarySchedule {
  return {
    id: 's1',
    staffId: 'staff1',
    amount: 130,
    frequency: 'month',
    interval: 1,
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('salarySchedule: every-N-days frequency', () => {
  it('generates occurrences every N days starting at startDate', () => {
    const occurrences = generateOccurrences(
      schedule({ frequency: 'day', interval: 14, startDate: '2026-01-01' }),
      '2026-02-15',
    );
    expect(occurrences).toEqual(['2026-01-01', '2026-01-15', '2026-01-29', '2026-02-12']);
  });
});

describe('salarySchedule: every-N-months frequency', () => {
  it('generates occurrences on the configured day of every Nth month', () => {
    const occurrences = generateOccurrences(
      schedule({ frequency: 'month', interval: 2, dueDayOfMonth: 5, startDate: '2026-01-01' }),
      '2026-07-01',
    );
    expect(occurrences).toEqual(['2026-01-05', '2026-03-05', '2026-05-05']);
  });

  it('clamps a day-of-month that does not exist in a shorter month', () => {
    const occurrences = generateOccurrences(
      schedule({ frequency: 'month', interval: 1, dueDayOfMonth: 31, startDate: '2026-01-31' }),
      '2026-03-01',
    );
    expect(occurrences).toEqual(['2026-01-31', '2026-02-28']);
  });
});

describe('salarySchedule: every-N-years frequency', () => {
  it('generates occurrences on the configured month/day every Nth year', () => {
    const occurrences = generateOccurrences(
      schedule({ frequency: 'year', interval: 1, dueMonth: 6, dueDayOfMonth: 15, startDate: '2025-01-01' }),
      '2027-12-31',
    );
    expect(occurrences).toEqual(['2025-06-15', '2026-06-15', '2027-06-15']);
  });
});

describe('salarySchedule: endDate stops generation', () => {
  it('never generates an occurrence past endDate', () => {
    const occurrences = generateOccurrences(
      schedule({ frequency: 'month', interval: 1, dueDayOfMonth: 1, startDate: '2026-01-01', endDate: '2026-03-01' }),
      '2026-12-31',
    );
    expect(occurrences).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
  });
});

describe('nextOccurrenceAfter', () => {
  it('finds the single next occurrence strictly after the given date', () => {
    const s = schedule({ frequency: 'month', interval: 1, dueDayOfMonth: 1, startDate: '2026-01-01' });
    expect(nextOccurrenceAfter(s, '2026-01-01')).toBe('2026-02-01');
  });
});

describe('buildScheduleOccurrences: paid/unpaid marking', () => {
  it('marks occurrences paid only when a matching payment exists for that exact due date', () => {
    const s = schedule({ frequency: 'month', interval: 1, dueDayOfMonth: 1, startDate: '2026-01-01' });
    const occurrences = buildScheduleOccurrences(
      s,
      [
        {
          id: 'p1',
          staffId: 'staff1',
          salaryScheduleId: 's1',
          dueDate: '2026-01-01',
          amount: 130,
          paidDate: '2026-01-02',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      '2026-02-01',
    );
    const jan = occurrences.find((o) => o.dueDate === '2026-01-01');
    const feb = occurrences.find((o) => o.dueDate === '2026-02-01');
    expect(jan?.paid).toBe(true);
    expect(feb?.paid).toBe(false);
  });

  it('includes the single next upcoming occurrence beyond today, unmarked', () => {
    const s = schedule({ frequency: 'month', interval: 1, dueDayOfMonth: 1, startDate: '2026-01-01' });
    const occurrences = buildScheduleOccurrences(s, [], '2026-01-15');
    expect(occurrences.map((o) => o.dueDate)).toEqual(['2026-01-01', '2026-02-01']);
  });
});
