import type { LocalizedText } from '../../localization/translations';

export type PropertyType = 'house' | 'apartment' | 'land' | 'chalet' | 'farm' | 'building' | 'other';

export const PROPERTY_TYPES: Array<{ id: PropertyType; title: LocalizedText }> = [
  { id: 'house', title: { ar: 'منزل', en: 'House' } },
  { id: 'apartment', title: { ar: 'شقة', en: 'Apartment' } },
  { id: 'land', title: { ar: 'أرض', en: 'Land' } },
  { id: 'chalet', title: { ar: 'شاليه', en: 'Chalet' } },
  { id: 'farm', title: { ar: 'مزرعة', en: 'Farm' } },
  { id: 'building', title: { ar: 'مبنى', en: 'Building' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

export type PropertyStatus = 'owned' | 'rented' | 'underConstruction' | 'other';

export const PROPERTY_STATUSES: Array<{ id: PropertyStatus; title: LocalizedText }> = [
  { id: 'owned', title: { ar: 'مملوك', en: 'Owned' } },
  { id: 'rented', title: { ar: 'مؤجر', en: 'Rented' } },
  { id: 'underConstruction', title: { ar: 'تحت الإنشاء', en: 'Under Construction' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/**
 * A family property record. `id` is a stable UUID, independent of `name`,
 * so future modules (contracts, tasks, documents, notifications, ...) can
 * reference a property by id.
 *
 * Deliberately no financial fields (value, purchase price, rent income,
 * mortgage, expenses, profit/loss) — finance was explicitly excluded from
 * this project.
 *
 * Deletion is direct/permanent for this experimental prototype (unlike
 * Family's soft-delete, which exists specifically to stay compatible with
 * a future Trash phase) — Properties has no such requirement, so no
 * `deletedAt` field here.
 */
export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  country?: string;
  city?: string;
  area?: string;
  block?: string;
  street?: string;
  avenue?: string;
  houseNumber?: string;
  propertyNumber?: string;
  notes?: string;
  coverPhoto?: Blob;
  createdAt: string;
  updatedAt: string;
}

export type PropertyFormValues = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;

export type PropertyDocumentType = 'titleDeed' | 'contract' | 'plan' | 'permit' | 'other';

export const PROPERTY_DOCUMENT_TYPES: Array<{ id: PropertyDocumentType; title: LocalizedText }> = [
  { id: 'titleDeed', title: { ar: 'سند الملكية', en: 'Title Deed' } },
  { id: 'contract', title: { ar: 'عقد', en: 'Contract' } },
  { id: 'plan', title: { ar: 'مخطط', en: 'Plan' } },
  { id: 'permit', title: { ar: 'ترخيص', en: 'Permit' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/** A document that belongs to exactly one property, via `propertyId`. */
export interface PropertyDocument {
  id: string;
  propertyId: string;
  type: PropertyDocumentType;
  title: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyDocumentFormValues {
  type: PropertyDocumentType;
  title: string;
  file: File;
  expiryDate?: string;
}
