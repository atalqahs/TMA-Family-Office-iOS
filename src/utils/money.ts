/** Locale-aware grouped number for a KWD amount (unit label is appended by the caller, already localized). No currency conversion or finance analytics — this is a display-only formatter for operational records. */
export function formatMoneyNumber(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(amount);
}
