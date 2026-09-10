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

/**
 * A single month's salary-payment record for one staff member.
 * `salaryMonth` is a calendar month in 'YYYY-MM' form (matches the native
 * `<input type="month">` value). At most one payment per (staffId,
 * salaryMonth) pair is allowed — enforced both by a unique compound index
 * in IndexedDB and by an explicit pre-check in staffService, so accidental
 * duplicates are rejected with a clear, localized message either way.
 *
 * This is an operational "was it paid" record, not an accounting ledger —
 * no cost centers, no running balances, no reporting.
 */
export interface StaffSalaryPayment {
  id: string;
  staffId: string;
  salaryMonth: string;
  amount: number;
  paidDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StaffSalaryPaymentFormValues = Omit<
  StaffSalaryPayment,
  'id' | 'staffId' | 'createdAt' | 'updatedAt'
>;
