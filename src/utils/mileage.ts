/** Locale-aware grouped number for an odometer reading (unit label is appended by the caller, already localized). */
export function formatMileageNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
