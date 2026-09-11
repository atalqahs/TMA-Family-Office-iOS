import { describe, expect, it, vi } from 'vitest';
import * as contractRepository from '../../src/features/contracts/contractRepository';
import { getActionableNotificationCount, loadNotifications } from '../../src/features/notifications/notificationService';
import * as staffRepository from '../../src/features/staff/staffRepository';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { createTask } from '../../src/features/tasks/taskService';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';

const NOW = new Date(2026, 5, 15);

describe('loadNotifications: aggregation over real repositories', () => {
  it('36. zero source data across every module aggregates to an empty list', async () => {
    expect(await loadNotifications(NOW)).toEqual([]);
  });

  it('37. mixed sources (vehicle + contract + staff + task all with an issue) all aggregate together, each with the correct route', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Land Cruiser',
      insuranceExpiry: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await contractRepository.saveContract({
      id: 'c1',
      title: 'Maintenance Contract',
      contractType: 'maintenance',
      partyName: 'ACME',
      startDate: '2026-01-01',
      endDate: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await staffRepository.saveStaffMember({
      id: 's1',
      fullName: 'Ahmed',
      residencyExpiry: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({ groupId: 'g1', title: 'Pay school fees', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-01-01' });

    const items = await loadNotifications(NOW);
    expect(items).toHaveLength(4);

    const bySource = Object.fromEntries(items.map((item) => [item.sourceType, item]));
    expect(bySource.vehicle.route).toBe('/vehicles/v1');
    expect(bySource.contract.route).toBe('/contracts/c1');
    expect(bySource.staff.route).toBe('/staff/s1');
    expect(bySource.task.route).toMatch(/^\/tasks\/task\//);

    // All four are critical (expired/overdue) -> every one sorts before any lower tier, and the aggregation is fully deterministic.
    expect(items.every((item) => item.severity === 'critical')).toBe(true);
  });

  it('never produces duplicate ids even when called repeatedly against unchanged data', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Land Cruiser',
      insuranceExpiry: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const first = await loadNotifications(NOW);
    const second = await loadNotifications(NOW);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
  });
});

describe('getActionableNotificationCount', () => {
  it('counts every critical/warning item (which already includes due-today tasks)', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Land Cruiser',
      insuranceExpiry: '2026-01-01', // critical
      registrationExpiry: '2026-06-25', // warning
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(await getActionableNotificationCount(NOW)).toBe(2);
  });

  it('is zero when there is nothing to act on', async () => {
    expect(await getActionableNotificationCount(NOW)).toBe(0);
  });
});

describe('failure handling: a source repository failure is never swallowed', () => {
  it('propagates a rejection instead of silently returning an empty list', async () => {
    const spy = vi.spyOn(vehicleRepository, 'listVehicles').mockRejectedValueOnce(new Error('boom'));
    await expect(loadNotifications(NOW)).rejects.toThrow('boom');
    spy.mockRestore();
  });
});
