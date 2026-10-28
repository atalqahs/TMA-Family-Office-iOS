import type { Locale, TranslationKey } from '../../localization/translations';
import { renderTemplateText } from '../../utils/templateText';
import type { NotificationItem, NotificationSourceType } from './types';

export function renderNotificationTitle(item: NotificationItem, t: (key: TranslationKey) => string, locale: Locale): string {
  return renderTemplateText(item.titleKey, item.titleParams, t, locale);
}

export function renderNotificationMessage(item: NotificationItem, t: (key: TranslationKey) => string, locale: Locale): string {
  return renderTemplateText(item.messageKey, item.messageParams, t, locale);
}

const SOURCE_LABEL_KEY: Record<NotificationSourceType, TranslationKey> = {
  vehicle: 'notificationSourceVehicleLabel',
  contract: 'notificationSourceContractLabel',
  staff: 'notificationSourceStaffLabel',
  task: 'notificationSourceTaskLabel',
  family: 'notificationSourceFamilyLabel',
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
