import { computeCalendarMonthExpiryStatus } from '../../../utils/expiryStatus';
import type { FamilyMember } from '../../family/types';
import type { NotificationItem } from '../types';

/**
 * Civil ID warns 3 calendar months before expiry; Passport warns 6
 * calendar months before expiry -- both fixed, approved business rules
 * (see this correction's spec), computed via `computeCalendarMonthExpiryStatus`
 * (the same calendar-month-exact utility, never an approximate day count).
 *
 * Archive is a display/organization state only: `member` here comes from
 * `familyRepository.listFamilyMembers()` (archived included), the exact
 * same read path every other source already uses, so an archived member's
 * expiring/expired documents keep producing Notifications exactly like an
 * active member's would (see notificationService.ts).
 */
const CIVIL_ID_WARNING_MONTHS = 3;
const PASSPORT_WARNING_MONTHS = 6;

export function buildFamilyNotifications(members: FamilyMember[], now: Date = new Date()): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const member of members) {
    const route = `/family/${member.id}`;

    const civilIdExpiry = member.civilIdExpiryDate;
    const civilIdStatus = computeCalendarMonthExpiryStatus(civilIdExpiry, now, CIVIL_ID_WARNING_MONTHS);
    if (civilIdExpiry && (civilIdStatus === 'red' || civilIdStatus === 'orange')) {
      const expired = civilIdStatus === 'red';
      items.push({
        id: `family:${member.id}:civil-id-${expired ? 'expired' : 'expiring'}`,
        sourceType: 'family',
        sourceId: member.id,
        kind: expired ? 'familyCivilIdExpired' : 'familyCivilIdExpiringSoon',
        severity: expired ? 'critical' : 'warning',
        titleKey: expired ? 'notificationTitleFamilyCivilIdExpired' : 'notificationTitleFamilyCivilIdExpiringSoon',
        titleParams: { name: member.fullName },
        messageKey: expired ? 'notificationMsgExpiredOn' : 'notificationMsgExpiringOn',
        messageParams: { date: civilIdExpiry },
        effectiveDate: civilIdExpiry,
        sortDate: civilIdExpiry,
        route,
      });
    }

    const passportExpiry = member.passportExpiryDate;
    const passportStatus = computeCalendarMonthExpiryStatus(passportExpiry, now, PASSPORT_WARNING_MONTHS);
    if (passportExpiry && (passportStatus === 'red' || passportStatus === 'orange')) {
      const expired = passportStatus === 'red';
      items.push({
        id: `family:${member.id}:passport-${expired ? 'expired' : 'expiring'}`,
        sourceType: 'family',
        sourceId: member.id,
        kind: expired ? 'familyPassportExpired' : 'familyPassportExpiringSoon',
        severity: expired ? 'critical' : 'warning',
        titleKey: expired ? 'notificationTitleFamilyPassportExpired' : 'notificationTitleFamilyPassportExpiringSoon',
        titleParams: { name: member.fullName },
        messageKey: expired ? 'notificationMsgExpiredOn' : 'notificationMsgExpiringOn',
        messageParams: { date: passportExpiry },
        effectiveDate: passportExpiry,
        sortDate: passportExpiry,
        route,
      });
    }
  }

  return items;
}
