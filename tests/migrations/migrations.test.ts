import { describe, expect, it } from 'vitest';
import { getDB } from '../../src/storage/db';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as staffRepository from '../../src/features/staff/staffRepository';
import * as propertyRepository from '../../src/features/properties/propertyRepository';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import * as contractRepository from '../../src/features/contracts/contractRepository';
import * as healthRepository from '../../src/features/health/healthRepository';
import * as educationRepository from '../../src/features/education/educationRepository';
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

/**
 * Permanent Phase 10 (Archive) migration suite -- Section AC: the v10 -> v11
 * upgrade is intentionally a no-op in code (no new store/index -- see
 * storage/db.ts's own doc comment), since `archivedAt`/`deletedAt` are new
 * OPTIONAL fields whose absence already means "active". These tests build
 * a REALISTIC pre-v11 database (the full v10 schema, with real data that
 * has never heard of `archivedAt`/`deletedAt`) and verify the real
 * `getDB()` upgrade path preserves every record untouched AND that those
 * pre-existing records are correctly treated as "active" by every new
 * Phase 10 repository function.
 */
function buildV10Stores(db: IDBDatabase): void {
  // The REAL v10 shape (after the v9 -> v10 independence correction), built
  // directly rather than via buildV9Stores -- that legacy helper still has
  // the pre-correction `taskId_occurrenceDate` index, which a genuine v10
  // database no longer has (renamed to `taskId_occurrenceKey`, unique).
  buildV7Stores(db);
  const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
  tasks.createIndex('groupId', 'groupId');
  const completions = db.createObjectStore('taskCompletions', { keyPath: 'id' });
  completions.createIndex('taskId', 'taskId');
  completions.createIndex('taskId_occurrenceKey', ['taskId', 'occurrenceKey'], { unique: true });
  db.createObjectStore('taskGroups', { keyPath: 'id' });
}

