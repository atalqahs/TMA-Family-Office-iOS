import type { LocalizedText } from '../../localization/translations';

/**
 * A family vehicle record. `id` is a stable UUID, independent of `name`.
 *
 * Deliberately no financial fields (purchase price, resale value, loan/
 * payment tracking, insurance cost, fuel expenses) — finance was explicitly
 * excluded from this project.
 *
 * There is no stored `status` field: vehicle status (green/orange/red) is
 * always derived at render time from registrationExpiry/insuranceExpiry and
 * the vehicle's maintenance records (see vehicleStatus.ts), never persisted,
 * so it can never go stale relative to the data it's computed from.
 *
 * Deletion is direct/permanent for this experimental prototype (same as
 * Properties, unlike Family's soft-delete) — no `deletedAt` field here.
 */
export interface Vehicle {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  plateNumber?: string;
  vin?: string;
  color?: string;
  currentMileage?: number;
  registrationExpiry?: string;
  insuranceExpiry?: string;
  notes?: string;
  coverPhoto?: Blob;
  createdAt: string;
  updatedAt: string;
}

export type VehicleFormValues = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

export type VehicleDocumentType = 'registration' | 'insurance' | 'inspection' | 'serviceInvoice' | 'other';

export const VEHICLE_DOCUMENT_TYPES: Array<{ id: VehicleDocumentType; title: LocalizedText }> = [
  { id: 'registration', title: { ar: 'استمارة التسجيل', en: 'Registration' } },
  { id: 'insurance', title: { ar: 'التأمين', en: 'Insurance' } },
  { id: 'inspection', title: { ar: 'الفحص الفني', en: 'Inspection' } },
  { id: 'serviceInvoice', title: { ar: 'فاتورة الصيانة', en: 'Service Invoice' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/** A document that belongs to exactly one vehicle, via `vehicleId`. */
export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: VehicleDocumentType;
  title: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDocumentFormValues {
  type: VehicleDocumentType;
  title: string;
  file: File;
  expiryDate?: string;
}

export type VehicleMaintenanceType =
  | 'oilChange'
  | 'tires'
  | 'brakes'
  | 'battery'
  | 'majorService'
  | 'inspection'
  | 'repair'
  | 'other';

export const VEHICLE_MAINTENANCE_TYPES: Array<{ id: VehicleMaintenanceType; title: LocalizedText }> = [
  { id: 'oilChange', title: { ar: 'تغيير الزيت', en: 'Oil Change' } },
  { id: 'tires', title: { ar: 'الإطارات', en: 'Tires' } },
  { id: 'brakes', title: { ar: 'الفرامل', en: 'Brakes' } },
  { id: 'battery', title: { ar: 'البطارية', en: 'Battery' } },
  { id: 'majorService', title: { ar: 'صيانة شاملة', en: 'Major Service' } },
  { id: 'inspection', title: { ar: 'الفحص الفني', en: 'Inspection' } },
  { id: 'repair', title: { ar: 'إصلاح', en: 'Repair' } },
  { id: 'other', title: { ar: 'أخرى', en: 'Other' } },
];

/**
 * A maintenance record for exactly one vehicle, via `vehicleId`. No
 * monetary cost fields, per the same finance-exclusion rule as Vehicle
 * itself. `nextServiceDate`/`nextServiceMileage` feed the derived vehicle
 * status (vehicleStatus.ts) — they are the only "next due" signals; there
 * is no separate reminder/notification engine yet.
 */
export interface VehicleMaintenanceRecord {
  id: string;
  vehicleId: string;
  type: VehicleMaintenanceType;
  title: string;
  serviceDate: string;
  mileage?: number;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleMaintenanceFormValues = Omit<
  VehicleMaintenanceRecord,
  'id' | 'vehicleId' | 'createdAt' | 'updatedAt'
>;
