import type { StaffSalaryPayment, StaffSalarySchedule } from './types';

/** Safety cap against runaway generation on malformed data (e.g. interval 0). */
const MAX_OCCURRENCES = 2000;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/** Builds 'YYYY-MM-DD' for (year, zero-based month, day), clamping the day to the actual length of that month (e.g. day 31 in February -> 28/29). */
function dateOnly(year: number, monthIndex0: number, day: number): string {
  const clampedMonthIndex = ((monthIndex0 % 12) + 12) % 12;
  const carriedYear = year + Math.floor(monthIndex0 / 12);
  const clampedDay = Math.max(1, Math.min(day, daysInMonth(carriedYear, clampedMonthIndex)));
  return `${carriedYear}-${pad2(clampedMonthIndex + 1)}-${pad2(clampedDay)}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parts(dateStr: string): { year: number; month0: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month0: m - 1, day: d };
}

/**
 * Every occurrence date for `schedule`, from its first due date through
 * `through` (inclusive), respecting `endDate`. Pure and deterministic —
 * nothing is persisted; occurrences are recomputed on demand rather than
 * pre-created, per the "derive future obligations from the schedule"
 * requirement.
 */
export function generateOccurrences(schedule: StaffSalarySchedule, through: string): string[] {
  const interval = Math.max(1, Math.floor(schedule.interval) || 1);
  const occurrences: string[] = [];

  let current: string;
  if (schedule.frequency === 'day') {
    current = schedule.startDate;
  } else if (schedule.frequency === 'month') {
    const start = parts(schedule.startDate);
    const anchorDay = schedule.dueDayOfMonth ?? start.day;
    let candidate = dateOnly(start.year, start.month0, anchorDay);
    if (candidate < schedule.startDate) {
      candidate = dateOnly(start.year, start.month0 + interval, anchorDay);
    }
    current = candidate;
  } else {
    // 'year'
    const start = parts(schedule.startDate);
    const anchorMonth0 = (schedule.dueMonth ?? start.month0 + 1) - 1;
    const anchorDay = schedule.dueDayOfMonth ?? start.day;
    let candidate = dateOnly(start.year, anchorMonth0, anchorDay);
    if (candidate < schedule.startDate) {
      candidate = dateOnly(start.year + interval, anchorMonth0, anchorDay);
    }
    current = candidate;
  }

  let count = 0;
  while (current <= through && count < MAX_OCCURRENCES) {
    if (schedule.endDate && current > schedule.endDate) break;
    occurrences.push(current);
    count++;

    if (schedule.frequency === 'day') {
      current = addDays(current, interval);
    } else if (schedule.frequency === 'month') {
      const { year, month0 } = parts(current);
      const anchorDay = schedule.dueDayOfMonth ?? parts(schedule.startDate).day;
      current = dateOnly(year, month0 + interval, anchorDay);
    } else {
      const { year, month0 } = parts(current);
      const anchorDay = schedule.dueDayOfMonth ?? parts(schedule.startDate).day;
      current = dateOnly(year + interval, month0, anchorDay);
    }
  }
  return occurrences;
}

/** The single next occurrence strictly after `after` (used to preview the upcoming due date even before it's actually due). */
export function nextOccurrenceAfter(schedule: StaffSalarySchedule, after: string): string | undefined {
  // Generating through a generous look-ahead window covers every
  // frequency/interval combination without needing frequency-specific
  // "add one more step" logic.
  const lookAhead = addDays(after, 400);
  const occurrences = generateOccurrences(schedule, lookAhead);
  return occurrences.find((date) => date > after);
}

export interface SalaryOccurrence {
  scheduleId: string;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

/** Every due-or-past occurrence for `schedule` (through `today`) plus the single next upcoming one, each marked paid/unpaid against `payments`. */
export function buildScheduleOccurrences(
  schedule: StaffSalarySchedule,
  payments: StaffSalaryPayment[],
  today: string,
): SalaryOccurrence[] {
  const paidByDueDate = new Map<string, StaffSalaryPayment>();
  for (const payment of payments) {
    if (payment.salaryScheduleId === schedule.id && payment.dueDate) {
      paidByDueDate.set(payment.dueDate, payment);
    }
  }

  const dueOrPast = generateOccurrences(schedule, today);
  const upcoming = nextOccurrenceAfter(schedule, today);
  const dueDates = upcoming ? [...dueOrPast, upcoming] : dueOrPast;

  return dueDates.map((dueDate) => {
    const payment = paidByDueDate.get(dueDate);
    return {
      scheduleId: schedule.id,
      dueDate,
      amount: schedule.amount,
      paid: Boolean(payment),
      paidDate: payment?.paidDate,
    };
  });
}
