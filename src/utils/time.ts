import type { Locale } from '../localization/translations';

/** Formats a 'HH:MM' (24h, from an <input type="time">) as a locale-appropriate time string. The calendar date is irrelevant -- an arbitrary fixed date is used purely as a carrier for Intl.DateTimeFormat. */
export function formatLocalTime(timeStr: string, locale: Locale): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const carrier = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(carrier);
}
