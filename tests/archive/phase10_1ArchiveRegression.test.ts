import { describe, expect, it } from 'vitest';
import { loadNotifications } from '../../src/features/notifications/notificationService';
import * as staffRepository from '../../src/features/staff/staffRepository';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import { getArchiveCategorySummaries, getTotalArchivedCardCount } from '../../src/features/archive/archiveService';

const NOW = '2026-01-01T00:00:00.000Z';
const now = new Date('2026-06-15T00:00:00.000Z');

/**
 * Permanent Phase 10.1 regression suite -- Section "ARCHIVE MUST NOT
 * REGRESS", items #43-45: Archive itself is untouched by this correction
 * phase, but the two entity models it aggregates (Staff salary, Vehicle
 * maintenance) both changed underneath it -- these tests re-verify the
 * exact same Phase 10 guarantees against the NEW models (new salary
 * recurrence shape, optional maintenance date).
 */
describe('43. archived Staff still generates a salary Notification under the new recurrence model', () => {
  it('an archived staff member with an unpaid, overdue monthly salary schedule still produces a Notification', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Driver Ali', createdAt: NOW, updatedAt: NOW });
    await staffRepository.saveSalarySchedule({
      id: 'sch1',
      staffId: 's1',
      amount: 170,
      recurrence: 'monthly',
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await staffRepository.archiveStaffMember('s1');

    const items = await loadNotifications(now);
    expect(items.some((item) => item.sourceId === 's1' && item.kind === 'staffSalaryOverdue')).toBe(true);
  });
});

describe('44. archived Vehicle maintenance WITHOUT a service date still generates a mileage Notification', () => {
  it('an archived vehicle with an undated, overdue mileage-only maintenance record still produces a Notification', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', currentMileage: 20_000, createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
      {
        id: 'm1',
        vehicleId: 'v1',
        type: 'oilChange',
        title: 'Oil',
        mileageAtService: 15_000,
        serviceIntervalKm: 2_000,
        createdAt: NOW,
        updatedAt: NOW,
      },
      () => undefined,
    );
    await vehicleRepository.archiveVehicle('v1');

    const items = await loadNotifications(now);
    expect(items.some((item) => item.sourceId === 'v1' && item.kind === 'vehicleMaintenanceOverdue')).toBe(true);
  });
});

describe('45. Archive lifecycle (category discovery, counts) remains green for both updated modules', () => {
  it('archived Staff and archived Vehicles both still appear in Archive category discovery with correct counts', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Driver Ali', createdAt: NOW, updatedAt: NOW });
    await staffRepository.archiveStaffMember('s1');
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');

    const summaries = await getArchiveCategorySummaries();
    expect(summaries.sort((a, b) => a.sourceType.localeCompare(b.sourceType))).toEqual([
      { sourceType: 'staff', count: 1 },
      { sourceType: 'vehicles', count: 1 },
    ]);
    expect(await getTotalArchivedCardCount()).toBe(2);
  });

  it('unarchiving a staff member with the new salary model round-trips correctly', async () => {
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Driver Ali', createdAt: NOW, updatedAt: NOW });
    await staffRepository.saveSalarySchedule({
      id: 'sch1',
      staffId: 's1',
      amount: 170,
      recurrence: 'monthly',
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await staffRepository.archiveStaffMember('s1');
    await staffRepository.unarchiveStaffMember('s1');

    expect((await staffRepository.listActiveStaff()).map((s) => s.id)).toContain('s1');
    expect(await staffRepository.getSalarySchedule('sch1')).toMatchObject({ recurrence: 'monthly' });
  });
});
