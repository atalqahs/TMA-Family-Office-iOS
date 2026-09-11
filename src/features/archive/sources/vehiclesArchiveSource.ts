import { listVehicles } from '../../vehicles/vehicleRepository';
import type { ArchivedCardItem } from '../types';

/** Reuses `listVehicles` (non-deleted, archived included) -- never re-queries IndexedDB itself. */
export async function loadArchivedVehicles(): Promise<ArchivedCardItem[]> {
  const all = await listVehicles();
  return all
    .filter((vehicle) => vehicle.archivedAt !== undefined)
    .map((vehicle) => ({
      id: vehicle.id,
      sourceType: 'vehicles' as const,
      title: vehicle.name,
      archivedAt: vehicle.archivedAt as string,
      route: `/vehicles/${vehicle.id}`,
    }));
}
