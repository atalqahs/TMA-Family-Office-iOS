import type { LocalizedText } from '../../localization/translations';

export type EducationStatus = 'currentlyStudying' | 'graduated' | 'notCurrentlyStudying';

export const EDUCATION_STATUSES: Array<{ id: EducationStatus; title: LocalizedText }> = [
  { id: 'currentlyStudying', title: { ar: 'يدرس حاليًا', en: 'Currently Studying' } },
  { id: 'graduated', title: { ar: 'متخرج', en: 'Graduated' } },
  { id: 'notCurrentlyStudying', title: { ar: 'متوقف', en: 'Not Currently Studying' } },
];

/**
 * A simple Education profile linked to exactly one Family Member via
 * `familyMemberId` -- a stable-ID relationship, never a copy of Family's
 * own identity data (see hooks/useEducationProfile.ts, which resolves
 * identity live from Family, the single source of truth). At most one
 * Education profile may exist per Family Member (enforced by a unique
 * `familyMemberId` index -- see storage/db.ts).
 *
 * Deliberately simple by design (Phase 11): no school-management/student-
 * information system -- `educationStage` is free text (never a rigid
 * hard-coded taxonomy), `institution`/`gradeOrYear`/`specialization`/
 * `notes` are all optional free text, and `educationStatus` is one of
 * exactly three stable enum values. Documents reuse the exact same shared
 * document infrastructure every other module uses.
 *
 * `archivedAt` (same Archive semantics as every other module) is the
 * Education profile's OWN independent archive state: archiving Education
 * never archives the Family Member or the Health profile, and never
 * touches Family data. There is no Trash/soft-delete state (Phase 11
 * product decision) -- deletion is direct and permanent, cascading its own
 * documents (see educationRepository.deleteEducationProfileWithDocuments).
 */
export interface EducationProfile {
  id: string;
  familyMemberId: string;
  educationStage: string;
  institution?: string;
  gradeOrYear?: string;
  specialization?: string;
  educationStatus: EducationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type EducationProfileFormValues = Omit<
  EducationProfile,
  'id' | 'familyMemberId' | 'createdAt' | 'updatedAt' | 'archivedAt'
>;

export type EducationDocumentType = 'certificate' | 'transcript' | 'schoolDocument' | 'other';

export const EDUCATION_DOCUMENT_TYPES: Array<{ id: EducationDocumentType; title: LocalizedText }> = [
  { id: 'certificate', title: { ar: 'شهادة', en: 'Certificate' } },
  { id: 'transcript', title: { ar: 'كشف درجات', en: 'Transcript' } },
  { id: 'schoolDocument', title: { ar: 'مستند مدرسي/جامعي', en: 'School/University Document' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/** A document that belongs to exactly one Education profile, via `educationProfileId`. */
export interface EducationDocument {
  id: string;
  educationProfileId: string;
  type: EducationDocumentType;
  title: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface EducationDocumentFormValues {
  type: EducationDocumentType;
  title: string;
  file: File;
}
