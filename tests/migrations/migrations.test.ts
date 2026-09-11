import { describe, expect, it } from 'vitest';
import { getDB } from '../../src/storage/db';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import * as contractRepository from '../../src/features/contracts/contractRepository';
import { MIGRATION_GENERAL_GROUP_ID } from '../../src/features/tasks/types';
import { seedRawVersionedDb } from './rawDbHelpers';

/**
 * Permanent migration regression suite (Phase 9A, Section J). Each test
 * hand-builds a REALISTIC historical database shape at an old version
 * using the raw native IndexedDB API (never the app's own `getDB()`, which
 * would just run the current-version schema), then calls the app's real
 * `getDB()` to exercise its actual `upgrade()` callback end to end, and
 * verifies both the new schema AND that no pre-existing data was lost or
 * corrupted.
 */

function buildV7Stores(db: IDBDatabase): void {
  db.createObjectStore('settings');
  db.createObjectStore('familyMembers', { keyPath: 'id' });
  db.createObjectStore('familyMemberDocuments', { keyPath: 'id' }).createIndex('familyMemberId', 'familyMemberId');
  db.createObjectStore('properties', { keyPath: 'id' });
  db.createObjectStore('propertyDocuments', { keyPath: 'id' }).createIndex('propertyId', 'propertyId');
  db.createObjectStore('vehicles', { keyPath: 'id' });
  db.createObjectStore('vehicleDocuments', { keyPath: 'id' }).createIndex('vehicleId', 'vehicleId');
  db.createObjectStore('vehicleMaintenanceRecords', { keyPath: 'id' }).createIndex('vehicleId', 'vehicleId');
  db.createObjectStore('householdStaff', { keyPath: 'id' });
  db.createObjectStore('staffDocuments', { keyPath: 'id' }).createIndex('staffId', 'staffId');
  db.createObjectStore('staffSalarySchedules', { keyPath: 'id' }).createIndex('staffId', 'staffId');
  const payments = db.createObjectStore('staffSalaryPayments', { keyPath: 'id' });
  payments.createIndex('staffId', 'staffId');
  payments.createIndex('scheduleId_dueDate', ['salaryScheduleId', 'dueDate'], { unique: true });
  db.createObjectStore('contracts', { keyPath: 'id' });
  db.createObjectStore('contractDocuments', { keyPath: 'id' }).createIndex('contractId', 'contractId');
}

function seedV7Data(tx: IDBTransaction): void {
  tx.objectStore('familyMembers').add({
    id: 'fm1',
    fullName: 'Fatima',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  });
  tx.objectStore('vehicles').add({
    id: 'v1',
    name: 'Family SUV',
    currentMileage: 42_000,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  });
  tx.objectStore('contracts').add({
    id: 'c1',
    title: 'Villa Rental',
    contractType: 'rental',
    partyName: 'ACME Properties',
    startDate: '2025-01-01',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  });
}

describe('Migration v7 -> v10: pre-Tasks database', () => {
  it('creates every Tasks-era store and preserves every pre-existing record from before Tasks existed', async () => {
    await seedRawVersionedDb(7, (db, tx) => {
      buildV7Stores(db);
      seedV7Data(tx);
    });

    await getDB(); // runs the real v7 -> v10 upgrade

    // Pre-existing data across three unrelated modules survives untouched.
    expect(await familyRepository.getFamilyMember('fm1')).toMatchObject({ fullName: 'Fatima' });
    expect(await vehicleRepository.getVehicle('v1')).toMatchObject({ currentMileage: 42_000 });
    expect(await contractRepository.getContract('c1')).toMatchObject({ title: 'Villa Rental' });

    // New Tasks-era stores exist...
    expect(await taskRepository.listTasks()).toEqual([]);
    expect(await taskRepository.listTaskGroups()).toEqual([]); // no General group fabricated — there were no tasks to backfill
  });
});

function buildV8Stores(db: IDBDatabase): void {
  buildV7Stores(db);
  db.createObjectStore('tasks', { keyPath: 'id' }); // no groupId index yet
  const completions = db.createObjectStore('taskCompletions', { keyPath: 'id' });
  completions.createIndex('taskId', 'taskId');
  completions.createIndex('taskId_occurrenceDate', ['taskId', 'occurrenceDate'], { unique: true }); // legacy index name/field
}

