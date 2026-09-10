import type { TranslationKey } from '../../localization/translations';
import { computeDateExpiryStatus, type ExpiryStatusLevel } from '../../utils/expiryStatus';
import { getLocalToday } from '../../utils/localDate';
import { buildScheduleOccurrences, type SalaryOccurrence } from './salarySchedule';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment, StaffSalarySchedule } from './types';

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
 * payroll settings): an unpaid occurrence is "pending" (orange) from its
 * due date through `SALARY_GRACE_DAYS - 1` days after, and "overdue" (red)
 * from `SALARY_GRACE_DAYS` days after onward. A due date in the future is
 * always green — never a warning "too early". This generalizes the old
 * Phase 6 day-of-month grace window into a duration since any schedule's
 * due date can now fall on any calendar day, not just the 1st/5th/15th of
 * a fixed month.
 */
const SALARY_GRACE_DAYS = 10;

export type SalaryOccurrenceLevel = 'green' | 'orange' | 'red';

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/** Pure: status of a single occurrence relative to `today`. Paid or not-yet-due is always green — never a warning for a future due date. */
export function computeOccurrenceLevel(occurrence: SalaryOccurrence, today: string): SalaryOccurrenceLevel {
  if (occurrence.paid) return 'green';
  if (occurrence.dueDate > today) return 'green';
  const daysPast = daysBetween(occurrence.dueDate, today);
  return daysPast >= SALARY_GRACE_DAYS ? 'red' : 'orange';
}

export interface StaffStatusReason {
  level: 'orange' | 'red';
  textKey: TranslationKey;
  /** Extra context appended by the caller (e.g. a document's title) — kept as plain text, not baked into the translation, so it works in either language. */
  detail?: string;
  /** Template placeholders (e.g. {amount}, {date}) substituted into the translation at render time — used for the salary reason, which needs two dynamic values. */
  params?: Record<string, string>;
}

export interface StaffStatus {
  level: StaffStatusLevel;
  reasons: StaffStatusReason[];
}

/**
 * Overall staff status: the worst signal across civil ID / passport /
 * residency expiry, every StaffDocument's own expiry, and every unpaid,
 * due-or-past salary schedule occurrence. Missing data is simply skipped —
 * it never invents a warning. Returns not just a level but the specific
 * reasons behind it (per the Phase 6 spec: a vague "Approaching" was found
 * ambiguous during manual testing), so the Profile page can explain *why*
 * — e.g. "Residency expires soon" or "Salary of 130 KWD due 11 Oct has not
 * been confirmed as paid" rather than just an orange dot. Used by both
 * StaffCard (level only) and StaffProfilePage (level + reasons) so the
 * calculation exists in exactly one place.
 */
export function computeStaffStatus(
  staff: Pick<HouseholdStaff, 'civilIdExpiry' | 'passportExpiry' | 'residencyExpiry'>,
  documents: Array<Pick<StaffDocument, 'title' | 'expiryDate'>>,
  salarySchedules: StaffSalarySchedule[],
  salaryPayments: StaffSalaryPayment[],
  now: Date = new Date(),
): StaffStatus {
  const reasons: StaffStatusReason[] = [];
  let level: StaffStatusLevel = 'green';

  const addReason = (reasonLevel: 'orange' | 'red', textKey: TranslationKey, detail?: string, params?: Record<string, string>) => {
    reasons.push({ level: reasonLevel, textKey, detail, params });
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

  const today = getLocalToday(now);
  for (const schedule of salarySchedules) {
    const occurrences = buildScheduleOccurrences(schedule, salaryPayments, today);
    for (const occurrence of occurrences) {
      const occurrenceLevel = computeOccurrenceLevel(occurrence, today);
      if (occurrenceLevel === 'green') continue;
      addReason(occurrenceLevel, 'staffReasonSalaryUnconfirmed', undefined, {
        amount: String(occurrence.amount),
        date: occurrence.dueDate,
      });
    }
  }

  return { level, reasons };
}
