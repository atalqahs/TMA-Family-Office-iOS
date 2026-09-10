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

/** Local calendar date as 'YYYY-MM-DD'. */
export function getLocalToday(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Local calendar month as 'YYYY-MM'. */
export function getLocalYearMonth(now: Date = new Date()): string {
  return getLocalToday(now).slice(0, 7);
}
