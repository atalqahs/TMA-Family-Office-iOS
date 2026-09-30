import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listActiveStaff, listAllSalaryPayments, listAllSalarySchedules, listAllStaffDocuments } from '../staffRepository';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment, StaffSalarySchedule } from '../types';

interface StaffListData {
  staff: HouseholdStaff[];
  schedulesByStaff: Record<string, StaffSalarySchedule[]>;
  paymentsByStaff: Record<string, StaffSalaryPayment[]>;
  documentsByStaff: Record<string, StaffDocument[]>;
}

const EMPTY: StaffListData = { staff: [], schedulesByStaff: {}, paymentsByStaff: {}, documentsByStaff: {} };

/**
 * Loads every staff member plus every salary schedule/payment and document
 * grouped by staffId in one pass, so each StaffCard's status badge is
 * computed from exactly the same signals as the Profile page's — no
 * per-staff queries, and no risk of the card and profile disagreeing.
 */
export function useStaffList() {
  const fetcher = useCallback(async (): Promise<StaffListData> => {
    const [staffList, allSchedules, allPayments, allDocuments] = await Promise.all([
      listActiveStaff(),
      listAllSalarySchedules(),
      listAllSalaryPayments(),
      listAllStaffDocuments(),
    ]);
    const schedulesByStaff: Record<string, StaffSalarySchedule[]> = {};
    for (const schedule of allSchedules) {
      (schedulesByStaff[schedule.staffId] ??= []).push(schedule);
    }
    const paymentsByStaff: Record<string, StaffSalaryPayment[]> = {};
    for (const payment of allPayments) {
      (paymentsByStaff[payment.staffId] ??= []).push(payment);
    }
    const documentsByStaff: Record<string, StaffDocument[]> = {};
    for (const doc of allDocuments) {
      (documentsByStaff[doc.staffId] ??= []).push(doc);
    }
    return { staff: staffList, schedulesByStaff, paymentsByStaff, documentsByStaff };
  }, []);
  const { data, loading, error, refresh } = useAsyncResource(fetcher, EMPTY);
  return { ...data, loading, error, refresh };
}
