import { getDB } from '../../storage/db';
import type { Vehicle, VehicleDocument, VehicleMaintenanceRecord } from './types';

/**
 * All IndexedDB access for the Vehicles module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `vehicleService.ts`, which builds
 * on it) instead.
 */

export async function listVehicles(): Promise<Vehicle[]> {
  const db = await getDB();
  const all = await db.getAll('vehicles');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getVehicle(id: string): Promise<Vehicle | undefined> {
  const db = await getDB();
  return db.get('vehicles', id);
}

export async function saveVehicle(vehicle: Vehicle): Promise<void> {
  const db = await getDB();
  await db.put('vehicles', vehicle);
}

export async function getVehicleCount(): Promise<number> {
  const db = await getDB();
  return db.count('vehicles');
}

export async function listDocumentsForVehicle(vehicleId: string): Promise<VehicleDocument[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('vehicleDocuments', 'vehicleId', vehicleId);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveVehicleDocument(document: VehicleDocument): Promise<void> {
  const db = await getDB();
  await db.put('vehicleDocuments', document);
}

export async function deleteVehicleDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('vehicleDocuments', id);
}

export async function getMaintenanceRecord(id: string): Promise<VehicleMaintenanceRecord | undefined> {
  const db = await getDB();
  return db.get('vehicleMaintenanceRecords', id);
}

export async function listMaintenanceForVehicle(vehicleId: string): Promise<VehicleMaintenanceRecord[]> {
  const db = await getDB();
  const records = await db.getAllFromIndex('vehicleMaintenanceRecords', 'vehicleId', vehicleId);
  return records.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
}

/** Every maintenance record across all vehicles, for computing card-level status without an N+1 query per vehicle. */
export async function listAllMaintenanceRecords(): Promise<VehicleMaintenanceRecord[]> {
  const db = await getDB();
  return db.getAll('vehicleMaintenanceRecords');
}

/**
 * Saves a maintenance record and, in the SAME IndexedDB transaction,
 * applies the vehicle's live-mileage forward-sync invariant (see
 * `vehicleService.ts`) — so the two writes can never partially succeed.
 * If anything in this transaction fails, IndexedDB rolls back every write
 * made within it: either the maintenance record AND the (possible)
 * vehicle mileage bump both land, or neither does.
 *
 * The referenced vehicle is read and verified INSIDE this same
 * transaction before the maintenance record is ever written. If it
 * doesn't exist (e.g. deleted concurrently), the transaction is aborted
 * and rejects — the maintenance record is never saved, so a maintenance
 * record can never end up orphaned from its vehicle.
 *
 * `computeVehicleMileageUpdate` is supplied by the caller (the service
 * layer, which owns the forward-only invariant) and decides, given the
 * vehicle as read inside this same transaction, what its new
 * `currentMileage` should be — or `undefined` for "no change needed".
 * The repository only owns the transaction mechanics; it has no opinion
 * on when a vehicle's mileage should move.
 */
export async function saveMaintenanceRecordAndSyncVehicleMileage(
  record: VehicleMaintenanceRecord,
  computeVehicleMileageUpdate: (vehicle: Vehicle) => number | undefined,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['vehicleMaintenanceRecords', 'vehicles'], 'readwrite');
  const maintenanceStore = tx.objectStore('vehicleMaintenanceRecords');
  const vehiclesStore = tx.objectStore('vehicles');

  const vehicle = await vehiclesStore.get(record.vehicleId);
  if (!vehicle) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new Error(`Vehicle ${record.vehicleId} not found`);
  }

  await maintenanceStore.put(record);

  const newMileage = computeVehicleMileageUpdate(vehicle);
  if (newMileage !== undefined) {
    await vehiclesStore.put({ ...vehicle, currentMileage: newMileage, updatedAt: new Date().toISOString() });
  }

  await tx.done;
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('vehicleMaintenanceRecords', id);
}

/**
 * Direct, permanent delete (acceptable for this experimental prototype).
 * Deletes the vehicle and every document/maintenance record that belongs
 * to it in a single IndexedDB transaction spanning all three stores, so
 * the operation either fully commits or fully rolls back — never leaving
 * orphaned child records.
 */
export async function deleteVehicleWithChildren(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['vehicles', 'vehicleDocuments', 'vehicleMaintenanceRecords'], 'readwrite');
  const documentsStore = tx.objectStore('vehicleDocuments');
  const maintenanceStore = tx.objectStore('vehicleMaintenanceRecords');

  const [documentIds, maintenanceIds] = await Promise.all([
    documentsStore.index('vehicleId').getAllKeys(id),
    maintenanceStore.index('vehicleId').getAllKeys(id),
  ]);

  await Promise.all([
    tx.objectStore('vehicles').delete(id),
    ...documentIds.map((documentId) => documentsStore.delete(documentId)),
    ...maintenanceIds.map((recordId) => maintenanceStore.delete(recordId)),
  ]);
  await tx.done;
}
