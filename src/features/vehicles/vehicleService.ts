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
  await vehicleRepository.saveMaintenanceRecord(record);
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
  await vehicleRepository.saveMaintenanceRecord(updated);
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
  await vehicleRepository.saveMaintenanceRecord(record);
  return record;
}
