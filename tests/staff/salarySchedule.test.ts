import { describe, expect, it } from 'vitest';
import { generateOccurrences, getNextUnpaidOccurrence } from '../../src/features/staff/salarySchedule';
import type { StaffSalaryPayment, StaffSalarySchedule } from '../../src/features/staff/types';

/**
 * Permanent Phase 10.1 regression suite for the simplified salary
 * recurrence model (weekly/monthly/yearly, `startDate`-anchored, no
 * separate interval/due-day/due-month field). Covers the spec's
 * "SALARY RECURRENCE" items #12-25 and "NEXT PAYMENT" items #26-27,
 * #30-31.
 */
function schedule(overrides: Partial<StaffSalarySchedule> = {}): StaffSalarySchedule {
  return {
    id: 's1',
    staffId: 'staff1',
    amount: 130,
    recurrence: 'monthly',
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function payment(overrides: Partial<StaffSalaryPayment> = {}): StaffSalaryPayment {
  return {
    id: 'p1',
    staffId: 'staff1',
    salaryScheduleId: 's1',
    amount: 130,
    paidDate: '2026-01-02',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('generateOccurrences: weekly recurrence', () => {
  it('12. generates occurrences 7 calendar days apart, starting at startDate', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'weekly', startDate: '2026-01-01' }), '2026-02-01');
    expect(occurrences).toEqual(['2026-01-01', '2026-01-08', '2026-01-15', '2026-01-22', '2026-01-29']);
  });
});

describe('generateOccurrences: monthly recurrence', () => {
  it('13. generates occurrences on the same calendar day every month, anchored to startDate', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'monthly', startDate: '2026-09-22' }), '2026-12-22');
    expect(occurrences).toEqual(['2026-09-22', '2026-10-22', '2026-11-22', '2026-12-22']);
  });

  it('18. is calendar-month arithmetic, never "every 30 days" (Jan 1 -> Feb 1, not Jan 31)', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'monthly', startDate: '2026-01-01' }), '2026-03-01');
    expect(occurrences).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
  });
});

describe('generateOccurrences: yearly recurrence', () => {
  it('14. generates occurrences on the same calendar month/day every year, anchored to startDate', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'yearly', startDate: '2025-06-15' }), '2027-12-31');
    expect(occurrences).toEqual(['2025-06-15', '2026-06-15', '2027-06-15']);
  });

  it('19. is calendar-year arithmetic, never "every 365 days" (Jan 1 stays Jan 1, not affected by leap years elsewhere in the year)', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'yearly', startDate: '2024-01-01' }), '2027-01-01');
    expect(occurrences).toEqual(['2024-01-01', '2025-01-01', '2026-01-01', '2027-01-01']);
  });
});

describe('generateOccurrences: endDate stops generation', () => {
  it('16. never generates an occurrence past endDate', () => {
    const occurrences = generateOccurrences(
      schedule({ recurrence: 'monthly', startDate: '2026-01-01', endDate: '2026-03-01' }),
      '2026-12-31',
    );
    expect(occurrences).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
  });
});

describe('month-end anchor preservation (Section: MONTH-END RULE)', () => {
  it('20. Jan 30 -> Feb clamps to the last valid day -> Mar returns to the 30th (never permanently drifts to 28)', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'monthly', startDate: '2026-01-30' }), '2026-05-30');
    expect(occurrences).toEqual(['2026-01-30', '2026-02-28', '2026-03-30', '2026-04-30', '2026-05-30']);
  });

  it('21. Jan 31 -> Feb clamps to the last valid day -> Mar returns to the 31st, Apr clamps to 30, May returns to 31', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'monthly', startDate: '2026-01-31' }), '2026-05-31');
    expect(occurrences).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
  });

  it('22. the anchor day is re-derived from the ORIGINAL startDate every month, never chained from the previous (already-clamped) occurrence', () => {
    // If this were computed by chaining from Feb 28, March would stay
    // clamped at the 28th forever. Computed fresh from Jan 31, March
    // correctly returns to the 31st.
    const occurrences = generateOccurrences(schedule({ recurrence: 'monthly', startDate: '2026-01-31' }), '2026-03-31');
    expect(occurrences[2]).toBe('2026-03-31');
  });
});

