import type { LocalizedText } from '../../localization/translations';

export type ContractType =
  | 'property'
  | 'vehicle'
  | 'staff'
  | 'service'
  | 'maintenance'
  | 'subscription'
  | 'insurance'
  | 'rental'
  | 'other';

export const CONTRACT_TYPES: Array<{ id: ContractType; title: LocalizedText }> = [
  { id: 'property', title: { ar: 'عقاري', en: 'Property' } },
  { id: 'vehicle', title: { ar: 'مركبة', en: 'Vehicle' } },
  { id: 'staff', title: { ar: 'عمالة', en: 'Staff' } },
  { id: 'service', title: { ar: 'خدمة', en: 'Service' } },
  { id: 'maintenance', title: { ar: 'صيانة', en: 'Maintenance' } },
  { id: 'subscription', title: { ar: 'اشتراك', en: 'Subscription' } },
  { id: 'insurance', title: { ar: 'تأمين', en: 'Insurance' } },
  { id: 'rental', title: { ar: 'إيجار', en: 'Rental' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/**
 * Deliberately just the four ISO 4217 codes explicitly requested. Not
 * localized text — currency codes are language-neutral the same way a VIN
 * or plate number is, so they're shown as-is in both locales.
 */
export const CONTRACT_CURRENCIES = ['KWD', 'USD', 'EUR', 'GBP'] as const;
export type ContractCurrency = (typeof CONTRACT_CURRENCIES)[number];

/** Which existing module a Contract may optionally be linked to. The relationship is stored as a stable (type, id) pair — never a copy of the linked entity's data. */
export type ContractLinkedEntityType = 'property' | 'vehicle' | 'staff' | 'family';

export const CONTRACT_LINKED_ENTITY_TYPES: Array<{ id: ContractLinkedEntityType; title: LocalizedText }> = [
  { id: 'property', title: { ar: 'عقار', en: 'Property' } },
  { id: 'vehicle', title: { ar: 'مركبة', en: 'Vehicle' } },
  { id: 'staff', title: { ar: 'عامل منزلي', en: 'Household Staff' } },
  { id: 'family', title: { ar: 'فرد من العائلة', en: 'Family Member' } },
];

/**
 * A contract/agreement record. `id` is a stable UUID, independent of
 * `title`.
 *
 * This is explicitly NOT a finance module: `amount`/`currency` are plain
 * contract metadata (e.g. "this rental contract is for 500 KWD/month"),
 * never budgeting, expenses, payments, or a financial dashboard — same
 * exclusion already applied to Vehicles/Properties/Staff.
 *
 * `linkedEntityType`/`linkedEntityId` are an OPTIONAL, stable-ID-only
 * relationship to an existing Property/Vehicle/Staff/Family record — never
 * a copy of that entity's data, so it can never drift out of sync. The
 * linked entity may later be deleted; a Contract must remain fully
 * readable in that case (see contractService.ts /
 * ContractProfilePage's graceful "missing linked entity" handling) rather
 * than being deleted itself or fabricating stand-in data.
 *
 * Status (Active/Expiring Soon/Expired) is never stored — always derived
 * from `endDate` at render time (see contractStatus.ts), so it can never
 * go stale.
 *
 * Deletion is direct and permanent (no Trash/soft-delete state -- Phase 11
 * product decision): the lifecycle is ACTIVE <-> ARCHIVED -> PERMANENT
 * DELETE, with Delete (from the profile page or from within Archive)
 * always performing the same real cascade delete after confirmation.
 *
 * `archivedAt` (Phase 10) is a display/organization state, NOT deletion: an
 * archived contract is the exact same record, with all of its data/
 * documents/linked-entity relationship fully intact -- it is simply hidden
 * from the normal active Contracts list and shown through Archive instead.
 * Archiving never disables business logic (see features/archive/) -- an
 * archived contract's expiry still produces its normal Notification.
 */
export interface Contract {
  id: string;
  title: string;
  contractType: ContractType;
  contractNumber?: string;
  partyName: string;
  startDate: string;
  endDate?: string;
  amount?: number;
  currency?: ContractCurrency;
  linkedEntityType?: ContractLinkedEntityType;
  linkedEntityId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type ContractFormValues = Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;

export type ContractDocumentType = 'signedContract' | 'scan' | 'amendment' | 'invoice' | 'other';

export const CONTRACT_DOCUMENT_TYPES: Array<{ id: ContractDocumentType; title: LocalizedText }> = [
  { id: 'signedContract', title: { ar: 'العقد الموقّع', en: 'Signed Contract' } },
  { id: 'scan', title: { ar: 'صفحات ممسوحة ضوئياً', en: 'Scanned Pages' } },
  { id: 'amendment', title: { ar: 'تعديل', en: 'Amendment' } },
  { id: 'invoice', title: { ar: 'فاتورة / مستند داعم', en: 'Invoice / Supporting Document' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/** A document that belongs to exactly one contract, via `contractId`. Reuses the exact same file/Blob pattern proven by Family/Property/Vehicle/Staff documents. */
export interface ContractDocument {
  id: string;
  contractId: string;
  type: ContractDocumentType;
  title: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractDocumentFormValues {
  type: ContractDocumentType;
  title: string;
  file: File;
}
