import type { LocalizedText } from '../../localization/translations';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * A family member record. `id` is a stable UUID, independent of `fullName`,
 * so future modules (health, education, tasks, ...) can reference a member
 * by id without ever depending on how their name is spelled or whether it
 * changes.
 *
 * `deletedAt` is a soft-delete marker: Phase 3 does not build the Trash
 * system yet, so a "deleted" member is simply hidden from every list
 * instead of being destroyed — this keeps the data available for the
 * future Trash phase without inventing an incompatible deletion model now.
 *
 * `archivedAt` (Phase 10) is a display/organization state, NOT a second
 * deletion flag: an archived member is the exact same record, with all of
 * its data/documents/relationships/derived state fully intact -- it is
 * simply hidden from the normal active Family list and shown through
 * Archive instead. Archiving never disables business logic (see
 * features/archive/). `deletedAt` and `archivedAt` are independent and
 * mutually exclusive in practice: a member moves through
 * active -> archived -> deleted, never occupying two states at once.
 */
export interface FamilyMember {
  id: string;
  fullName: string;
  relationship?: string;
  dateOfBirth?: string;
  nationality?: string;
  civilId?: string;
  phone?: string;
  email?: string;
  bloodType?: BloodType;
  notes?: string;
  profilePhoto?: Blob;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  archivedAt?: string;
}

export type FamilyMemberFormValues = Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type FamilyMemberDocumentType = 'civilId' | 'passport' | 'birthCertificate' | 'other';

export const DOCUMENT_TYPES: Array<{ id: FamilyMemberDocumentType; title: LocalizedText }> = [
  { id: 'civilId', title: { ar: 'البطاقة المدنية', en: 'Civil ID' } },
  { id: 'passport', title: { ar: 'جواز السفر', en: 'Passport' } },
  { id: 'birthCertificate', title: { ar: 'شهادة الميلاد', en: 'Birth Certificate' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/** A document that belongs to exactly one family member, via `familyMemberId`. */
export interface FamilyMemberDocument {
  id: string;
  familyMemberId: string;
  type: FamilyMemberDocumentType;
  title: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMemberDocumentFormValues {
  type: FamilyMemberDocumentType;
  title: string;
  file: File;
  expiryDate?: string;
}
