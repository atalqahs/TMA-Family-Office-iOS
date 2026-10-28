import type { LocalizedText } from '../../localization/translations';

export type HealthStatus = 'healthy' | 'needsFollowUp' | 'critical';

export const HEALTH_STATUSES: Array<{ id: HealthStatus; title: LocalizedText }> = [
  { id: 'healthy', title: { ar: 'سليمة', en: 'Healthy' } },
  { id: 'needsFollowUp', title: { ar: 'تحتاج متابعة', en: 'Needs Follow-up' } },
  { id: 'critical', title: { ar: 'حرجة', en: 'Critical' } },
];

/**
 * A simple Health profile linked to exactly one Family Member via
 * `familyMemberId` -- a stable-ID relationship, never a copy of Family's
 * own identity data (full name, photo, age, Civil ID, nationality, phone,
 * email, blood type all continue to be resolved live from Family, the
 * single source of truth -- see hooks/useHealthProfile.ts). At most one
 * Health profile may exist per Family Member (enforced by a unique
 * `familyMemberId` index -- see storage/db.ts).
 *
 * Deliberately simple by design (Phase 11): no diagnoses/prescriptions/
 * appointments/doctors/hospitals/medications/insurance systems -- just a
 * status, optional height/weight/allergies/notes, and documents (reusing
 * the exact same shared document infrastructure every other module uses).
 *
 * `archivedAt` (same Archive semantics as every other module) is the
 * Health profile's OWN independent archive state: archiving Health never
 * archives the Family Member or the Education profile, and never touches
 * Family data. There is no Trash/soft-delete state (Phase 11 product
 * decision) -- deletion is direct and permanent, cascading its own
 * documents (see healthRepository.deleteHealthProfileWithDocuments).
 */
export interface HealthProfile {
  id: string;
  familyMemberId: string;
  healthStatus: HealthStatus;
  height?: number;
  weight?: number;
  allergies?: string;
  healthNotes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type HealthProfileFormValues = Omit<
  HealthProfile,
  'id' | 'familyMemberId' | 'createdAt' | 'updatedAt' | 'archivedAt'
>;

export type HealthDocumentType = 'medicalReport' | 'labResult' | 'vaccinationRecord' | 'other';

export const HEALTH_DOCUMENT_TYPES: Array<{ id: HealthDocumentType; title: LocalizedText }> = [
  { id: 'medicalReport', title: { ar: 'تقرير طبي', en: 'Medical Report' } },
  { id: 'labResult', title: { ar: 'نتيجة مختبر', en: 'Lab Result' } },
  { id: 'vaccinationRecord', title: { ar: 'سجل تطعيم', en: 'Vaccination Record' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/** A document that belongs to exactly one Health profile, via `healthProfileId`. */
export interface HealthDocument {
  id: string;
  healthProfileId: string;
  type: HealthDocumentType;
  title: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface HealthDocumentFormValues {
  type: HealthDocumentType;
  title: string;
  file: File;
}
