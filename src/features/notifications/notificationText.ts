import type { Locale, TranslationKey } from '../../localization/translations';
import { formatMileageNumber } from '../../utils/mileage';
import { formatMoneyNumber } from '../../utils/money';
import type { NotificationItem, NotificationSourceType } from './types';

/**
 * Substitutes `{key}` placeholders in a translated template -- the exact
 * same convention already used for StaffStatusReason.params
 * (StaffProfilePage.tsx), so date/amount/km values are formatted
 * consistently everywhere they appear, and Arabic sentences are never
 * built by concatenating separate fragments (which reads poorly in
 * Arabic -- see Phase 9B spec Section R).
 */
function renderTemplate(key: TranslationKey, params: Record<string, string> | undefined, t: (key: TranslationKey) => string, locale: Locale): string {
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

export function renderNotificationTitle(item: NotificationItem, t: (key: TranslationKey) => string, locale: Locale): string {
  return renderTemplate(item.titleKey, item.titleParams, t, locale);
}

export function renderNotificationMessage(item: NotificationItem, t: (key: TranslationKey) => string, locale: Locale): string {
  return renderTemplate(item.messageKey, item.messageParams, t, locale);
}

const SOURCE_LABEL_KEY: Record<NotificationSourceType, TranslationKey> = {
  vehicle: 'notificationSourceVehicleLabel',
  contract: 'notificationSourceContractLabel',
  staff: 'notificationSourceStaffLabel',
  task: 'notificationSourceTaskLabel',
};

export function getNotificationSourceLabel(sourceType: NotificationSourceType, t: (key: TranslationKey) => string): string {
  return t(SOURCE_LABEL_KEY[sourceType]);
}

const SEVERITY_LABEL_KEY: Record<NotificationItem['severity'], TranslationKey> = {
  critical: 'notificationSeverityCriticalLabel',
  warning: 'notificationSeverityWarningLabel',
  info: 'notificationSeverityInfoLabel',
};

export function getNotificationSeverityLabel(severity: NotificationItem['severity'], t: (key: TranslationKey) => string): string {
  return t(SEVERITY_LABEL_KEY[severity]);
}