describe('Migration v10 -> v11: pre-Archive database (Phase 10)', () => {
  it('preserves every pre-existing record across all six archive-capable modules untouched, and every one is correctly treated as ACTIVE (no archivedAt/deletedAt yet)', async () => {
    await seedRawVersionedDb(10, (db, tx) => {
      buildV10Stores(db);
      seedV7Data(tx); // familyMembers/vehicles/contracts, no archivedAt/deletedAt fields at all
      tx.objectStore('householdStaff').add({
        id: 'staff1',
        fullName: 'Driver Ali',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('properties').add({
        id: 'prop1',
        name: 'Villa 1',
        type: 'house',
        status: 'owned',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('taskGroups').add({
        id: 'group1',
        name: 'Vehicle Reminders',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB(); // runs the real v10 -> v11 upgrade (a no-op in code)

    // Every pre-existing record survives, completely untouched.
    expect(await familyRepository.getFamilyMember('fm1')).toMatchObject({ fullName: 'Fatima' });
    expect(await vehicleRepository.getVehicle('v1')).toMatchObject({ currentMileage: 42_000 });
    expect(await contractRepository.getContract('c1')).toMatchObject({ title: 'Villa Rental' });
    expect(await staffRepository.getStaffMember('staff1')).toMatchObject({ fullName: 'Driver Ali' });
    expect(await propertyRepository.getProperty('prop1')).toMatchObject({ name: 'Villa 1' });
    expect(await taskRepository.getTaskGroup('group1')).toMatchObject({ name: 'Vehicle Reminders' });

    // None of them ever gained an archivedAt/deletedAt key -- absence IS
    // the active state, no backfill/rewrite was needed or performed.
    expect(await familyRepository.getFamilyMember('fm1')).not.toHaveProperty('archivedAt');
    expect(await vehicleRepository.getVehicle('v1')).not.toHaveProperty('archivedAt');

    // Every pre-existing record is correctly picked up by the new
    // Phase 10 active-list functions -- a pre-v11 record is active by
    // construction, with nothing to migrate for that to be true.
    expect((await familyRepository.listActiveFamilyMembers()).map((m) => m.id)).toContain('fm1');
    expect((await vehicleRepository.listActiveVehicles()).map((v) => v.id)).toContain('v1');
    expect((await contractRepository.listActiveContracts()).map((c) => c.id)).toContain('c1');
    expect((await staffRepository.listActiveStaff()).map((s) => s.id)).toContain('staff1');
    expect((await propertyRepository.listActiveProperties()).map((p) => p.id)).toContain('prop1');
    expect((await taskRepository.listTaskGroups()).map((g) => g.id)).toContain('group1');
  });

  it('a pre-v11 record can immediately be archived/unarchived after the upgrade, exactly like a record created post-v11', async () => {
    await seedRawVersionedDb(10, (db, tx) => {
      buildV10Stores(db);
      tx.objectStore('vehicles').add({
        id: 'v1',
        name: 'Family SUV',
        currentMileage: 42_000,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();

    await vehicleRepository.archiveVehicle('v1');
    expect((await vehicleRepository.listActiveVehicles()).map((v) => v.id)).not.toContain('v1');
    expect((await vehicleRepository.listVehicles()).map((v) => v.id)).toContain('v1');

    await vehicleRepository.unarchiveVehicle('v1');
    expect((await vehicleRepository.listActiveVehicles()).map((v) => v.id)).toContain('v1');
  });
});

describe('Migration idempotency: opening an already-v11 database never destructively re-runs migrations', () => {
  it('a second getDB() call against the same (already-current) database preserves an archived record exactly as it was', async () => {
    await getDB();
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Family SUV',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await vehicleRepository.archiveVehicle('v1');

    const { __resetDbConnectionForTests } = await import('../../src/storage/db');
    __resetDbConnectionForTests();

    await getDB();

    const reloaded = await vehicleRepository.getVehicle('v1');
    expect(reloaded?.archivedAt).toBeDefined();
    expect((await vehicleRepository.listActiveVehicles()).map((v) => v.id)).not.toContain('v1');
  });
});

/**
 * Permanent Phase 10.1 migration suite -- items #46-50: the v11 -> v12
 * upgrade normalizes every legacy `staffSalarySchedules` row (old
 * frequency/interval/dueDayOfMonth/dueMonth model) to the new
 * `recurrence` model, once, in place -- never losing a schedule or any
 * confirmed payment history.
 */
function buildV11Stores(db: IDBDatabase): void {
  // v10 -> v11 added no new store/index (Archive's archivedAt/deletedAt
  // are optional fields on existing rows only) -- the v10 shape already
  // matches v11 exactly.
  buildV10Stores(db);
}

describe('Migration v11 -> v12: legacy staff salary recurrence normalization (Phase 10.1)', () => {
  it('46-47. a clean legacy schedule (interval 1, due-day matching startDate) is normalized with no note, and its payment history survives untouched', async () => {
    await seedRawVersionedDb(11, (db, tx) => {
      buildV11Stores(db);
      tx.objectStore('householdStaff').add({
        id: 'staff1',
        fullName: 'Driver Ali',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('staffSalarySchedules').add({
        id: 'sch1',
        staffId: 'staff1',
        amount: 170,
        frequency: 'month',
        interval: 1,
        dueDayOfMonth: 22,
        startDate: '2026-09-22',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('staffSalaryPayments').add({
        id: 'pay1',
        staffId: 'staff1',
        salaryScheduleId: 'sch1',
        dueDate: '2026-09-22',
        amount: 170,
        paidDate: '2026-09-22',
        createdAt: '2026-09-22T00:00:00.000Z',
        updatedAt: '2026-09-22T00:00:00.000Z',
      });
    });

    await getDB(); // runs the real v11 -> v12 upgrade

    const schedule = await staffRepository.getSalarySchedule('sch1');
    expect(schedule).toMatchObject({ id: 'sch1', staffId: 'staff1', amount: 170, recurrence: 'monthly', startDate: '2026-09-22' });
    expect(schedule).not.toHaveProperty('frequency');
    expect(schedule).not.toHaveProperty('interval');
    expect(schedule).not.toHaveProperty('dueDayOfMonth');
    expect(schedule).not.toHaveProperty('dueMonth');
    expect(schedule?.notes).toBeUndefined(); // a precise 1:1 mapping needs no migration note

    // Confirmed payment history is completely untouched.
    const payments = await staffRepository.listSalaryPaymentsForStaff('staff1');
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ id: 'pay1', dueDate: '2026-09-22', amount: 170, paidDate: '2026-09-22' });
  });

  it('48. a lossy legacy schedule (interval != 1) is normalized AND annotated with a migration note, never silently corrupted', async () => {
    await seedRawVersionedDb(11, (db, tx) => {
      buildV11Stores(db);
      tx.objectStore('householdStaff').add({
        id: 'staff1',
        fullName: 'Driver Ali',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('staffSalarySchedules').add({
        id: 'sch1',
        staffId: 'staff1',
        amount: 100,
        frequency: 'month',
        interval: 3, // every 3 months -- no equivalent in the new model
        dueDayOfMonth: 1,
        startDate: '2026-01-01',
        notes: 'Quarterly bonus',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();

    const schedule = await staffRepository.getSalarySchedule('sch1');
    expect(schedule?.recurrence).toBe('monthly');
    expect(schedule?.startDate).toBe('2026-01-01'); // never rewritten
    expect(schedule?.notes).toContain('Quarterly bonus'); // original note preserved
    expect(schedule?.notes).toMatch(/migrat/i); // plus a visible migration note
  });

  it('49-50. no schedule is ever duplicated and re-running getDB() against an already-v12 database is a safe no-op', async () => {
    await seedRawVersionedDb(11, (db, tx) => {
      buildV11Stores(db);
      tx.objectStore('householdStaff').add({
        id: 'staff1',
        fullName: 'Driver Ali',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('staffSalarySchedules').add({
        id: 'sch1',
        staffId: 'staff1',
        amount: 170,
        frequency: 'year',
        interval: 1,
        dueMonth: 9,
        dueDayOfMonth: 22,
        startDate: '2026-09-22',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();
    expect(await staffRepository.listSalarySchedulesForStaff('staff1')).toHaveLength(1);

    const { __resetDbConnectionForTests } = await import('../../src/storage/db');
    __resetDbConnectionForTests();
    await getDB(); // second open against the already-v12 database

    const schedules = await staffRepository.listSalarySchedulesForStaff('staff1');
    expect(schedules).toHaveLength(1); // never duplicated
    expect(schedules[0].recurrence).toBe('yearly');
  });
});

/**
 * Permanent Phase 11 migration suite: the v12 -> v13 upgrade adds the four
 * new Health/Education stores and permanently removes the cancelled
 * Trash/`deletedAt` soft-delete lifecycle -- see storage/db.ts's own
 * v12->v13 doc comment for the full documented policy this verifies.
 */
function buildV12Stores(db: IDBDatabase): void {
  // v11 -> v12 added no new store/index (only a field-level rewrite of
  // existing staffSalarySchedules rows) -- the v11 shape already matches
  // v12 exactly.
  buildV11Stores(db);
}

describe('Migration v12 -> v13: Health/Education stores + Trash removal (Phase 11)', () => {
  it('creates all four new stores empty -- no Health/Education profile is ever fabricated for a pre-existing Family Member', async () => {
    await seedRawVersionedDb(12, (db, tx) => {
      buildV12Stores(db);
      tx.objectStore('familyMembers').add({
        id: 'fm1',
        fullName: 'Fatima',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();

    expect(await healthRepository.listHealthProfiles()).toEqual([]);
    expect(await educationRepository.listEducationProfiles()).toEqual([]);
    expect(await familyRepository.getFamilyMember('fm1')).toMatchObject({ fullName: 'Fatima' });
  });

  it('a Family Member/Property/Vehicle(+maintenance)/Contract that already had deletedAt set is permanently deleted, cascading its own documents', async () => {
    await seedRawVersionedDb(12, (db, tx) => {
      buildV12Stores(db);
      tx.objectStore('familyMembers').add({
        id: 'fm1',
        fullName: 'Old Deleted Member',
        deletedAt: '2025-06-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('familyMemberDocuments').add({
        id: 'fmdoc1',
        familyMemberId: 'fm1',
        type: 'other',
        title: 'Old doc',
        file: new Blob(['x']),
        fileName: 'old.pdf',
        mimeType: 'application/pdf',
        fileSize: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('vehicles').add({
        id: 'v1',
        name: 'Old Deleted Vehicle',
        deletedAt: '2025-06-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('vehicleMaintenanceRecords').add({
        id: 'vm1',
        vehicleId: 'v1',
        type: 'oilChange',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('properties').add({
        id: 'p1',
        name: 'Old Deleted Property',
        type: 'house',
        status: 'owned',
        deletedAt: '2025-06-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('contracts').add({
        id: 'c1',
        title: 'Old Deleted Contract',
        contractType: 'rental',
        partyName: 'ACME',
        startDate: '2025-01-01',
        deletedAt: '2025-06-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      // A never-deleted, still-active family member survives untouched.
      tx.objectStore('familyMembers').add({
        id: 'fm2',
        fullName: 'Active Member',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();

    expect(await familyRepository.getFamilyMember('fm1')).toBeUndefined();
    expect(await familyRepository.listDocumentsForMember('fm1')).toEqual([]);
    expect(await vehicleRepository.getVehicle('v1')).toBeUndefined();
    expect((await vehicleRepository.listAllMaintenanceRecords()).map((r) => r.id)).not.toContain('vm1');
    expect(await propertyRepository.getProperty('p1')).toBeUndefined();
    expect(await contractRepository.getContract('c1')).toBeUndefined();

    // The untouched, never-deleted member is completely unaffected.
    expect(await familyRepository.getFamilyMember('fm2')).toMatchObject({ fullName: 'Active Member' });
  });

  it('a Staff member with deletedAt set is permanently deleted, cascading its documents/salary schedules/salary payments', async () => {
    await seedRawVersionedDb(12, (db, tx) => {
      buildV12Stores(db);
      tx.objectStore('householdStaff').add({
        id: 'staff1',
        fullName: 'Old Deleted Staff',
        deletedAt: '2025-06-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('staffDocuments').add({
        id: 'sdoc1',
        staffId: 'staff1',
        type: 'other',
        title: 'Old doc',
        file: new Blob(['x']),
        fileName: 'old.pdf',
        mimeType: 'application/pdf',
        fileSize: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('staffSalarySchedules').add({
        id: 'sch1',
        staffId: 'staff1',
        amount: 100,
        recurrence: 'monthly',
        startDate: '2025-01-01',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      tx.objectStore('staffSalaryPayments').add({
        id: 'pay1',
        staffId: 'staff1',
        salaryScheduleId: 'sch1',
        dueDate: '2025-01-01',
        amount: 100,
        paidDate: '2025-01-01',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();

    expect(await staffRepository.getStaffMember('staff1')).toBeUndefined();
    expect(await staffRepository.listDocumentsForStaff('staff1')).toEqual([]);
    expect(await staffRepository.listSalarySchedulesForStaff('staff1')).toEqual([]);
    expect(await staffRepository.listSalaryPaymentsForStaff('staff1')).toEqual([]);
  });

  it('a TaskGroup with deletedAt set is NEVER hard-deleted (that could orphan/bulk-delete its Tasks) -- it is instead demoted to archived, preserving every Task untouched', async () => {
    await seedRawVersionedDb(12, (db, tx) => {
      buildV12Stores(db);
      tx.objectStore('taskGroups').add({
        id: 'g1',
        name: 'Vehicle Reminders',
        deletedAt: '2025-06-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
      const tasks = tx.objectStore('tasks');
      tasks.add({
        id: 't1',
        groupId: 'g1',
        title: 'Renew registration',
        priority: 'normal',
        recurrenceUnit: 'none',
        dueDate: '2025-06-01',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();

    const group = await taskRepository.getTaskGroup('g1');
    expect(group).toBeDefined();
    expect(group).not.toHaveProperty('deletedAt');
    expect(group?.archivedAt).toBeDefined();
    expect(await taskRepository.getTask('t1')).toMatchObject({ groupId: 'g1', title: 'Renew registration' });
  });

  it('a record that never had deletedAt set is completely unaffected by the v12 -> v13 upgrade', async () => {
    await seedRawVersionedDb(12, (db, tx) => {
      buildV12Stores(db);
      tx.objectStore('vehicles').add({
        id: 'v1',
        name: 'Family SUV',
        currentMileage: 42_000,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();

    expect(await vehicleRepository.getVehicle('v1')).toMatchObject({ name: 'Family SUV', currentMileage: 42_000 });
  });

  it('idempotency: a second getDB() call against the already-v13 database never re-deletes/duplicates anything', async () => {
    await seedRawVersionedDb(12, (db, tx) => {
      buildV12Stores(db);
      tx.objectStore('familyMembers').add({
        id: 'fm1',
        fullName: 'Active Member',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });

    await getDB();
    const { __resetDbConnectionForTests } = await import('../../src/storage/db');
    __resetDbConnectionForTests();
    await getDB();

    expect(await familyRepository.getFamilyMember('fm1')).toMatchObject({ fullName: 'Active Member' });
    expect(await healthRepository.listHealthProfiles()).toEqual([]);
  });
});
