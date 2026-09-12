import { generateId } from '../../utils/id';
import * as vehicleRepository from './vehicleRepository';
import { getTargetMileage } from './types';
import type {
  Vehicle,
  VehicleDocument,
  VehicleDocumentFormValues,
  VehicleFormValues,
  VehicleMaintenanceFormValues,
  VehicleMaintenanceRecord,
} from './types';

export async function createVehicle(values: VehicleFormValues): Promise<Vehicle> {
  const now = new Date().toISOString();
  const vehicle: Vehicle = {
    id: generateId(),
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await vehicleRepository.saveVehicle(vehicle);
  return vehicle;
}

export async function updateVehicle(id: string, values: VehicleFormValues): Promise<Vehicle> {
  const existing = await vehicleRepository.getVehicle(id);
  if (!existing) {
    throw new Error(`Vehicle ${id} not found`);
  }
  const updated: Vehicle = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await vehicleRepository.saveVehicle(updated);
  return updated;
}

/** Direct, permanent delete of the vehicle and all of its documents/maintenance records (see vehicleRepository for the transactional cascade). */
export async function removeVehicle(id: string): Promise<void> {
  await vehicleRepository.deleteVehicleWithChildren(id);
}

/** Archives the vehicle (Phase 10): a display/organization change only -- see features/archive/. */
export async function archiveVehicle(id: string): Promise<void> {
  await vehicleRepository.archiveVehicle(id);
}

export async function unarchiveVehicle(id: string): Promise<void> {
  await vehicleRepository.unarchiveVehicle(id);
}

export async function addVehicleDocument(
  vehicleId: string,
  values: VehicleDocumentFormValues,
): Promise<VehicleDocument> {
  const now = new Date().toISOString();
  const document: VehicleDocument = {
    id: generateId(),
    vehicleId,
    type: values.type,
    title: values.title,
    file: values.file,
    fileName: values.file.name,
    mimeType: values.file.type || 'application/octet-stream',
    fileSize: values.file.size,
    expiryDate: values.expiryDate,
    createdAt: now,
    updatedAt: now,
  };
  await vehicleRepository.saveVehicleDocument(document);
  return document;
}

export async function removeVehicleDocument(id: string): Promise<void> {
  await vehicleRepository.deleteVehicleDocument(id);
}

/**
 * The vehicle-mileage forward-sync invariant applied whenever a
 * maintenance record is saved: a maintenance record's actual odometer
 * reading (`mileageAtService`) always represents a real point-in-time
 * reading, so if it's ahead of the vehicle's current live mileage, the
 * vehicle was simply stale and should be caught up. A reading equal to or
 * behind the vehicle's current live mileage (editing an older,
 * already-superseded cycle; a historical entry entered out of order) must
 * never move the vehicle backward, so this returns `undefined` ("no
 * change") in that case.
 *
 * Pure and exported so the invariant itself can be tested directly,
 * without IndexedDB. The actual persistence -- applying this decision in
 * the same transaction as the maintenance-record write -- is
 * `vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage`.
 */
export function computeForwardMileageSync(
  vehicle: Pick<Vehicle, 'currentMileage'>,
  mileageAtService: number | undefined,
): number | undefined {
  if (mileageAtService === undefined) return undefined;
  if (vehicle.currentMileage !== undefined && mileageAtService <= vehicle.currentMileage) return undefined;
  return mileageAtService;
}

export async function addMaintenanceRecord(
  vehicleId: string,
  values: VehicleMaintenanceFormValues,
): Promise<VehicleMaintenanceRecord> {
  const now = new Date().toISOString();
  const record: VehicleMaintenanceRecord = {
    id: generateId(),
    vehicleId,
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(record, (vehicle) =>
    computeForwardMileageSync(vehicle, values.mileageAtService),
  );
  return record;
}

export async function updateMaintenanceRecord(
  id: string,
  values: VehicleMaintenanceFormValues,
): Promise<VehicleMaintenanceRecord> {
  const existing = await vehicleRepository.getMaintenanceRecord(id);
  if (!existing) {
    throw new Error(`Maintenance record ${id} not found`);
  }
  const updated: VehicleMaintenanceRecord = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(updated, (vehicle) =>
    computeForwardMileageSync(vehicle, values.mileageAtService),
  );
  return updated;
}

export async function removeMaintenanceRecord(id: string): Promise<void> {
  await vehicleRepository.deleteMaintenanceRecord(id);
}

/**
 * Starts a new maintenance cycle for the same maintenance item ("Service
 * Completed"). This ALWAYS creates a brand-new record from the actual
 * odometer reading supplied in `values.mileageAtService` — it never
 * continues from `sourceRecord`'s old target mileage — so an early, on-time,
 * or late completion all correctly produce a new target of `actual mileage +
 * serviceIntervalKm`, per the mileage-priority maintenance model.
 *
 * `sourceRecord` itself is left completely untouched: its own history
 * (old target, old service date) is preserved exactly as it was. The new
 * record snapshots `sourceRecord`'s derived target as `previousTargetMileage`
 * so the early/on-time/late delta for this transition can be computed later
 * even if `sourceRecord` is subsequently edited or deleted.
 */
export async function completeMaintenanceRecord(
  vehicleId: string,
  sourceRecord: VehicleMaintenanceRecord,
  values: VehicleMaintenanceFormValues,
): Promise<VehicleMaintenanceRecord> {
  const now = new Date().toISOString();
  const record: VehicleMaintenanceRecord = {
    id: generateId(),
    vehicleId,
    ...values,
    previousTargetMileage: getTargetMileage(sourceRecord),
    createdAt: now,
    updatedAt: now,
  };
  await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(record, (vehicle) =>
    computeForwardMileageSync(vehicle, values.mileageAtService),
  );
  return record;
}
