import { generateId } from '../../utils/id';
import * as staffRepository from './staffRepository';
import type {
  HouseholdStaff,
  StaffDocument,
  StaffDocumentFormValues,
  StaffFormValues,
  StaffSalaryPayment,
  StaffSalaryPaymentFormValues,
  StaffSalarySchedule,
  StaffSalaryScheduleFormValues,
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

/** Direct, permanent delete of the staff member and all of their documents/salary schedules/salary payments (see staffRepository for the transactional cascade). */
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

export async function createSalarySchedule(
  staffId: string,
  values: StaffSalaryScheduleFormValues,
): Promise<StaffSalarySchedule> {
  const now = new Date().toISOString();
  const schedule: StaffSalarySchedule = {
    id: generateId(),
    staffId,
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await staffRepository.saveSalarySchedule(schedule);
  return schedule;
}

export async function updateSalarySchedule(
  id: string,
  values: StaffSalaryScheduleFormValues,
): Promise<StaffSalarySchedule> {
  const existing = await staffRepository.getSalarySchedule(id);
  if (!existing) {
    throw new Error(`Salary schedule ${id} not found`);
  }
  const updated: StaffSalarySchedule = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await staffRepository.saveSalarySchedule(updated);
  return updated;
}

/** Deletes only the recurring schedule itself — any payments already confirmed against it remain in the staff member's payment history untouched (per Phase 6 correction: editing/deleting a schedule must never make existing history disappear). */
export async function removeSalarySchedule(id: string): Promise<void> {
  await staffRepository.deleteSalarySchedule(id);
}

/** Thrown when a payment would create a second confirmed record for the same (salaryScheduleId, dueDate) occurrence — callers show a specific, localized message for this rather than the generic save-failure one. Different schedules sharing the same due date is not a duplicate. */
export class DuplicateSalaryOccurrenceError extends Error {
  constructor() {
    super('This salary occurrence has already been confirmed as paid');
    this.name = 'DuplicateSalaryOccurrenceError';
  }
}

export async function confirmSalaryPayment(
  staffId: string,
  salaryScheduleId: string,
  dueDate: string,
  values: StaffSalaryPaymentFormValues,
): Promise<StaffSalaryPayment> {
  const existing = await staffRepository.getSalaryPaymentForOccurrence(salaryScheduleId, dueDate);
  if (existing) {
    throw new DuplicateSalaryOccurrenceError();
  }
  const now = new Date().toISOString();
  const payment: StaffSalaryPayment = {
    id: generateId(),
    staffId,
    salaryScheduleId,
    dueDate,
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await staffRepository.saveSalaryPayment(payment);
  return payment;
}

/** Edits an already-confirmed payment's amount/paidDate/notes. Its scheduleId and dueDate (which occurrence this is) never change here. */
export async function updateSalaryPayment(
  id: string,
  values: StaffSalaryPaymentFormValues,
): Promise<StaffSalaryPayment> {
  const existing = await staffRepository.getSalaryPayment(id);
  if (!existing) {
    throw new Error(`Salary payment ${id} not found`);
  }
  const updated: StaffSalaryPayment = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await staffRepository.saveSalaryPayment(updated);
  return updated;
}

export async function removeSalaryPayment(id: string): Promise<void> {
  await staffRepository.deleteSalaryPayment(id);
}
