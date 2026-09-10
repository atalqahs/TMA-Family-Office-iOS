import { useCallback, useEffect, useRef, useState } from 'react';
import { getStaffMember, listDocumentsForStaff, listSalaryPaymentsForStaff } from '../staffRepository';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment } from '../types';

/**
 * `staff` is `undefined` while loading, `null` if not found (or deleted).
 *
 * `staffId` can change (navigating from one staff profile straight to
 * another's) while a fetch for the previous id is still in flight.
 * `requestIdRef` tags each fetch and discards any result that isn't the
 * most recently started one, so a slow stale request can never overwrite a
 * newer one's data (same guard as useVehicle/useProperty/useFamilyMember).
 */
export function useStaffMember(staffId: string | undefined) {
  const [staff, setStaff] = useState<HouseholdStaff | null | undefined>(undefined);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<StaffSalaryPayment[]>([]);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!staffId) {
      if (requestId === requestIdRef.current) setStaff(null);
      return;
    }
    try {
      const [foundStaff, docs, payments] = await Promise.all([
        getStaffMember(staffId),
        listDocumentsForStaff(staffId),
        listSalaryPaymentsForStaff(staffId),
      ]);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setStaff(foundStaff ?? null);
      setDocuments(docs);
      setSalaryPayments(payments);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load staff member', err);
      setError(true);
      setStaff(null);
    }
  }, [staffId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { staff, documents, salaryPayments, loading: staff === undefined, error, refresh };
}
