import { addLocalMonths, getLocalToday } from './localDate';

export type ExpiryStatusLevel = 'green' | 'orange' | 'red';

/** Shared across every "does this date need attention soon" check (Vehicles, Staff, ...). */
export const DEFAULT_EXPIRY_WARNING_DAYS = 30;

function daysUntil(dateStr: string, now: Date): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * RED when today or past, ORANGE within `warningDays`, GREEN otherwise.
 * Undefined when there's no date to judge — callers must never turn a
 * missing date into a fabricated warning.
 */
export function computeDateExpiryStatus(
  dateStr: string | undefined,
  now: Date = new Date(),
  warningDays: number = DEFAULT_EXPIRY_WARNING_DAYS,
): ExpiryStatusLevel | undefined {
  if (!dateStr) return undefined;
  const days = daysUntil(dateStr, now);
  if (days <= 0) return 'red';
  if (days <= warningDays) return 'orange';
  return 'green';
}

/**
 * Calendar-month-exact variant of `computeDateExpiryStatus`, for documents
 * whose warning window is specified in exact calendar months (e.g. "3
 * calendar months before expiry") rather than an approximate day count --
 * a fixed day count would silently drift across months of different
 * lengths (28-31 days), which the calendar-month arithmetic here never
 * does. Reuses `addLocalMonths`/`getLocalToday` (the same local-calendar-
 * safe helpers Staff salary recurrence and Task recurrence already rely
 * on) rather than a second date-math implementation.
 *
 * RED on/after the expiry date itself; ORANGE once today reaches the
 * warning start date (expiry date minus `warningMonths` calendar months,
 * clamped the same way any other calendar-month subtraction is); GREEN
 * before that. Undefined when there's no date to judge -- callers must
 * never turn a missing date into a fabricated warning.
 */
export function computeCalendarMonthExpiryStatus(
  dateStr: string | undefined,
  now: Date,
  warningMonths: number,
): ExpiryStatusLevel | undefined {
  if (!dateStr) return undefined;
  const today = getLocalToday(now);
  if (today >= dateStr) return 'red';
  const warningStart = addLocalMonths(dateStr, -warningMonths);
  return today >= warningStart ? 'orange' : 'green';
}