describe('leap-year anchor preservation (Section: LEAP-YEAR / YEARLY RULE)', () => {
  it('23. a Feb-29 anchor clamps to Feb 28 in non-leap years and returns to Feb 29 when a leap year comes back around', () => {
    const occurrences = generateOccurrences(schedule({ recurrence: 'yearly', startDate: '2028-02-29' }), '2032-02-29');
    expect(occurrences).toEqual(['2028-02-29', '2029-02-28', '2030-02-28', '2031-02-28', '2032-02-29']);
  });
});

describe('no arbitrary recurrence interval or due-day required (Section: REMOVE OLD SALARY FIELDS)', () => {
  it('24-25. a schedule has no interval/dueDayOfMonth/dueMonth fields at all -- only recurrence + startDate drive every occurrence', () => {
    const s = schedule({ recurrence: 'monthly', startDate: '2026-01-15' });
    expect(s).not.toHaveProperty('interval');
    expect(s).not.toHaveProperty('dueDayOfMonth');
    expect(s).not.toHaveProperty('dueMonth');
    expect(generateOccurrences(s, '2026-03-15')).toEqual(['2026-01-15', '2026-02-15', '2026-03-15']);
  });
});

describe('getNextUnpaidOccurrence: earliest unpaid, never "first after today"', () => {
  it('26. returns the earliest unpaid occurrence when nothing has been paid', () => {
    const s = schedule({ recurrence: 'monthly', startDate: '2026-09-22' });
    const occurrence = getNextUnpaidOccurrence(s, []);
    expect(occurrence).toMatchObject({ dueDate: '2026-09-22', amount: 130, paid: false });
  });

  it('27. an overdue unpaid occurrence is never skipped just because a later one also exists -- September stays "next" even once October/November exist', () => {
    const s = schedule({ recurrence: 'monthly', startDate: '2026-09-22' });
    // Nothing paid yet, "today" is irrelevant to this function (it always
    // walks from the anchor) -- so even though October/November occurrences
    // exist in the underlying sequence, September (the earliest) wins.
    const occurrence = getNextUnpaidOccurrence(s, []);
    expect(occurrence?.dueDate).toBe('2026-09-22');
  });

  it('marking September paid advances Next Payment to October', () => {
    const s = schedule({ recurrence: 'monthly', startDate: '2026-09-22' });
    const occurrence = getNextUnpaidOccurrence(s, [payment({ dueDate: '2026-09-22' })]);
    expect(occurrence?.dueDate).toBe('2026-10-22');
  });

  it('30-31. a not-yet-due occurrence can be prepaid, and prepaying it advances Next Payment to the FOLLOWING occurrence (not back to the prepaid one)', () => {
    const s = schedule({ recurrence: 'monthly', startDate: '2026-09-22' });
    // September AND October both already confirmed (October prepaid ahead
    // of its own due date) -- November must be next.
    const occurrence = getNextUnpaidOccurrence(s, [
      payment({ dueDate: '2026-09-22' }),
      payment({ id: 'p2', dueDate: '2026-10-22' }),
    ]);
    expect(occurrence?.dueDate).toBe('2026-11-22');
  });

  it('returns undefined once every occurrence through endDate has been paid -- a fully-settled, ended schedule has no Next Payment', () => {
    const s = schedule({ recurrence: 'monthly', startDate: '2026-01-01', endDate: '2026-02-01' });
    const occurrence = getNextUnpaidOccurrence(s, [
      payment({ dueDate: '2026-01-01' }),
      payment({ id: 'p2', dueDate: '2026-02-01' }),
    ]);
    expect(occurrence).toBeUndefined();
  });

  it('never confuses two different schedules sharing the same due date', () => {
    const s = schedule({ id: 's1', recurrence: 'monthly', startDate: '2026-01-01' });
    // A payment for a DIFFERENT schedule with the same due date must not
    // count as paying this schedule's occurrence.
    const occurrence = getNextUnpaidOccurrence(s, [payment({ salaryScheduleId: 's2', dueDate: '2026-01-01' })]);
    expect(occurrence?.dueDate).toBe('2026-01-01');
  });
});
