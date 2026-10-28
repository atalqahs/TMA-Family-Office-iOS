import type { Locale, TranslationKey } from '../localization/translations';
import { formatMileageNumber } from './mileage';
import { formatMoneyNumber } from './money';

/**
 * Substitutes `{key}` placeholders in a translated template -- the exact
 * same convention already used for StaffStatusReason.params
 * (StaffProfilePage.tsx), so date/amount/km values are formatted
 * consistently everywhere they appear, and Arabic sentences are never
 * built by concatenating separate fragments (which reads poorly in
 * Arabic). Shared by Notifications (notificationText.ts) and the General
 * Calendar (calendarText.ts) rather than each reimplementing the same
 * substitution/formatting rules.
 */
export function renderTemplateText(
  key: TranslationKey,
  params: Record<string, string> | undefined,
  t: (key: TranslationKey) => string,
  locale: Locale,
): string {
  let text = t(key);
  if (!params) return text;
  for (const [paramKey, value] of Object.entries(params)) {
    const displayValue =
      paramKey === 'date'
        ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(`${value}T00:00:00`))
        : paramKey === 'amount'
          ? formatMoneyNumber(Number(value), locale)
          : paramKey === 'km'
            ? formatMileageNumber(Number(value), locale)
            : value;
    text = text.replace(`{${paramKey}}`, displayValue);
  }
  return text;
}
