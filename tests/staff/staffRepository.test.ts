import { describe, expect, it } from 'vitest';
import * as staffRepository from '../../src/features/staff/staffRepository';
import {
  confirmSalaryPayment,
  DuplicateSalaryOccurrenceError,
  removeSalarySchedule,
} from '../../src/features/staff/staffService';
import type { HouseholdStaff, StaffDocument, StaffSalarySchedule } from '../../src/features/staff/types';

function staff(overrides: Partial<HouseholdStaff> = {}): HouseholdStaff {
  return {
    id: 'staff1',
    fullName: 'Ahmed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('duplicate salary payment prevention', () => {
  it('confirmSalaryPayment throws DuplicateSalaryOccurrenceError for an already-confirmed occurrence', async () => {
    await staffRepository.saveStaffMember(staff());
    await confirmSalaryPayment('staff1', 's1', '2026-01-01', { amount: 130, paidDate: '2026-01-02' });
    await expect(
      confirmSalaryPayment('staff1', 's1', '2026-01-01', { amount: 130, paidDate: '2026-01-03' }),
    ).rejects.toThrow(DuplicateSalaryOccurrenceError);
  });

  it('is enforced atomically at the IndexedDB level (unique scheduleId_dueDate index), not just by the app-level pre-check', async () => {
    await staffRepository.saveStaffMember(staff());
    await staffRepository.saveSalaryPayment({
      id: 'p1',
      staffId: 'staff1',
      salaryScheduleId: 's1',
      dueDate: '2026-01-01',
      amount: 130,
      paidDate: '2026-01-02',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    // A second, DIFFERENT payment record for the exact same (schedule, dueDate) pair.
    await expect(
      staffRepository.saveSalaryPayment({
        id: 'p2',
        staffId: 'staff1',
        salaryScheduleId: 's1',
        dueDate: '2026-01-01',
        amount: 130,
        paidDate: '2026-01-05',
        createdAt: '2026-01-05T00:00:00.000Z',
        updatedAt: '2026-01-05T00:00:00.000Z',
      }),
    ).rejects.toThrow();
  });

  it('two DIFFERENT schedules sharing the same due date is NOT a duplicate', async () => {
    await staffRepository.saveStaffMember(staff());
    await confirmSalaryPayment('staff1', 's1', '2026-01-01', { amount: 130, paidDate: '2026-01-01' });
    await expect(
      confirmSalaryPayment('staff1', 's2', '2026-01-01', { amount: 200, paidDate: '2026-01-01' }),
    ).resolves.toBeDefined();
  });
});

describe('payment history independent of future schedule changes', () => {
  it('deleting a salary schedule leaves its already-confirmed payments untouched', async () => {
    await staffRepository.saveStaffMember(staff());
    const schedule: StaffSalarySchedule = {
      id: 's1',
      staffId: 'staff1',
      amount: 130,
      frequency: 'month',
      interval: 1,
      dueDayOfMonth: 1,
      startDate: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await staffRepository.saveSalarySchedule(schedule);
    await confirmSalaryPayment('staff1', 's1', '2026-01-01', { amount: 130, paidDate: '2026-01-02' });

    await removeSalarySchedule('s1');

    const remainingPayments = await staffRepository.listSalaryPaymentsForStaff('staff1');
    expect(remainingPayments).toHaveLength(1);
    expect(remainingPayments[0].salaryScheduleId).toBe('s1');
    expect(await staffRepository.getSalarySchedule('s1')).toBeUndefined();
  });
});

describe('write-boundary correctness: deleteStaffWithChildren cascade', () => {
  it('deletes the staff member and every document/schedule/payment that belongs to them, atomically', async () => {
    await staffRepository.saveStaffMember(staff());
    const doc: StaffDocument = {
      id: 'd1',
      staffId: 'staff1',
      type: 'civilId',
      title: 'Civil ID',
      file: new Blob(['x']),
      fileName: 'id.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await staffRepository.saveStaffDocument(doc);
    await staffRepository.saveSalarySchedule({
      id: 's1',
      staffId: 'staff1',
      amount: 130,
      frequency: 'month',
      interval: 1,
      startDate: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await confirmSalaryPayment('staff1', 's1', '2026-01-01', { amount: 130, paidDate: '2026-01-01' });

    await staffRepository.deleteStaffWithChildren('staff1');

    expect(await staffRepository.getStaffMember('staff1')).toBeUndefined();
    expect(await staffRepository.listDocumentsForStaff('staff1')).toEqual([]);
    expect(await staffRepository.listSalarySchedulesForStaff('staff1')).toEqual([]);
    expect(await staffRepository.listSalaryPaymentsForStaff('staff1')).toEqual([]);
  });

  it('never touches another staff member’s records', async () => {
    await staffRepository.saveStaffMember(staff({ id: 'staff1' }));
    await staffRepository.saveStaffMember(staff({ id: 'staff2' }));
    await staffRepository.saveSalarySchedule({
      id: 's2',
      staffId: 'staff2',
      amount: 100,
      frequency: 'month',
      interval: 1,
      startDate: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await staffRepository.deleteStaffWithChildren('staff1');

    expect(await staffRepository.getStaffMember('staff2')).toBeDefined();
    expect(await staffRepository.listSalarySchedulesForStaff('staff2')).toHaveLength(1);
  });
});
