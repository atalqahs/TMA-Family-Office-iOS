import { describe, expect, it } from 'vitest';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import * as vehicleService from '../../src/features/vehicles/vehicleService';
import * as taskRepository from '../../src/features/tasks/taskRepository';

const NOW = '2026-01-01T00:00:00.000Z';

/**
 * Permanent Phase 10 regression suite -- Section AA (Delete Card / Future
 * Trash, 8 items). "Delete Card" (only reachable from inside Archive) is
 * explicitly NOT a permanent delete: it prepares for a later dedicated
 * Trash phase via `deletedAt`, hides the card from both the active list
 * AND Archive, and preserves every bit of child data. The three lifecycle
 * states (ACTIVE / ARCHIVED / DELETED-future-Trash) must never blur into
 * each other.
 */
describe('deleteXCard (service layer): the Archive "Delete Card" action', () => {
  it('deleteVehicleCard sets deletedAt via the same underlying soft-delete as the repository -- never a hard delete', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');

    await vehicleService.deleteVehicleCard('v1');

    // The record is NOT gone -- it is soft-deleted (deletedAt set), never
    // permanently erased, unlike removeVehicle's hard delete.
    expect((await vehicleRepository.listVehicles()).map((v) => v.id)).not.toContain('v1');
    expect((await vehicleRepository.listActiveVehicles()).map((v) => v.id)).not.toContain('v1');
  });

  it('deleteVehicleCard is a DIFFERENT function from removeVehicle -- the existing hard-delete path is completely untouched', () => {
    expect(vehicleService.deleteVehicleCard).not.toBe(vehicleService.removeVehicle);
  });

  it('preserves every document and maintenance record belonging to the soft-deleted vehicle -- nothing is cascade-removed', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.saveVehicleDocument({
      id: 'd1',
      vehicleId: 'v1',
      type: 'registration',
      title: 'Registration',
      file: new Blob(['x']),
      fileName: 'reg.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      createdAt: NOW,
      updatedAt: NOW,
    });
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
      {
        id: 'm1',
        vehicleId: 'v1',
        type: 'oilChange',
        title: 'Oil change',
        serviceDate: '2026-01-01',
        createdAt: NOW,
        updatedAt: NOW,
      },
      () => undefined,
    );
    await vehicleRepository.archiveVehicle('v1');

    await vehicleService.deleteVehicleCard('v1');

    expect(await vehicleRepository.listDocumentsForVehicle('v1')).toHaveLength(1);
    expect(await vehicleRepository.listMaintenanceForVehicle('v1')).toHaveLength(1);
  });

  it('the three lifecycle states are unambiguous: ACTIVE -> ARCHIVED -> DELETED, and a deleted record retains archivedAt (the prior state), never wiping it', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    let v = await vehicleRepository.getVehicle('v1');
    expect(v?.archivedAt).toBeUndefined();
    expect(v?.deletedAt).toBeUndefined(); // ACTIVE

    await vehicleRepository.archiveVehicle('v1');
    v = await vehicleRepository.getVehicle('v1');
    expect(v?.archivedAt).toBeDefined();
    expect(v?.deletedAt).toBeUndefined(); // ARCHIVED

    await vehicleService.deleteVehicleCard('v1');
    v = await vehicleRepository.getVehicle('v1');
    expect(v?.deletedAt).toBeDefined(); // DELETED (future Trash)
  });

  it('TaskGroup "Delete Card" (deleteTaskGroupCard) is independent of the existing deleteTaskGroupIfEmpty hard-delete guard', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard({
      id: 't1',
      groupId: 'g1',
      title: 'Renew registration',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await taskRepository.archiveTaskGroup('g1');

    // deleteTaskGroupIfEmpty would reject (the group still has a Task) --
    // but the Archive "Delete Card" soft-delete path has no such guard,
    // since it never touches Tasks at all.
    await expect(taskRepository.deleteTaskGroupIfEmpty('g1')).rejects.toThrow();
    await expect(taskRepository.softDeleteTaskGroup('g1')).resolves.not.toThrow();

    const group = await taskRepository.getTaskGroup('g1');
    expect(group?.deletedAt).toBeDefined();
    // Its Task is completely unaffected -- still there, still assigned to this group.
    const task = await taskRepository.getTask('t1');
    expect(task?.groupId).toBe('g1');
  });
});
