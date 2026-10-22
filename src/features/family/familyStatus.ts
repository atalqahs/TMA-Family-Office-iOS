import type { TranslationKey } from '../../localization/translations';
import { computeCalendarMonthExpiryStatus, type ExpiryStatusLevel } from '../../utils/expiryStatus';
import type { StatusReason } from '../../utils/statusReasons';
import type { FamilyMember } from './types';

export type FamilyStatusLevel = ExpiryStatusLevel;

/** Shared status -> StatusBadge variant / label-key mappings, matching the same visual language used across Vehicles/Staff/Contracts. */
export const FAMILY_STATUS_VARIANT: Record<FamilyStatusLevel, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  orange: 'warning',
  red: 'danger',
};

export const FAMILY_STATUS_LABEL_KEY: Record<FamilyStatusLevel, TranslationKey> = {
  green: 'familyStatusGreen',
  orange: 'familyStatusOrange',
  red: 'familyStatusRed',
};

const SEVERITY: Record<FamilyStatusLevel, number> = { green: 0, orange: 1, red: 2 };

function worse(a: FamilyStatusLevel, b: FamilyStatusLevel): FamilyStatusLevel {
  return SEVERITY[b] > SEVERITY[a] ? b : a;
}

/**
 * Same calendar-month-exact warning windows as the existing Family
 * Notifications (features/notifications/sources/familyNotifications.ts):
 * Civil ID warns 3 calendar months before expiry, Passport 6 -- this
 * reuses those exact, already-approved thresholds rather than inventing
 * a second, possibly-conflicting set of family expiry semantics.
 */
const CIVIL_ID_WARNING_MONTHS = 3;
const PASSPORT_WARNING_MONTHS = 6;

export type FamilyStatusReason = StatusReason;

export interface FamilyStatus {
  level: FamilyStatusLevel;
  reasons: FamilyStatusReason[];
}

/**
 * Overall family member status: the worst signal across Civil ID and
 * passport expiry (the only two Family fields with an established
 * warning window today -- never fabricated for fields without one),
 * alongside every independent reason behind it. Used by both
 * FamilyMemberCard and FamilyMemberProfilePage so the calculation exists
 * in exactly one place.
 */
export function computeFamilyStatus(
  member: Pick<FamilyMember, 'civilIdExpiryDate' | 'passportExpiryDate'>,
  now: Date = new Date(),
): FamilyStatus {
  const reasons: FamilyStatusReason[] = [];
  let level: FamilyStatusLevel = 'green';

  const addReason = (reasonLevel: 'orange' | 'red', textKey: TranslationKey, params: Record<string, string>) => {
    reasons.push({ level: reasonLevel, textKey, params });
    level = worse(level, reasonLevel);
  };

  if (member.civilIdExpiryDate) {
    const civilIdStatus = computeCalendarMonthExpiryStatus(member.civilIdExpiryDate, now, CIVIL_ID_WARNING_MONTHS);
    if (civilIdStatus === 'red') addReason('red', 'familyReasonCivilIdExpired', { date: member.civilIdExpiryDate });
    else if (civilIdStatus === 'orange')
      addReason('orange', 'familyReasonCivilIdExpiringSoon', { date: member.civilIdExpiryDate });
  }

  if (member.passportExpiryDate) {
    const passportStatus = computeCalendarMonthExpiryStatus(member.passportExpiryDate, now, PASSPORT_WARNING_MONTHS);
    if (passportStatus === 'red') addReason('red', 'familyReasonPassportExpired', { date: member.passportExpiryDate });
    else if (passportStatus === 'orange')
      addReason('orange', 'familyReasonPassportExpiringSoon', { date: member.passportExpiryDate });
  }

  return { level, reasons };
}