describe('Migration v8 -> v10: pre-groups, pre-independence Tasks database', () => {
  it('backfills every groupless task into a migration-created "General" group, strips legacy link fields, and renames occurrenceDate -> occurrenceKey', async () => {
    await seedRawVersionedDb(8, (db, tx) => {
      buildV8Stores(db);
      seedV7Data(tx);
      tx.objectStore('tasks').add({
        id: 't1',
        title: 'Renew vehicle registration',
        priority: 'high',
        recurrenceUnit: 'none',
        dueDate: '2025-06-01',
        linkedEntityType: 'vehicle',
        linkedEntityId: 'v1',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        // no groupId at all -- this is the pre-groups shape
      });
      tx.objectStore('tasks').add({
        id: 't2',
        title: 'Pay staff salary',
        priority: 'normal',
        recurrenceUnit: 'none',
        dueDate: '2025-07-01',
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      });
      tx.objectStore('taskCompletions').add({
        id: 'tc1',
        taskId: 't1',
        occurrenceDate: '2025-06-01', // legacy field name
        completedAt: '2025-06-01T00:00:00.000Z',
      });
    });

    await getDB();

    const groups = await taskRepository.listTaskGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(MIGRATION_GENERAL_GROUP_ID);

    const t1 = await taskRepository.getTask('t1');
    const t2 = await taskRepository.getTask('t2');
    expect(t1?.groupId).toBe(MIGRATION_GENERAL_GROUP_ID);
    expect(t2?.groupId).toBe(MIGRATION_GENERAL_GROUP_ID);

    // Obsolete cross-module link fields stripped from every Task.
    expect(t1).not.toHaveProperty('linkedEntityType');
    expect(t1).not.toHaveProperty('linkedEntityId');
    // Every other field left completely untouched.
    expect(t1?.title).toBe('Renew vehicle registration');
    expect(t1?.dueDate).toBe('2025-06-01');

    // occurrenceDate -> occurrenceKey rename, same value preserved.
    const completions = await taskRepository.listCompletionsForTask('t1');
    expect(completions).toHaveLength(1);
    expect(completions[0].occurrenceKey).toBe('2025-06-01');
    expect(completions[0]).not.toHaveProperty('occurrenceDate');

    // Pre-existing non-Tasks data from before Tasks existed is untouched too.
    expect(await vehicleRepository.getVehicle('v1')).toMatchObject({ currentMileage: 42_000 });
  });
});

function buildV9Stores(db: IDBDatabase): void {
  buildV7Stores(db);
  const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
  tasks.createIndex('groupId', 'groupId');
  const completions = db.createObjectStore('taskCompletions', { keyPath: 'id' });
  completions.createIndex('taskId', 'taskId');
  completions.createIndex('taskId_occurrenceDate', ['taskId', 'occurrenceDate'], { unique: true }); // legacy
  db.createObjectStore('taskGroups', { keyPath: 'id' });
}

describe('Migration v9 -> v10: pre-independence Tasks database (groups already exist)', () => {
  it('never fabricates a spurious General group when taskGroups already exists, but still strips link fields and renames the completion field/index', async () => {
    await seedRawVersionedDb(9, (db, tx) => {
      buildV9Stores(db);
      seedV7Data(tx);
      tx.objectStore('taskGroups').add({
        id: 'custom-group',
        name: 'Vehicle Reminders',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('tasks').add({
        id: 't1',
        groupId: 'custom-group',
        title: 'Renew vehicle registration',
        priority: 'high',
        recurrenceUnit: 'none',
        dueDate: '2025-06-01',
        linkedEntityType: 'vehicle',
        linkedEntityId: 'v1',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('taskCompletions').add({
        id: 'tc1',
        taskId: 't1',
        occurrenceDate: '2025-06-01',
        completedAt: '2025-06-01T00:00:00.000Z',
      });
    });

    await getDB();

    const groups = await taskRepository.listTaskGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('custom-group'); // NOT replaced/duplicated with a General group

    const t1 = await taskRepository.getTask('t1');
    expect(t1?.groupId).toBe('custom-group'); // untouched
    expect(t1).not.toHaveProperty('linkedEntityType');
    expect(t1).not.toHaveProperty('linkedEntityId');

    const completions = await taskRepository.listCompletionsForTask('t1');
    expect(completions[0].occurrenceKey).toBe('2025-06-01');
    expect(completions[0]).not.toHaveProperty('occurrenceDate');
  });
});

describe('Migration idempotency: opening an already-v10 database never destructively re-runs migrations', () => {
  it('a second getDB() call against the same (already-current) database leaves every record exactly as it was', async () => {
    // First open: creates a fresh v10 database via the app's own code path.
    await getDB();
    await taskRepository.saveTaskGroup({
      id: 'custom-group',
      name: 'Vehicle Reminders',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const task = await taskRepository.getTaskGroup('custom-group');
    expect(task).toBeDefined();
    await taskRepository.saveTaskWithGroupGuard({
      id: 't1',
      groupId: 'custom-group',
      title: 'Task',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    // Force a brand-new connection to the SAME underlying (unchanged)
    // fake-indexeddb database -- exactly what happens on a real app reload.
    const { __resetDbConnectionForTests } = await import('../../src/storage/db');
    __resetDbConnectionForTests();

    await getDB();

    // Nothing was re-migrated, duplicated, or reset: exactly the one
    // custom group survives, still holding its one task, and no second
    // "General" group was ever fabricated.
    const groups = await taskRepository.listTaskGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('custom-group');
    const reloadedTask = await taskRepository.getTask('t1');
    expect(reloadedTask?.groupId).toBe('custom-group');
  });
});
