import type { LocalizedText } from '../../localization/translations';

export type StaffRole = 'driver' | 'housekeeper' | 'cook' | 'nanny' | 'gardener' | 'other';

export const STAFF_ROLES: Array<{ id: StaffRole; title: LocalizedText }> = [
  { id: 'driver', title: { ar: 'سائق', en: 'Driver' } },
  { id: 'housekeeper', title: { ar: 'عاملة منزلية', en: 'Housekeeper' } },
  { id: 'cook', title: { ar: 'طباخ', en: 'Cook' } },
  { id: 'nanny', title: { ar: 'مربية', en: 'Nanny' } },
  { id: 'gardener', title: { ar: 'بستاني', en: 'Gardener' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/**
 * A household staff record. `id` is a stable UUID, independent of
 * `fullName`.
 *
 * `monthlySalary` exists ONLY to support the simple "was this month's
 * salary paid?" tracking in StaffSalaryPayment/staffStatus.ts — there is
 * deliberately no accounting, payroll, tax, loan/advance, overtime,
 * deduction, allowance, or bank-integration support anywhere in this
 * module. Finance analytics were explicitly excluded from this project.
 *
 * Age is never stored; it's always derived from dateOfBirth (utils/age.ts),
 * same as Family. There is no stored overall status either — it is always
 * derived at render time (see staffStatus.ts), so it can never go stale
 * relative to the expiry/salary data it's computed from.
 *
 * Deletion is direct/permanent for this experimental prototype (same as
 * Properties/Vehicles, unlike Family's soft-delete) — no `deletedAt` field.
 */
export interface HouseholdStaff {
  id: string;
  fullName: string;
  role?: StaffRole;
  nationality?: string;
  dateOfBirth?: string;
  civilId?: string;
  passportNumber?: string;
  phone?: string;
  employmentStartDate?: string;
  civilIdExpiry?: string;
  passportExpiry?: string;
  residencyExpiry?: string;
  monthlySalary?: number;
  notes?: string;
  profilePhoto?: Blob;
  createdAt: string;
  updatedAt: string;
}

export type StaffFormValues = Omit<HouseholdStaff, 'id' | 'createdAt' | 'updatedAt'>;

export type StaffDocumentType =
  | 'civilId'
  | 'passport'
  | 'residency'
  | 'workPermit'
  | 'contract'
  | 'medical'
  | 'other';

export const STAFF_DOCUMENT_TYPES: Array<{ id: StaffDocumentType; title: LocalizedText }> = [
  { id: 'civilId', title: { ar: 'البطاقة المدنية', en: 'Civil ID' } },
  { id: 'passport', title: { ar: 'جواز السفر', en: 'Passport' } },
  { id: 'residency', title: { ar: 'الإقامة', en: 'Residency' } },
  { id: 'workPermit', title: { ar: 'تصريح العمل', en: 'Work Permit' } },
  { id: 'contract', title: { ar: 'العقد', en: 'Contract' } },
  { id: 'medical', title: { ar: 'الفحص الطبي', en: 'Medical' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/** A document that belongs to exactly one staff member, via `staffId`. */
export interface StaffDocument {
  id: string;
  staffId: string;
  type: StaffDocumentType;
  title: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffDocumentFormValues {
  type: StaffDocumentType;
  title: string;
  file: File;
  expiryDate?: string;
}

export type SalaryFrequency = 'day' | 'month' | 'year';

/**
 * A recurring salary schedule for one staff member, via `staffId`. A staff
 * member may have more than one active schedule at once (e.g. paid twice a
 * month, or one schedule that later got replaced by another with a
 * different due day) — the redesigned Phase 6 correction replaces the
 * old "one manually-added record per calendar month" concept with this:
 * the user configures the recurrence once, and every future occurrence is
 * *derived* (see salarySchedule.ts), never manually pre-created.
 *
 * - frequency 'day' + interval N: due every N days, starting `startDate`.
 * - frequency 'month' + interval N + dueDayOfMonth D: due on day D of
 *   every Nth month (clamped for short months, e.g. day 31 in February).
 * - frequency 'year' + interval N + dueMonth M + dueDayOfMonth D: due on
 *   day D of month M, every Nth year.
 *
 * `endDate`, if set, stops generating occurrences after that date — the
 * schedule and its historical payments are otherwise untouched.
 */
export interface StaffSalarySchedule {
  id: string;
  staffId: string;
  amount: number;
  frequency: SalaryFrequency;
  interval: number;
  dueDayOfMonth?: number;
  dueMonth?: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StaffSalaryScheduleFormValues = Omit<
  StaffSalarySchedule,
  'id' | 'staffId' | 'createdAt' | 'updatedAt'
>;

/**
 * A single CONFIRMED salary payment — "this scheduled occurrence was
 * actually paid" — for one staff member, via `staffId`. New payments are
 * always created by confirming a specific derived occurrence of a
 * `StaffSalarySchedule` (`salaryScheduleId` + `dueDate` identify exactly
 * which occurrence), never pre-created ahead of time.
 *
 * At most one confirmed payment per (salaryScheduleId, dueDate) pair is
 * allowed — enforced both by a unique compound IndexedDB index and by an
 * explicit pre-check in staffService — but two DIFFERENT schedules may
 * legitimately share the same due date (e.g. two schedules both due on
 * the 1st), since the uniqueness is scoped to the schedule, not the date
 * alone.
 *
 * `salaryMonth` is the pre-redesign Phase 6 field ('YYYY-MM'), preserved
 * as-is on historical records migrated from that schema — new payments
 * never set it. `dueDate` is optional for exactly that reason (legacy
 * rows may only have `salaryMonth`); see `getPaymentDueDate()` below for
 * the display-time fallback. This is an operational "was it paid" record,
 * not an accounting ledger — no cost centers, no running balances.
 */
export interface StaffSalaryPayment {
  id: string;
  staffId: string;
  salaryScheduleId?: string;
  dueDate?: string;
  amount: number;
  paidDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Legacy Phase 6 field, preserved on historical records only. */
  salaryMonth?: string;
}

export type StaffSalaryPaymentFormValues = {
  amount: number;
  paidDate: string;
  notes?: string;
};

/** The calendar date a payment record covers, preferring the new `dueDate` and falling back to the legacy `salaryMonth` (as that month's 1st) for pre-redesign records. */
export function getPaymentDueDate(payment: Pick<StaffSalaryPayment, 'dueDate' | 'salaryMonth'>): string | undefined {
  return payment.dueDate ?? (payment.salaryMonth ? `${payment.salaryMonth}-01` : undefined);
}
