import { describe, expect, it } from 'vitest';
import * as staffRepository from '../../src/features/staff/staffRepository';
import { confirmSalaryPayment, updateSalaryPayment } from '../../src/features/staff/staffService';
import { getNextUnpaidOccurrence } from '../../src/features/staff/salarySchedule';

const NOW = '2026-01-01T00:00:00.000Z';

/**
 * Permanent Phase 10.1 regression suite -- "PAYMENT HISTORY MUST REMAIN
 * EDITABLE" (items #35-39) and "MULTIPLE SALARY SCHEDULES" (items #40-42).
 */
describe('Payment History remains editable, independent of the recurring schedule', () => {
  it('35-36. an already-confirmed payment can be edited to an amount that differs from the schedule amount (e.g. a deduction)', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Ahmed', createdAt: NOW, updatedAt: NOW });
    const payment = await confirmSalaryPayment('s1', 'sch1', '2026-01-01', { amount: 170, paidDate: '2026-01-01' });

    const edited = await updateSalaryPayment(payment.id, { amount: 150, paidDate: '2026-01-01', notes: 'Deduction applied' });
    expect(edited.amount).toBe(150);
  });

  it('37. editing a historical payment amount never changes the recurring schedule\'s own amount', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Ahmed', createdAt: NOW, updatedAt: NOW });
    await staffRepository.saveSalarySchedule({
      id: 'sch1',
      staffId: 's1',
      amount: 170,
      recurrence: 'monthly',
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    const payment = await confirmSalaryPayment('s1', 'sch1', '2026-01-01', { amount: 170, paidDate: '2026-01-01' });
    await updateSalaryPayment(payment.id, { amount: 150, paidDate: '2026-01-01' });

    const schedule = await staffRepository.getSalarySchedule('sch1');
    expect(schedule?.amount).toBe(170); // untouched
  });

  it('38. editing a historical payment amount never changes future recurrence (Next Payment is unaffected)', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Ahmed', createdAt: NOW, updatedAt: NOW });
    const schedule = {
      id: 'sch1',
      staffId: 's1',
      amount: 170,
      recurrence: 'monthly' as const,
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    };
    await staffRepository.saveSalarySchedule(schedule);
    const payment = await confirmSalaryPayment('s1', 'sch1', '2026-01-01', { amount: 170, paidDate: '2026-01-01' });
    await updateSalaryPayment(payment.id, { amount: 150, paidDate: '2026-01-01' });

    const payments = await staffRepository.listSalaryPaymentsForStaff('s1');
    const nextPayment = getNextUnpaidOccurrence(schedule, payments);
    expect(nextPayment?.dueDate).toBe('2026-02-01'); // February, exactly as it would be without the edit
  });

  it('39. editing a payment never creates a second payment record or duplicates the occurrence', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Ahmed', createdAt: NOW, updatedAt: NOW });
    const payment = await confirmSalaryPayment('s1', 'sch1', '2026-01-01', { amount: 170, paidDate: '2026-01-01' });
    await updateSalaryPayment(payment.id, { amount: 150, paidDate: '2026-01-05', notes: 'Adjusted' });

    const payments = await staffRepository.listSalaryPaymentsForStaff('s1');
    expect(payments).toHaveLength(1);
    expect(payments[0].id).toBe(payment.id); // same record, not a new one
  });
});

describe('Multiple recurring salary schedules per Staff member remain fully supported', () => {
  it('40-41. each schedule independently derives its own Next Payment (earliest unpaid occurrence)', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Ahmed', createdAt: NOW, updatedAt: NOW });
    const scheduleA = {
      id: 'schA',
      staffId: 's1',
      amount: 170,
      recurrence: 'monthly' as const,
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    };
    const scheduleB = {
      id: 'schB',
      staffId: 's1',
      amount: 50,
      recurrence: 'weekly' as const,
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    };
    await staffRepository.saveSalarySchedule(scheduleA);
    await staffRepository.saveSalarySchedule(scheduleB);

    const schedules = await staffRepository.listSalarySchedulesForStaff('s1');
    expect(schedules).toHaveLength(2);

    const nextA = getNextUnpaidOccurrence(scheduleA, []);
    const nextB = getNextUnpaidOccurrence(scheduleB, []);
    expect(nextA?.dueDate).toBe('2026-01-01');
    expect(nextB?.dueDate).toBe('2026-01-01');
    expect(nextA?.amount).toBe(170);
    expect(nextB?.amount).toBe(50);
  });

  it('42. confirming a payment on schedule A never advances or affects schedule B\'s own Next Payment', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Ahmed', createdAt: NOW, updatedAt: NOW });
    const scheduleA = {
      id: 'schA',
      staffId: 's1',
      amount: 170,
      recurrence: 'monthly' as const,
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    };
    const scheduleB = {
      id: 'schB',
      staffId: 's1',
      amount: 50,
      recurrence: 'monthly' as const,
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    };
    await staffRepository.saveSalarySchedule(scheduleA);
    await staffRepository.saveSalarySchedule(scheduleB);
    await confirmSalaryPayment('s1', 'schA', '2026-01-01', { amount: 170, paidDate: '2026-01-01' });

    const payments = await staffRepository.listSalaryPaymentsForStaff('s1');
    const nextA = getNextUnpaidOccurrence(scheduleA, payments);
    const nextB = getNextUnpaidOccurrence(scheduleB, payments);
    expect(nextA?.dueDate).toBe('2026-02-01'); // advanced
    expect(nextB?.dueDate).toBe('2026-01-01'); // completely unaffected
  });
});
