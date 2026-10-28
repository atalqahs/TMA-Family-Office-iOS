import { describe, expect, it } from 'vitest';
import * as contractRepository from '../../src/features/contracts/contractRepository';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as propertyRepository from '../../src/features/properties/propertyRepository';
import * as staffRepository from '../../src/features/staff/staffRepository';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { createTask } from '../../src/features/tasks/taskService';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import { loadCalendarEvents } from '../../src/features/calendar/calendarService';
import { NON_TASK_EVENT_COLOR } from '../../src/features/calendar/colors';
import { getTaskGroupColor } from '../../src/features/tasks/taskGroupColor';

const RANGE_START = '2026-06-01';
const RANGE_END = '2026-06-30';

function blob(): Blob {
  return new Blob(['x'], { type: 'text/plain' });
}

describe('loadCalendarEvents: aggregation over real repositories', () => {
  it('zero source data across every module aggregates to an empty list', async () => {
    expect(await loadCalendarEvents(RANGE_START, RANGE_END)).toEqual([]);
  });

  it('Family: Civil ID and Passport expiry both produce gray events routed to the real profile', async () => {
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Sara',
      civilIdExpiryDate: '2026-06-10',
      passportExpiryDate: '2026-06-20',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.category === 'family' && e.route === '/family/fm1' && e.color === NON_TASK_EVENT_COLOR)).toBe(true);
    expect(events.map((e) => e.date).sort()).toEqual(['2026-06-10', '2026-06-20']);
  });

  it('an archived Family Member still produces calendar events -- archiving never disables business logic', async () => {
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Sara',
      civilIdExpiryDate: '2026-06-10',
      archivedAt: '2026-01-15T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(1);
    expect(events[0].route).toBe('/family/fm1');
  });

  it("a Family Member's own document expiryDate is sourced in addition to their top-level expiry fields", async () => {
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Sara',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await familyRepository.saveFamilyMemberDocument({
      id: 'doc1',
      familyMemberId: 'fm1',
      type: 'other',
      title: 'Vaccination Card',
      file: blob(),
      fileName: 'vax.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      expiryDate: '2026-06-05',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ category: 'family', date: '2026-06-05', route: '/family/fm1', color: NON_TASK_EVENT_COLOR });
  });

  it('Vehicle: registration, insurance, and active date-based maintenance all produce gray events', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Land Cruiser',
      registrationExpiry: '2026-06-03',
      insuranceExpiry: '2026-06-07',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
      {
        id: 'm1',
        vehicleId: 'v1',
        type: 'oilChange',
        title: 'Oil change',
        nextServiceDate: '2026-06-12',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      () => undefined,
    );

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(3);
    expect(events.every((e) => e.category === 'vehicles' && e.route === '/vehicles/v1' && e.color === NON_TASK_EVENT_COLOR)).toBe(true);
    expect(events.map((e) => e.date).sort()).toEqual(['2026-06-03', '2026-06-07', '2026-06-12']);
  });

  it('Vehicle: a superseded maintenance cycle of the same type never produces a duplicate/phantom event', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Land Cruiser',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
      {
        id: 'm1',
        vehicleId: 'v1',
        type: 'oilChange',
        title: 'Old cycle',
        nextServiceDate: '2026-06-05',
        serviceDate: '2026-01-01',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      () => undefined,
    );
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
      {
        id: 'm2',
        vehicleId: 'v1',
        type: 'oilChange',
        title: 'New cycle',
        nextServiceDate: '2026-06-20',
        serviceDate: '2026-02-01',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
      () => undefined,
    );

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-06-20');
  });

  it('Staff: Civil ID/Passport/Residency expiry and every salary occurrence in range are sourced, archived staff included', async () => {
    await staffRepository.saveStaffMember({
      id: 's1',
      fullName: 'Ahmed',
      civilIdExpiry: '2026-06-02',
      passportExpiry: '2026-06-09',
      residencyExpiry: '2026-06-16',
      archivedAt: '2026-01-15T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await staffRepository.saveSalarySchedule({
      id: 'sched1',
      staffId: 's1',
      amount: 150,
      recurrence: 'monthly',
      startDate: '2026-01-05',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(4);
    expect(events.every((e) => e.category === 'staff' && e.route === '/staff/s1' && e.color === NON_TASK_EVENT_COLOR)).toBe(true);
    expect(events.map((e) => e.date).sort()).toEqual(['2026-06-02', '2026-06-05', '2026-06-09', '2026-06-16']);
  });

  it('Contract: both startDate and endDate produce events when either falls in range', async () => {
    await contractRepository.saveContract({
      id: 'c1',
      title: 'Villa Lease',
      contractType: 'property',
      partyName: 'ACME',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.category === 'contracts' && e.route === '/contracts/c1')).toBe(true);
  });

  it('Property: has no top-level date, only its own documents contribute events', async () => {
    await propertyRepository.saveProperty({
      id: 'p1',
      name: 'Beach Chalet',
      type: 'chalet',
      status: 'owned',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await propertyRepository.savePropertyDocument({
      id: 'doc1',
      propertyId: 'p1',
      type: 'other',
      title: 'Lease Agreement',
      file: blob(),
      fileName: 'lease.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      expiryDate: '2026-06-18',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ category: 'properties', date: '2026-06-18', route: '/properties/p1' });
  });

  it('Tasks: a one-time task produces exactly one event, colored by its own Task Group', async () => {
    await taskRepository.saveTaskGroup({
      id: 'g1',
      name: 'Personal',
      color: '#E0645A',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await createTask({ groupId: 'g1', title: 'Renew gym membership', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-06-14' });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ category: 'tasks', date: '2026-06-14', color: '#E0645A', rawTitle: 'Renew gym membership' });
    expect(events[0].route).toMatch(/^\/tasks\/task\//);
  });

  it('Tasks: a recurring task produces one event per occurrence in range, never duplicated', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Household', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({
      groupId: 'g1',
      title: 'Water the plants',
      priority: 'normal',
      recurrenceUnit: 'week',
      recurrenceInterval: 1,
      dueDate: '2026-05-25',
    });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    const dates = events.map((e) => e.date).sort();
    // Weekly from 2026-05-25: ...06-01, 06-08, 06-15, 06-22, 06-29 all fall in June.
    expect(dates).toEqual(['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']);
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  });

  it('Tasks: a completed one-time task still shows its occurrence on the calendar (a timeline, not an actionability filter)', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    const task = await createTask({ groupId: 'g1', title: 'Pay school fees', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-06-10' });
    await taskRepository.completeTaskOccurrence({ id: 'comp1', taskId: task.id, occurrenceKey: '2026-06-10', completedAt: '2026-06-10T10:00:00.000Z' });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-06-10');
  });

  it("Tasks: a legacy TaskGroup created before the color field exists falls back to the default color via getTaskGroupColor", async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Legacy', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({ groupId: 'g1', title: 'Legacy task', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-06-10' });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events[0].color).toBe(getTaskGroupColor({}));
  });

  it('changing a Task Group color immediately changes the color of every one of its future calendar loads', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Work', color: '#5B8DEF', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({ groupId: 'g1', title: 'Submit report', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-06-10' });

    const before = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(before[0].color).toBe('#5B8DEF');

    const group = await taskRepository.getTaskGroup('g1');
    await taskRepository.saveTaskGroup({ ...group!, color: '#4CAF7D' });

    const after = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(after[0].color).toBe('#4CAF7D');
  });

  it('an archived TaskGroup still produces calendar events for its tasks', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Seasonal', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({ groupId: 'g1', title: 'Seasonal task', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-06-10' });
    await taskRepository.archiveTaskGroup('g1');

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(1);
  });

  it('events outside [rangeStart, rangeEnd] are excluded', async () => {
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Sara',
      civilIdExpiryDate: '2026-07-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(await loadCalendarEvents(RANGE_START, RANGE_END)).toEqual([]);
  });

  it('mixed sources across every module aggregate together with no cross-category id collision', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Sara', civilIdExpiryDate: '2026-06-01', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Car', registrationExpiry: '2026-06-02', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Ahmed', civilIdExpiry: '2026-06-03', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await contractRepository.saveContract({ id: 'c1', title: 'X', contractType: 'other', partyName: 'Y', startDate: '2026-06-04', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'G', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    await createTask({ groupId: 'g1', title: 'T', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-06-05' });

    const events = await loadCalendarEvents(RANGE_START, RANGE_END);
    expect(events).toHaveLength(5);
    expect(new Set(events.map((e) => e.id)).size).toBe(5);
    expect(new Set(events.map((e) => e.category))).toEqual(new Set(['family', 'vehicles', 'staff', 'contracts', 'tasks']));
  });
});
