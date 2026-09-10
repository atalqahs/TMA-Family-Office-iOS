import { useCallback, useEffect, useState } from 'react';
import { listAllSalaryPayments, listAllStaffDocuments, listStaff } from '../staffRepository';
import type { HouseholdStaff, StaffDocument } from '../types';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Loads every staff member plus every salary payment and document grouped
 * by staffId in one pass, so each StaffCard's status badge is computed
 * from exactly the same signals as the Profile page's — no per-staff
 * queries, and no risk of the card and profile disagreeing.
 */
export function useStaffList() {
  const [staff, setStaff] = useState<HouseholdStaff[]>([]);
  const [currentMonthPaidByStaff, setCurrentMonthPaidByStaff] = useState<Record<string, boolean>>({});
  const [documentsByStaff, setDocumentsByStaff] = useState<Record<string, StaffDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [staffList, allPayments, allDocuments] = await Promise.all([
        listStaff(),
        listAllSalaryPayments(),
        listAllStaffDocuments(),
      ]);
      const thisMonth = currentMonth();
      const paidMap: Record<string, boolean> = {};
      for (const payment of allPayments) {
        if (payment.salaryMonth === thisMonth) {
          paidMap[payment.staffId] = true;
        }
      }
      const docsMap: Record<string, StaffDocument[]> = {};
      for (const doc of allDocuments) {
        (docsMap[doc.staffId] ??= []).push(doc);
      }
      setStaff(staffList);
      setCurrentMonthPaidByStaff(paidMap);
      setDocumentsByStaff(docsMap);
    } catch (err) {
      console.error('Failed to load staff', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { staff, currentMonthPaidByStaff, documentsByStaff, loading, error, refresh };
}
