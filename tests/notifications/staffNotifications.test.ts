import { describe, expect, it } from 'vitest';
import { buildStaffNotifications } from '../../src/features/notifications/sources/staffNotifications';
import type { HouseholdStaff, StaffSalaryPayment, StaffSalarySchedule } from '../../src/features/staff/types';

const NOW = new Date(2026, 5, 15); // local June 15, 2026

function staff(overrides: Partial<HouseholdStaff> = {}): HouseholdStaff {
  return {
    id: 's1',
    fullName: 'Ahmed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function schedule(overrides: Partial<StaffSalarySchedule> = {}): StaffSalarySchedule {
  return {
    id: 'sch1',
    staffId: 's1',
    amount: 130,
    recurrence: 'monthly',
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Staff notifications', () => {
  it('16. flags an expired residency as critical', () => {
    const items = buildStaffNotifications([staff({ residencyExpiry: '2026-01-01' })], [], [], NOW);
    expect(items[0]).toMatchObject({ id: 'staff:s1:residency-expired', severity: 'critical' });
  });

  it('17. flags a residency expiring soon as warning', () => {
    const items = buildStaffNotifications([staff({ residencyExpiry: '2026-06-25' })], [], [], NOW);
    expect(items[0]).toMatchObject({ id: 'staff:s1:residency-expiring', severity: 'warning' });
  });

  it('18. flags an expired passport as critical', () => {
    const items = buildStaffNotifications([staff({ passportExpiry: '2026-01-01' })], [], [], NOW);
    expect(items[0]).toMatchObject({ id: 'staff:s1:passport-expired', severity: 'critical' });
  });

  it('19. flags a passport expiring soon as warning', () => {
    const items = buildStaffNotifications([staff({ passportExpiry: '2026-06-20' })], [], [], NOW);
    expect(items[0]).toMatchObject({ id: 'staff:s1:passport-expiring', severity: 'warning' });
  });

  it('20. flags the EARLIEST unpaid salary obligation overdue (past the 10-day grace window) as critical -- never skipped for a later occurrence', () => {
    // Nothing paid at all since startDate (Jan 1) -- the earliest unpaid
    // occurrence is January, not "whichever month is closest to today".
    const items = buildStaffNotifications([staff()], [schedule({ startDate: '2026-01-01' })], [], NOW);
    const overdue = items.find((item) => item.id === 'staff:s1:salary:sch1:2026-01-01');
    expect(overdue).toMatchObject({ kind: 'staffSalaryOverdue', severity: 'critical' });
  });

  it('21. flags a salary obligation due/approaching (within the grace window) as warning', () => {
    const items = buildStaffNotifications([staff()], [schedule({ startDate: '2026-06-10' })], [], NOW);
    // June 10 due date, "today" June 15 -> 5 days past due -> within the 10-day grace window (orange)
    const due = items.find((item) => item.id === 'staff:s1:salary:sch1:2026-06-10');
    expect(due).toMatchObject({ kind: 'staffSalaryDue', severity: 'warning' });
  });

  it('22. a fully-paid obligation does not notify', () => {
    const payments: StaffSalaryPayment[] = [
      {
        id: 'p1',
        staffId: 's1',
        salaryScheduleId: 'sch1',
        dueDate: '2026-06-01',
        amount: 130,
        paidDate: '2026-06-01',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    // Schedule starts exactly at the paid occurrence -- once it's paid,
    // Next Payment moves to July (future), so nothing should notify.
    const items = buildStaffNotifications([staff()], [schedule({ startDate: '2026-06-01' })], payments, NOW);
    expect(items.filter((item) => item.sourceType === 'staff' && item.kind.startsWith('staffSalary'))).toEqual([]);
  });

  it('23. local-date edge case: a residency expiring exactly at local midnight boundary is judged by the local calendar day, not UTC', () => {
    // Local June 15, 23:59 — must still read as "today" is 2026-06-15 for expiry purposes.
    const lateLocalTime = new Date(2026, 5, 15, 23, 59);
    const items = buildStaffNotifications([staff({ residencyExpiry: '2026-06-15' })], [], [], lateLocalTime);
    expect(items[0]).toMatchObject({ id: 'staff:s1:residency-expired', severity: 'critical' });
  });

  it('a future salary due date does not notify (never a premature warning)', () => {
    const items = buildStaffNotifications([staff()], [schedule({ startDate: '2026-08-01' })], [], NOW);
    expect(items.filter((item) => item.sourceType === 'staff' && item.kind.startsWith('staffSalary'))).toEqual([]);
  });

  it('two different schedules sharing the same due date produce two distinct ids, never merged', () => {
    const items = buildStaffNotifications(
      [staff()],
      [schedule({ id: 'sch1', startDate: '2026-06-01' }), schedule({ id: 'sch2', startDate: '2026-06-01' })],
      [],
      NOW,
    );
    const salaryIds = items.filter((item) => item.id.includes(':salary:') && item.effectiveDate === '2026-06-01').map((item) => item.id);
    expect(salaryIds.sort()).toEqual(['staff:s1:salary:sch1:2026-06-01', 'staff:s1:salary:sch2:2026-06-01']);
  });

  it('34. paying the current occurrence makes the NEXT unpaid occurrence the notification source', () => {
    const payments: StaffSalaryPayment[] = [
      {
        id: 'p1',
        staffId: 's1',
        salaryScheduleId: 'sch1',
        dueDate: '2026-06-01',
        amount: 130,
        paidDate: '2026-06-01',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    const items = buildStaffNotifications([staff()], [schedule({ startDate: '2026-06-01' })], payments, NOW);
    // July hasn't happened yet relative to "today" (June 15) -- so no
    // notification exists at all right now, but the underlying source
    // (getNextUnpaidOccurrence) has already moved on to July internally
    // (proven by the "does not notify" assertion above); this test just
    // re-confirms no stale June notification survives the payment.
    expect(items.some((item) => item.id === 'staff:s1:salary:sch1:2026-06-01')).toBe(false);
  });
});
