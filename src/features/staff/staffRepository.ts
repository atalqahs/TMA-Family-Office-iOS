import { getDB } from '../../storage/db';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment } from './types';

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

export async function listSalaryPaymentsForStaff(staffId: string): Promise<StaffSalaryPayment[]> {
  const db = await getDB();
  const payments = await db.getAllFromIndex('staffSalaryPayments', 'staffId', staffId);
  return payments.sort((a, b) => b.salaryMonth.localeCompare(a.salaryMonth));
}

/** Every salary payment across all staff, for computing card-level status without an N+1 query per staff member. */
export async function listAllSalaryPayments(): Promise<StaffSalaryPayment[]> {
  const db = await getDB();
  return db.getAll('staffSalaryPayments');
}

export async function getSalaryPaymentForMonth(
  staffId: string,
  salaryMonth: string,
): Promise<StaffSalaryPayment | undefined> {
  const db = await getDB();
  return db.getFromIndex('staffSalaryPayments', 'staffId_salaryMonth', [staffId, salaryMonth]);
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
 * Deletes the staff member and every document/salary payment that belongs
 * to them in a single IndexedDB transaction spanning all three stores, so
 * the operation either fully commits or fully rolls back — never leaving
 * orphaned child records.
 */
export async function deleteStaffWithChildren(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['householdStaff', 'staffDocuments', 'staffSalaryPayments'], 'readwrite');
  const documentsStore = tx.objectStore('staffDocuments');
  const paymentsStore = tx.objectStore('staffSalaryPayments');

  const [documentIds, paymentIds] = await Promise.all([
    documentsStore.index('staffId').getAllKeys(id),
    paymentsStore.index('staffId').getAllKeys(id),
  ]);

  await Promise.all([
    tx.objectStore('householdStaff').delete(id),
    ...documentIds.map((documentId) => documentsStore.delete(documentId)),
    ...paymentIds.map((paymentId) => paymentsStore.delete(paymentId)),
  ]);
  await tx.done;
}
