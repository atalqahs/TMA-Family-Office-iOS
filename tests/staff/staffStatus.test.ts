import { describe, expect, it } from 'vitest';
import { computeOccurrenceLevel, computeStaffStatus } from '../../src/features/staff/staffStatus';
import type { HouseholdStaff, StaffSalaryPayment, StaffSalarySchedule } from '../../src/features/staff/types';

const NOW = new Date(2026, 5, 15); // local June 15, 2026 — fixed, deterministic "today"

function staff(overrides: Partial<HouseholdStaff> = {}): HouseholdStaff {
  return {
    id: 'staff1',
    fullName: 'Ahmed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('staffStatus: residency/passport/civilId expiry states', () => {
  it('is green when every expiry date is far in the future', () => {
    const status = computeStaffStatus(
      staff({ civilIdExpiry: '2030-01-01', passportExpiry: '2030-01-01', residencyExpiry: '2030-01-01' }),
      [],
      [],
      [],
      NOW,
    );
    expect(status.level).toBe('green');
    expect(status.reasons).toEqual([]);
  });

  it('is orange when residency expires within the 30-day warning window', () => {
    const status = computeStaffStatus(staff({ residencyExpiry: '2026-06-30' }), [], [], [], NOW);
    expect(status.level).toBe('orange');
    expect(status.reasons[0].textKey).toBe('staffReasonResidencyExpiringSoon');
  });

  it('is red when passport has already expired', () => {
    const status = computeStaffStatus(staff({ passportExpiry: '2026-01-01' }), [], [], [], NOW);
    expect(status.level).toBe('red');
    expect(status.reasons[0].textKey).toBe('staffReasonPassportExpired');
  });

  it('is red when civil ID has already expired, even if other fields are fine', () => {
    const status = computeStaffStatus(
      staff({ civilIdExpiry: '2026-01-01', passportExpiry: '2030-01-01' }),
      [],
      [],
      [],
      NOW,
    );
    expect(status.level).toBe('red');
  });

  it('takes the WORST signal across multiple simultaneous issues', () => {
    const status = computeStaffStatus(
      staff({ civilIdExpiry: '2026-06-20', passportExpiry: '2026-01-01' }), // orange + red
      [],
      [],
      [],
      NOW,
    );
    expect(status.level).toBe('red');
    expect(status.reasons).toHaveLength(2);
  });

  it('skips missing expiry data entirely rather than inventing a warning', () => {
    const status = computeStaffStatus(staff(), [], [], [], NOW);
    expect(status.level).toBe('green');
  });
});

describe('staffStatus: salary grace-period occurrence levels', () => {
  it('a future due date is green, never a premature warning', () => {
    expect(computeOccurrenceLevel({ scheduleId: 's1', dueDate: '2026-07-01', amount: 100, paid: false }, '2026-06-15')).toBe(
      'green',
    );
  });

  it('a paid occurrence is always green regardless of date', () => {
    expect(computeOccurrenceLevel({ scheduleId: 's1', dueDate: '2026-01-01', amount: 100, paid: true }, '2026-06-15')).toBe(
      'green',
    );
  });

  it('is orange for the first 9 days past due (within the 10-day grace window)', () => {
    expect(computeOccurrenceLevel({ scheduleId: 's1', dueDate: '2026-06-01', amount: 100, paid: false }, '2026-06-09')).toBe(
      'orange',
    );
  });

  it('is red exactly at the 10-day grace boundary', () => {
    expect(computeOccurrenceLevel({ scheduleId: 's1', dueDate: '2026-06-01', amount: 100, paid: false }, '2026-06-11')).toBe(
      'red',
    );
  });

  it('is orange the day just before the 10-day boundary (day 9 past due)', () => {
    expect(computeOccurrenceLevel({ scheduleId: 's1', dueDate: '2026-06-01', amount: 100, paid: false }, '2026-06-10')).toBe(
      'orange',
    );
  });
});

describe('staffStatus: deterministic derived status via injected salary schedules', () => {
  const schedule: StaffSalarySchedule = {
    id: 's1',
    staffId: 'staff1',
    amount: 130,
    frequency: 'month',
    interval: 1,
    dueDayOfMonth: 1,
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('flags an unconfirmed overdue salary occurrence', () => {
    const status = computeStaffStatus(staff(), [], [schedule], [], NOW);
    expect(status.level).not.toBe('green');
    expect(status.reasons.some((r) => r.textKey === 'staffReasonSalaryUnconfirmed')).toBe(true);
  });

  it('is green once every due-or-past occurrence has a matching payment', () => {
    const payments: StaffSalaryPayment[] = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01'].map(
      (dueDate, i) => ({
        id: `p${i}`,
        staffId: 'staff1',
        salaryScheduleId: 's1',
        dueDate,
        amount: 130,
        paidDate: dueDate,
        createdAt: `${dueDate}T00:00:00.000Z`,
        updatedAt: `${dueDate}T00:00:00.000Z`,
      }),
    );
    const status = computeStaffStatus(staff(), [], [schedule], payments, NOW);
    expect(status.level).toBe('green');
  });

  it('running the same computation twice with the same inputs is perfectly deterministic', () => {
    const a = computeStaffStatus(staff(), [], [schedule], [], NOW);
    const b = computeStaffStatus(staff(), [], [schedule], [], NOW);
    expect(a).toEqual(b);
  });
});
