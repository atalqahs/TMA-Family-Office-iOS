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
 * itself.
 *
 * Mileage-based scheduling (current model, added in the mileage-priority
 * correction): `mileageAtService` is the actual odometer reading when this
 * service was performed, and `serviceIntervalKm` is how many km until it is
 * due again. The due/target mileage is always DERIVED as
 * `mileageAtService + serviceIntervalKm` (see `getTargetMileage` below) —
 * it is never stored as its own field, so it can never drift out of sync
 * or be edited independently of its two source values. This target stays
 * FIXED for the whole service cycle: it does not move as the vehicle's
 * live `currentMileage` changes; only the "remaining km" figure (target -
 * current) changes.
 *
 * `previousTargetMileage` is set only when this record was created via the
 * "Service Completed" flow (see `vehicleService.completeMaintenanceRecord`)
 * — it snapshots the OLD cycle's target mileage at the moment the new cycle
 * started, so the early/on-time/late delta for that transition
 * (`getServiceDelta`) stays stable even if the old record is later edited
 * or deleted.
 *
 * Legacy fields `mileage`/`nextServiceMileage` (pre-dating this model) are
 * kept exactly as-is for backward compatibility — old records that only
 * ever set these continue to display and evaluate correctly via the
 * fallback chains in `getMileageAtService`/`getTargetMileage`.
 *
 * `nextServiceDate` remains a purely informational fallback signal, used
 * for status only when no target mileage can be derived at all (see
 * vehicleStatus.ts) — mileage is authoritative whenever a target exists.
 */
export interface VehicleMaintenanceRecord {
  id: string;
  vehicleId: string;
  type: VehicleMaintenanceType;
  title: string;
  serviceDate: string;
  /** @deprecated Legacy odometer-at-service field, kept for old records. New records use `mileageAtService`. */
  mileage?: number;
  nextServiceDate?: string;
  /** @deprecated Legacy manually-entered target mileage, kept for old records. New records derive their target from `mileageAtService` + `serviceIntervalKm`. */
  nextServiceMileage?: number;
  /** Actual odometer reading when this maintenance was performed. No artificial maximum — a vehicle may legitimately exceed 700,000 km. */
  mileageAtService?: number;
  /** Km after `mileageAtService` at which this maintenance is next due. Positive, capped at 200,000 km. */
  serviceIntervalKm?: number;
  /** Snapshot of the previous cycle's target mileage, set only by the "Service Completed" flow — used to derive whether that transition was early/on-time/late. */
  previousTargetMileage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleMaintenanceFormValues = Omit<
  VehicleMaintenanceRecord,
  'id' | 'vehicleId' | 'createdAt' | 'updatedAt' | 'previousTargetMileage'
>;

/** The actual odometer reading when a maintenance record's service was performed, preferring the new field and falling back to the legacy `mileage` field. */
export function getMileageAtService(record: Pick<VehicleMaintenanceRecord, 'mileageAtService' | 'mileage'>): number | undefined {
  return record.mileageAtService ?? record.mileage;
}

/**
 * The mileage at which this maintenance record is/was next due, derived
 * (never stored) so it can never drift out of sync with its sources:
 *
 * 1. If both a mileage-at-service value and a service interval are
 *    available, the target is derived from them (`mileageAtService +
 *    serviceIntervalKm`) — this is the authoritative case for records
 *    created under the current model, and it stays fixed regardless of
 *    the vehicle's live current mileage.
 * 2. Otherwise, if a legacy manually-entered `nextServiceMileage` exists
 *    (records created before this model), that value IS the target —
 *    used as-is rather than invented from an interval that was never
 *    recorded.
 * 3. Otherwise there is no mileage target at all (mileage tracking was
 *    never used for this record) — `undefined`, meaning date-based status
 *    is the only available fallback.
 */
export function getTargetMileage(
  record: Pick<VehicleMaintenanceRecord, 'mileageAtService' | 'mileage' | 'serviceIntervalKm' | 'nextServiceMileage'>,
): number | undefined {
  const mileageAtService = getMileageAtService(record);
  if (mileageAtService !== undefined && record.serviceIntervalKm !== undefined) {
    return mileageAtService + record.serviceIntervalKm;
  }
  return record.nextServiceMileage;
}

/**
 * The effective service interval for display purposes only. Prefers the
 * stored `serviceIntervalKm`; for legacy records that never stored an
 * interval but do have both a mileage-at-service and a legacy target, it
 * is derived arithmetically from those already-trusted values. Never
 * persisted — purely a read-time convenience so old records still show a
 * sensible interval.
 */
export function getServiceIntervalDisplay(record: VehicleMaintenanceRecord): number | undefined {
  if (record.serviceIntervalKm !== undefined) return record.serviceIntervalKm;
  const mileageAtService = getMileageAtService(record);
  if (mileageAtService !== undefined && record.nextServiceMileage !== undefined) {
    const derived = record.nextServiceMileage - mileageAtService;
    return derived > 0 ? derived : undefined;
  }
  return undefined;
}

export type ServiceDeltaKind = 'early' | 'onTime' | 'late';

export interface ServiceDelta {
  kind: ServiceDeltaKind;
  /** Absolute km difference between when the service was actually performed and the previous cycle's target (0 for on-time). */
  km: number;
}

/**
 * How early/late a completed service cycle was relative to the previous
 * cycle's target mileage — only meaningful for records created via the
 * "Service Completed" flow (which snapshot `previousTargetMileage`).
 * `serviceDeltaKm = actualCompletionMileage - previousTargetMileage`:
 * negative means early, zero means on target, positive means late.
 */
export function getServiceDelta(record: VehicleMaintenanceRecord): ServiceDelta | undefined {
  const mileageAtService = getMileageAtService(record);
  if (mileageAtService === undefined || record.previousTargetMileage === undefined) return undefined;
  const deltaKm = mileageAtService - record.previousTargetMileage;
  if (deltaKm < 0) return { kind: 'early', km: -deltaKm };
  if (deltaKm > 0) return { kind: 'late', km: deltaKm };
  return { kind: 'onTime', km: 0 };
}
