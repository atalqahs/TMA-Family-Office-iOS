import { useCallback, useEffect, useRef, useState } from 'react';
import { getVehicle, listDocumentsForVehicle, listMaintenanceForVehicle } from '../vehicleRepository';
import type { Vehicle, VehicleDocument, VehicleMaintenanceRecord } from '../types';

/**
 * `vehicle` is `undefined` while loading, `null` if not found (or deleted).
 *
 * `vehicleId` can change (navigating from one vehicle's profile straight to
 * another's) while a fetch for the previous id is still in flight.
 * `requestIdRef` tags each fetch and discards any result that isn't the
 * most recently started one, so a slow stale request can never overwrite a
 * newer one's data (same guard as useProperty/useFamilyMember).
 */
export function useVehicle(vehicleId: string | undefined) {
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<VehicleMaintenanceRecord[]>([]);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!vehicleId) {
      if (requestId === requestIdRef.current) setVehicle(null);
      return;
    }
    try {
      const [foundVehicle, docs, records] = await Promise.all([
        getVehicle(vehicleId),
        listDocumentsForVehicle(vehicleId),
        listMaintenanceForVehicle(vehicleId),
      ]);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setVehicle(foundVehicle ?? null);
      setDocuments(docs);
      setMaintenanceRecords(records);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load vehicle', err);
      setError(true);
      setVehicle(null);
    }
  }, [vehicleId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { vehicle, documents, maintenanceRecords, loading: vehicle === undefined, error, refresh };
}
