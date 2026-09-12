import { addLocalDays, addLocalMonths } from '../../utils/localDate';
import type { StaffSalaryPayment, StaffSalarySchedule } from './types';

/** Safety cap against runaway generation/lookup on malformed data. */
const MAX_OCCURRENCES = 2000;

/**
 * The Nth occurrence date (0-based) computed fresh from `schedule.startDate`
 * every time -- never by chaining from a previously computed occurrence.
 * This is what preserves the ORIGINAL anchor day/month across month-end
 * clamping and leap years (Section: month-end/leap-year rules) rather than
 * permanently drifting to a clamped day once one occurs — the exact same
 * principle Tasks' own recurrence relies on (see taskRecurrence.ts), reused
 * here via the shared, neutral `utils/localDate.ts` helpers (Staff does not
 * depend on Tasks). `addLocalMonths` already implements
 * `min(originalAnchorDay, lastDayOfTargetMonth)` for each target month
 * independently, and re-derives it from `schedule.startDate`'s own day on
 * every call, so:
 *   - monthly: calendar-month arithmetic (never "every 30 days").
 *   - yearly: calendar-year arithmetic (never "every 365 days"), and a
 *     Feb-29 anchor correctly returns on the next leap year rather than
 *     permanently drifting to Feb 28.
 *   - weekly: plain 7-calendar-day steps (no clamping needed).
 */
function occurrenceAt(schedule: Pick<StaffSalarySchedule, 'startDate' | 'recurrence'>, n: number): string {
  if (n === 0) return schedule.startDate;
  switch (schedule.recurrence) {
    case 'weekly':
      return addLocalDays(schedule.startDate, n * 7);
    case 'monthly':
      return addLocalMonths(schedule.startDate, n);
    case 'yearly':
      return addLocalMonths(schedule.startDate, n * 12);
  }
}

/**
 * Every occurrence date for `schedule`, from `startDate` through `through`
 * (inclusive), respecting `endDate`. Pure and deterministic — nothing is
 * persisted; occurrences are recomputed on demand rather than pre-created.
 */
export function generateOccurrences(schedule: Pick<StaffSalarySchedule, 'startDate' | 'recurrence' | 'endDate'>, through: string): string[] {
  const occurrences: string[] = [];
  let n = 0;
  let current = occurrenceAt(schedule, n);
  while (current <= through && n < MAX_OCCURRENCES) {
    if (schedule.endDate && current > schedule.endDate) break;
    occurrences.push(current);
    n += 1;
    current = occurrenceAt(schedule, n);
  }
  return occurrences;
}

export interface SalaryOccurrence {
  scheduleId: string;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

/**
 * The EARLIEST UNPAID occurrence for `schedule` — never "the first
 * occurrence after today". Walks the occurrence sequence forward one at a
 * time from `startDate` (never bounded by "today"), stopping at the first
 * one with no matching confirmed payment. This is what guarantees an
 * overdue-and-unpaid occurrence is never silently skipped (e.g. an unpaid
 * September occurrence stays "Next Payment" even once October or November
 * exists), AND that prepayment is fully supported: if the user confirms
 * payment for an occurrence before its due date, the walk simply continues
 * past it to find the next one without a payment, however many steps that
 * takes. Returns `undefined` once the walk would pass `endDate` (or the
 * safety cap) with nothing left unpaid -- a fully-paid, ended schedule
 * simply has no more Next Payment.
 */
export function getNextUnpaidOccurrence(
  schedule: Pick<StaffSalarySchedule, 'id' | 'startDate' | 'recurrence' | 'endDate' | 'amount'>,
  payments: StaffSalaryPayment[],
): SalaryOccurrence | undefined {
  const paidDueDates = new Set(
    payments.filter((payment) => payment.salaryScheduleId === schedule.id && payment.dueDate).map((payment) => payment.dueDate as string),
  );

  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const dueDate = occurrenceAt(schedule, n);
    if (schedule.endDate && dueDate > schedule.endDate) return undefined;
    if (!paidDueDates.has(dueDate)) {
      return { scheduleId: schedule.id, dueDate, amount: schedule.amount, paid: false };
    }
  }
  return undefined;
}
