import { generateId } from '../../utils/id';
import * as staffRepository from './staffRepository';
import type {
  HouseholdStaff,
  StaffDocument,
  StaffDocumentFormValues,
  StaffFormValues,
  StaffSalaryPayment,
  StaffSalaryPaymentFormValues,
} from './types';

export async function createStaffMember(values: StaffFormValues): Promise<HouseholdStaff> {
  const now = new Date().toISOString();
  const staff: HouseholdStaff = {
    id: generateId(),
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await staffRepository.saveStaffMember(staff);
  return staff;
}

export async function updateStaffMember(id: string, values: StaffFormValues): Promise<HouseholdStaff> {
  const existing = await staffRepository.getStaffMember(id);
  if (!existing) {
    throw new Error(`Staff member ${id} not found`);
  }
  const updated: HouseholdStaff = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await staffRepository.saveStaffMember(updated);
  return updated;
}

/** Direct, permanent delete of the staff member and all of their documents/salary payments (see staffRepository for the transactional cascade). */
export async function removeStaffMember(id: string): Promise<void> {
  await staffRepository.deleteStaffWithChildren(id);
}

export async function addStaffDocument(staffId: string, values: StaffDocumentFormValues): Promise<StaffDocument> {
  const now = new Date().toISOString();
  const document: StaffDocument = {
    id: generateId(),
    staffId,
    type: values.type,
    title: values.title,
    file: values.file,
    fileName: values.file.name,
    mimeType: values.file.type || 'application/octet-stream',
    fileSize: values.file.size,
    expiryDate: values.expiryDate,
    createdAt: now,
    updatedAt: now,
  };
  await staffRepository.saveStaffDocument(document);
  return document;
}

export async function removeStaffDocument(id: string): Promise<void> {
  await staffRepository.deleteStaffDocument(id);
}

/** Thrown when a salary payment would create a second record for the same (staffId, salaryMonth) pair — callers show a specific, localized message for this rather than the generic save-failure one. */
export class DuplicateSalaryMonthError extends Error {
  constructor() {
    super('A salary payment for this month already exists');
    this.name = 'DuplicateSalaryMonthError';
  }
}

export async function addSalaryPayment(
  staffId: string,
  values: StaffSalaryPaymentFormValues,
): Promise<StaffSalaryPayment> {
  const existing = await staffRepository.getSalaryPaymentForMonth(staffId, values.salaryMonth);
  if (existing) {
    throw new DuplicateSalaryMonthError();
  }
  const now = new Date().toISOString();
  const payment: StaffSalaryPayment = {
    id: generateId(),
    staffId,
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await staffRepository.saveSalaryPayment(payment);
  return payment;
}

export async function updateSalaryPayment(
  id: string,
  staffId: string,
  values: StaffSalaryPaymentFormValues,
): Promise<StaffSalaryPayment> {
  const existingForMonth = await staffRepository.getSalaryPaymentForMonth(staffId, values.salaryMonth);
  if (existingForMonth && existingForMonth.id !== id) {
    throw new DuplicateSalaryMonthError();
  }
  const payments = await staffRepository.listSalaryPaymentsForStaff(staffId);
  const original = payments.find((payment) => payment.id === id);
  if (!original) {
    throw new Error(`Salary payment ${id} not found`);
  }
  const updated: StaffSalaryPayment = {
    ...original,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await staffRepository.saveSalaryPayment(updated);
  return updated;
}

export async function removeSalaryPayment(id: string): Promise<void> {
  await staffRepository.deleteSalaryPayment(id);
}
