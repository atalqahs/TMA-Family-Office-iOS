import { useCallback, useEffect, useState } from 'react';
import { listActiveVehicles, listAllMaintenanceRecords } from '../vehicleRepository';
import type { Vehicle, VehicleMaintenanceRecord } from '../types';

/**
 * Loads every vehicle plus every maintenance record grouped by vehicleId in
 * one pass, so each VehicleCard can compute its own status badge without an
 * extra IndexedDB query per vehicle.
 */
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceByVehicle, setMaintenanceByVehicle] = useState<Record<string, VehicleMaintenanceRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [vehicleList, allMaintenance] = await Promise.all([listActiveVehicles(), listAllMaintenanceRecords()]);
      const grouped: Record<string, VehicleMaintenanceRecord[]> = {};
      for (const record of allMaintenance) {
        (grouped[record.vehicleId] ??= []).push(record);
      }
      setVehicles(vehicleList);
      setMaintenanceByVehicle(grouped);
    } catch (err) {
      console.error('Failed to load vehicles', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { vehicles, maintenanceByVehicle, loading, error, refresh };
}
