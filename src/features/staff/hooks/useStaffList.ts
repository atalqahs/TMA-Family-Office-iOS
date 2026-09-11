import { useCallback, useEffect, useState } from 'react';
import { listActiveStaff, listAllSalaryPayments, listAllSalarySchedules, listAllStaffDocuments } from '../staffRepository';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment, StaffSalarySchedule } from '../types';

/**
 * Loads every staff member plus every salary schedule/payment and document
 * grouped by staffId in one pass, so each StaffCard's status badge is
 * computed from exactly the same signals as the Profile page's — no
 * per-staff queries, and no risk of the card and profile disagreeing.
 */
export function useStaffList() {
  const [staff, setStaff] = useState<HouseholdStaff[]>([]);
  const [schedulesByStaff, setSchedulesByStaff] = useState<Record<string, StaffSalarySchedule[]>>({});
  const [paymentsByStaff, setPaymentsByStaff] = useState<Record<string, StaffSalaryPayment[]>>({});
  const [documentsByStaff, setDocumentsByStaff] = useState<Record<string, StaffDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [staffList, allSchedules, allPayments, allDocuments] = await Promise.all([
        listActiveStaff(),
        listAllSalarySchedules(),
        listAllSalaryPayments(),
        listAllStaffDocuments(),
      ]);
      const schedulesMap: Record<string, StaffSalarySchedule[]> = {};
      for (const schedule of allSchedules) {
        (schedulesMap[schedule.staffId] ??= []).push(schedule);
      }
      const paymentsMap: Record<string, StaffSalaryPayment[]> = {};
      for (const payment of allPayments) {
        (paymentsMap[payment.staffId] ??= []).push(payment);
      }
      const docsMap: Record<string, StaffDocument[]> = {};
      for (const doc of allDocuments) {
        (docsMap[doc.staffId] ??= []).push(doc);
      }
      setStaff(staffList);
      setSchedulesByStaff(schedulesMap);
      setPaymentsByStaff(paymentsMap);
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

  return { staff, schedulesByStaff, paymentsByStaff, documentsByStaff, loading, error, refresh };
}
