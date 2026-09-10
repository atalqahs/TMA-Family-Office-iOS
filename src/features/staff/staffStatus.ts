import type { TranslationKey } from '../../localization/translations';
import { computeDateExpiryStatus, type ExpiryStatusLevel } from '../../utils/expiryStatus';
import type { HouseholdStaff, StaffDocument } from './types';

export type StaffStatusLevel = ExpiryStatusLevel;

export const STAFF_STATUS_VARIANT: Record<StaffStatusLevel, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  orange: 'warning',
  red: 'danger',
};

export const STAFF_STATUS_LABEL_KEY: Record<StaffStatusLevel, TranslationKey> = {
  green: 'staffStatusGreen',
  orange: 'staffStatusOrange',
  red: 'staffStatusRed',
};

const SEVERITY: Record<StaffStatusLevel, number> = { green: 0, orange: 1, red: 2 };

function worse(a: StaffStatusLevel, b: StaffStatusLevel): StaffStatusLevel {
  return SEVERITY[b] > SEVERITY[a] ? b : a;
}

/**
 * Fixed, documented salary grace rule for this prototype (no configurable
 * payroll settings): a month's salary is not yet due before day 5, is
 * "pending" (expected but not yet recorded) from day 5 through day 14, and
 * becomes "overdue" from day 15 onward — unless a payment for the current
 * month already exists, which is always green regardless of the day.
 */
const SALARY_DUE_DAY = 5;
const SALARY_OVERDUE_DAY = 15;

export type SalaryPaymentState = 'notTracked' | 'paid' | 'notYetDue' | 'pending' | 'overdue';

/** Pure: whether the current calendar month's salary looks paid, not-yet-due, pending, or overdue. Salary tracking is entirely skipped (notTracked) when no monthlySalary is configured — never a fabricated warning. */
export function computeCurrentMonthSalaryState(
  staff: Pick<HouseholdStaff, 'monthlySalary'>,
  hasCurrentMonthPayment: boolean,
  now: Date = new Date(),
): SalaryPaymentState {
  if (staff.monthlySalary === undefined) return 'notTracked';
  if (hasCurrentMonthPayment) return 'paid';
  const day = now.getDate();
  if (day < SALARY_DUE_DAY) return 'notYetDue';
  if (day < SALARY_OVERDUE_DAY) return 'pending';
  return 'overdue';
}

export interface StaffStatusReason {
  level: 'orange' | 'red';
  textKey: TranslationKey;
  /** Extra context appended by the caller (e.g. a document's title) — kept as plain text, not baked into the translation, so it works in either language. */
  detail?: string;
}

export interface StaffStatus {
  level: StaffStatusLevel;
  reasons: StaffStatusReason[];
}

/**
 * Overall staff status: the worst signal across civil ID / passport /
 * residency expiry, every StaffDocument's own expiry, and the current
 * month's salary state. Missing data is simply skipped — it never invents
 * a warning. Returns not just a level but the specific reasons behind it
 * (per the Phase 6 spec: a vague "Approaching" was found ambiguous during
 * Phase 5 manual testing), so the Profile page can explain *why* — e.g.
 * "Residency expires soon" rather than just an orange dot. Used by both
 * StaffCard (level only) and StaffProfilePage (level + reasons) so the
 * calculation exists in exactly one place.
 */
export function computeStaffStatus(
  staff: Pick<HouseholdStaff, 'civilIdExpiry' | 'passportExpiry' | 'residencyExpiry' | 'monthlySalary'>,
  documents: Array<Pick<StaffDocument, 'title' | 'expiryDate'>>,
  hasCurrentMonthPayment: boolean,
  now: Date = new Date(),
): StaffStatus {
  const reasons: StaffStatusReason[] = [];
  let level: StaffStatusLevel = 'green';

  const addReason = (reasonLevel: 'orange' | 'red', textKey: TranslationKey, detail?: string) => {
    reasons.push({ level: reasonLevel, textKey, detail });
    level = worse(level, reasonLevel);
  };

  const civilIdStatus = computeDateExpiryStatus(staff.civilIdExpiry, now);
  if (civilIdStatus === 'red') addReason('red', 'staffReasonCivilIdExpired');
  else if (civilIdStatus === 'orange') addReason('orange', 'staffReasonCivilIdExpiringSoon');

  const passportStatus = computeDateExpiryStatus(staff.passportExpiry, now);
  if (passportStatus === 'red') addReason('red', 'staffReasonPassportExpired');
  else if (passportStatus === 'orange') addReason('orange', 'staffReasonPassportExpiringSoon');

  const residencyStatus = computeDateExpiryStatus(staff.residencyExpiry, now);
  if (residencyStatus === 'red') addReason('red', 'staffReasonResidencyExpired');
  else if (residencyStatus === 'orange') addReason('orange', 'staffReasonResidencyExpiringSoon');

  for (const doc of documents) {
    const docStatus = computeDateExpiryStatus(doc.expiryDate, now);
    if (docStatus === 'red') addReason('red', 'staffReasonDocumentExpired', doc.title);
    else if (docStatus === 'orange') addReason('orange', 'staffReasonDocumentExpiringSoon', doc.title);
  }

  const salaryState = computeCurrentMonthSalaryState(staff, hasCurrentMonthPayment, now);
  if (salaryState === 'overdue') addReason('red', 'staffReasonSalaryOverdue');
  else if (salaryState === 'pending') addReason('orange', 'staffReasonSalaryPending');

  return { level, reasons };
}
