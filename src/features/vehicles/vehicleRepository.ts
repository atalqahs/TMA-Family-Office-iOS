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

export async function saveMaintenanceRecord(record: VehicleMaintenanceRecord): Promise<void> {
  const db = await getDB();
  await db.put('vehicleMaintenanceRecords', record);
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
