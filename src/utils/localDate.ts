/**
 * Local-calendar-day helpers. `Date.prototype.toISOString()` always
 * returns UTC, so `new Date().toISOString().slice(0, 10)` silently gives
 * the WRONG calendar day/month for any timezone ahead of UTC during the
 * hours after local midnight (e.g. Kuwait, UTC+3, from 00:00-03:00 local
 * time) — local 2026-10-01 01:00 is still 2026-09-30 22:00 in UTC.
 *
 * These use `getFullYear()`/`getMonth()`/`getDate()`, which are the LOCAL
 * accessors (as opposed to `getUTCFullYear()` etc.), so they always
 * reflect the device's actual local calendar date.
 */

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Parses a local 'YYYY-MM-DD' date string into a `Date` set to local
 * midnight on that calendar day -- built from numeric y/m/d components via
 * the local `Date(y, m, d)` constructor, never `new Date(dateStr)` (which
 * treats a bare date-only string as UTC midnight, silently shifting the
 * displayed calendar day by a day in timezones behind UTC). Use this
 * anywhere a stored local date needs to become a `Date` for display
 * (`Intl.DateTimeFormat`, etc).
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Local calendar date as 'YYYY-MM-DD'. */
export function getLocalToday(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Local calendar month as 'YYYY-MM'. */
export function getLocalYearMonth(now: Date = new Date()): string {
  return getLocalToday(now).slice(0, 7);
}

/**
 * Adds a number of calendar days to a local 'YYYY-MM-DD' date, entirely in
 * local time (the Date is constructed from numeric y/m/d components, never
 * parsed from a string or built via `Date.UTC`, so `setDate`/the local
 * `getFullYear`/`getMonth`/`getDate` accessors below never drift across a
 * timezone boundary the way `toISOString()` would).
 */
export function addLocalDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Adds a number of calendar months to a local 'YYYY-MM-DD' date, clamping
 * to the target month's last valid day when the original day doesn't
 * exist there (e.g. adding 1 month to Jan 31 gives Feb 28/29). Each call
 * clamps fresh from `dateStr`'s own day-of-month -- callers that need a
 * recurring schedule to keep returning to its original day in months that
 * DO have it (rather than drifting permanently to the clamped day) must
 * always call this from the fixed original anchor date, adding the full
 * `N * occurrenceIndex` months in one call, never by chaining from a
 * previously computed occurrence -- see taskRecurrence.ts.
 */
export function addLocalMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const totalMonths = month - 1 + months;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonthIndex = ((totalMonths % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  const targetDay = Math.min(day, daysInTargetMonth);
  return `${targetYear}-${pad2(targetMonthIndex + 1)}-${pad2(targetDay)}`;
}
