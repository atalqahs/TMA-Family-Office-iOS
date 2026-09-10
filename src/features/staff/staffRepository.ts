import { getDB } from '../../storage/db';
import { getPaymentDueDate } from './types';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment, StaffSalarySchedule } from './types';

/**
 * All IndexedDB access for the Staff module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `staffService.ts`, which builds on
 * it) instead.
 */

export async function listStaff(): Promise<HouseholdStaff[]> {
  const db = await getDB();
  const all = await db.getAll('householdStaff');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getStaffMember(id: string): Promise<HouseholdStaff | undefined> {
  const db = await getDB();
  return db.get('householdStaff', id);
}

export async function saveStaffMember(staff: HouseholdStaff): Promise<void> {
  const db = await getDB();
  await db.put('householdStaff', staff);
}

export async function getStaffCount(): Promise<number> {
  const db = await getDB();
  return db.count('householdStaff');
}

export async function listDocumentsForStaff(staffId: string): Promise<StaffDocument[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('staffDocuments', 'staffId', staffId);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every staff document across all staff, for computing card-level status without an N+1 query per staff member. */
export async function listAllStaffDocuments(): Promise<StaffDocument[]> {
  const db = await getDB();
  return db.getAll('staffDocuments');
}

export async function saveStaffDocument(document: StaffDocument): Promise<void> {
  const db = await getDB();
  await db.put('staffDocuments', document);
}

export async function deleteStaffDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('staffDocuments', id);
}

export async function listSalarySchedulesForStaff(staffId: string): Promise<StaffSalarySchedule[]> {
  const db = await getDB();
  const schedules = await db.getAllFromIndex('staffSalarySchedules', 'staffId', staffId);
  return schedules.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Every salary schedule across all staff, for computing card-level status without an N+1 query per staff member. */
export async function listAllSalarySchedules(): Promise<StaffSalarySchedule[]> {
  const db = await getDB();
  return db.getAll('staffSalarySchedules');
}

export async function getSalarySchedule(id: string): Promise<StaffSalarySchedule | undefined> {
  const db = await getDB();
  return db.get('staffSalarySchedules', id);
}

export async function saveSalarySchedule(schedule: StaffSalarySchedule): Promise<void> {
  const db = await getDB();
  await db.put('staffSalarySchedules', schedule);
}

export async function deleteSalarySchedule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('staffSalarySchedules', id);
}

export async function listSalaryPaymentsForStaff(staffId: string): Promise<StaffSalaryPayment[]> {
  const db = await getDB();
  const payments = await db.getAllFromIndex('staffSalaryPayments', 'staffId', staffId);
  return payments.sort((a, b) => {
    const aDate = getPaymentDueDate(a) ?? a.paidDate;
    const bDate = getPaymentDueDate(b) ?? b.paidDate;
    return bDate.localeCompare(aDate);
  });
}

/** Every salary payment across all staff, for computing card-level status without an N+1 query per staff member. */
export async function listAllSalaryPayments(): Promise<StaffSalaryPayment[]> {
  const db = await getDB();
  return db.getAll('staffSalaryPayments');
}

export async function getSalaryPayment(id: string): Promise<StaffSalaryPayment | undefined> {
  const db = await getDB();
  return db.get('staffSalaryPayments', id);
}

/** Looks up an existing confirmed payment for one specific schedule occurrence (identified by scheduleId + dueDate) — used to prevent confirming the same occurrence twice. Different schedules may share the same dueDate; that is not a duplicate. */
export async function getSalaryPaymentForOccurrence(
  salaryScheduleId: string,
  dueDate: string,
): Promise<StaffSalaryPayment | undefined> {
  const db = await getDB();
  return db.getFromIndex('staffSalaryPayments', 'scheduleId_dueDate', [salaryScheduleId, dueDate]);
}

export async function saveSalaryPayment(payment: StaffSalaryPayment): Promise<void> {
  const db = await getDB();
  await db.put('staffSalaryPayments', payment);
}

export async function deleteSalaryPayment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('staffSalaryPayments', id);
}

/**
 * Direct, permanent delete (acceptable for this experimental prototype).
 * Deletes the staff member and every document/salary schedule/salary
 * payment that belongs to them in a single IndexedDB transaction spanning
 * all four stores, so the operation either fully commits or fully rolls
 * back — never leaving orphaned child records.
 */
export async function deleteStaffWithChildren(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['householdStaff', 'staffDocuments', 'staffSalarySchedules', 'staffSalaryPayments'],
    'readwrite',
  );
  const documentsStore = tx.objectStore('staffDocuments');
  const schedulesStore = tx.objectStore('staffSalarySchedules');
  const paymentsStore = tx.objectStore('staffSalaryPayments');

  const [documentIds, scheduleIds, paymentIds] = await Promise.all([
    documentsStore.index('staffId').getAllKeys(id),
    schedulesStore.index('staffId').getAllKeys(id),
    paymentsStore.index('staffId').getAllKeys(id),
  ]);

  await Promise.all([
    tx.objectStore('householdStaff').delete(id),
    ...documentIds.map((documentId) => documentsStore.delete(documentId)),
    ...scheduleIds.map((scheduleId) => schedulesStore.delete(scheduleId)),
    ...paymentIds.map((paymentId) => paymentsStore.delete(paymentId)),
  ]);
  await tx.done;
}
