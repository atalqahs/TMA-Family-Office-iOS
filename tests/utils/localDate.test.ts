import { describe, expect, it } from 'vitest';
import { addLocalDays, addLocalMonths, getLocalToday, getLocalYearMonth, parseLocalDate } from '../../src/utils/localDate';

describe('localDate: no-UTC-bug behavioral guard', () => {
  it('getLocalToday reads LOCAL fields, not a UTC-normalized instant (the historical bug used toISOString().slice(0,10), which is always UTC)', () => {
    // A Date constructed from explicit local y/m/d/h/m components: the
    // buggy implementation (`date.toISOString().slice(0, 10)`) converts to
    // UTC first, so for a local time far enough from UTC midnight it would
    // report the WRONG calendar day. The correct implementation must
    // report exactly the local day/month/year that was passed in,
    // regardless of what UTC offset the test process happens to run under.
    const localMidnightPlus1Minute = new Date(2026, 0, 1, 0, 1); // local 2026-01-01 00:01
    expect(getLocalToday(localMidnightPlus1Minute)).toBe('2026-01-01');

    const localJustBeforeMidnight = new Date(2026, 0, 1, 23, 59); // local 2026-01-01 23:59
    expect(getLocalToday(localJustBeforeMidnight)).toBe('2026-01-01');
  });

  it('parseLocalDate never shifts the calendar day the way `new Date(dateStr)` (parsed as UTC midnight) can', () => {
    // Round-tripping every day of a month through parseLocalDate ->
    // getLocalToday must be the identity — any UTC-normalization bug would
    // shift some of these by one day depending on the process timezone.
    for (let day = 1; day <= 28; day++) {
      const iso = `2026-02-${String(day).padStart(2, '0')}`;
      expect(getLocalToday(parseLocalDate(iso))).toBe(iso);
    }
  });
});

describe('localDate: pure arithmetic correctness', () => {
  it('getLocalToday/getLocalYearMonth read the LOCAL calendar fields of the given Date', () => {
    const d = new Date(2026, 8, 30, 23, 59); // local Sep 30, 2026, 23:59
    expect(getLocalToday(d)).toBe('2026-09-30');
    expect(getLocalYearMonth(d)).toBe('2026-09');
  });

  it('parseLocalDate builds a Date from local y/m/d components (not parsed as UTC midnight)', () => {
    const d = parseLocalDate('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });

  it('addLocalDays crosses a month boundary correctly', () => {
    expect(addLocalDays('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('addLocalDays crosses a year boundary correctly', () => {
    expect(addLocalDays('2026-12-30', 5)).toBe('2027-01-04');
  });

  it('addLocalMonths clamps to the shorter month (Jan 31 + 1 month -> Feb 28 in a non-leap year)', () => {
    expect(addLocalMonths('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('addLocalMonths clamps correctly in a leap year (Feb 29)', () => {
    expect(addLocalMonths('2024-01-31', 1)).toBe('2024-02-29');
  });

  it('addLocalMonths always clamps fresh from the ORIGINAL day-of-month, never a previously clamped result — Jan 31 -> Mar 31, not stuck on 28', () => {
    expect(addLocalMonths('2026-01-31', 2)).toBe('2026-03-31');
  });

  it('addLocalMonths crosses a year boundary correctly', () => {
    expect(addLocalMonths('2026-11-15', 3)).toBe('2027-02-15');
  });
});
