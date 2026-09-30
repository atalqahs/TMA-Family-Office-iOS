import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listActiveVehicles, listAllMaintenanceRecords } from '../vehicleRepository';
import type { Vehicle, VehicleMaintenanceRecord } from '../types';

interface VehiclesData {
  vehicles: Vehicle[];
  maintenanceByVehicle: Record<string, VehicleMaintenanceRecord[]>;
}

const EMPTY: VehiclesData = { vehicles: [], maintenanceByVehicle: {} };

/**
 * Loads every vehicle plus every maintenance record grouped by vehicleId in
 * one pass, so each VehicleCard can compute its own status badge without an
 * extra IndexedDB query per vehicle.
 */
export function useVehicles() {
  const fetcher = useCallback(async (): Promise<VehiclesData> => {
    const [vehicleList, allMaintenance] = await Promise.all([listActiveVehicles(), listAllMaintenanceRecords()]);
    const grouped: Record<string, VehicleMaintenanceRecord[]> = {};
    for (const record of allMaintenance) {
      (grouped[record.vehicleId] ??= []).push(record);
    }
    return { vehicles: vehicleList, maintenanceByVehicle: grouped };
  }, []);
  const { data, loading, error, refresh } = useAsyncResource(fetcher, EMPTY);
  return { ...data, loading, error, refresh };
}
