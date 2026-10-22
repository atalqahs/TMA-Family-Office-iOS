import * as contractRepository from '../contracts/contractRepository';
import * as familyRepository from '../family/familyRepository';
import * as propertyRepository from '../properties/propertyRepository';
import * as staffRepository from '../staff/staffRepository';
import * as taskRepository from '../tasks/taskRepository';
import * as vehicleRepository from '../vehicles/vehicleRepository';
import { buildContractCalendarEvents } from './sources/contractCalendarEvents';
import { buildFamilyCalendarEvents } from './sources/familyCalendarEvents';
import { buildPropertyCalendarEvents } from './sources/propertyCalendarEvents';
import { buildStaffCalendarEvents } from './sources/staffCalendarEvents';
import { buildTaskCalendarEvents } from './sources/taskCalendarEvents';
import { buildVehicleCalendarEvents } from './sources/vehicleCalendarEvents';
import type { CalendarEvent } from './types';

/**
 * The aggregator: bulk-loads each source's own existing repository data
 * (archived-inclusive reads throughout -- `listFamilyMembers`/
 * `listVehicles`/`listStaff`/`listContracts`/`listProperties`/
 * `listAllTaskGroups`, never the active-only variants -- archiving never
 * disables business logic, see features/archive/) and derives every
 * calendar event for the given range in one pass. Same "one bulk read per
 * store, in parallel" shape as `notificationService.loadNotifications`,
 * extended with the [rangeStart, rangeEnd] bound each source needs to
 * expand recurring Task/salary occurrences without materializing their
 * entire unbounded history.
 */
export async function loadCalendarEvents(rangeStart: string, rangeEnd: string): Promise<CalendarEvent[]> {
  const [
    familyMembers,
    familyDocuments,
    vehicles,
    maintenanceRecords,
    vehicleDocuments,
    staff,
    salarySchedules,
    staffDocuments,
    contracts,
    properties,
    propertyDocuments,
    tasks,
    taskGroups,
  ] = await Promise.all([
    familyRepository.listFamilyMembers(),
    familyRepository.listAllFamilyMemberDocuments(),
    vehicleRepository.listVehicles(),
    vehicleRepository.listAllMaintenanceRecords(),
    vehicleRepository.listAllVehicleDocuments(),
    staffRepository.listStaff(),
    staffRepository.listAllSalarySchedules(),
    staffRepository.listAllStaffDocuments(),
    contractRepository.listContracts(),
    propertyRepository.listProperties(),
    propertyRepository.listAllPropertyDocuments(),
    taskRepository.listTasks(),
    taskRepository.listAllTaskGroups(),
  ]);

  return [
    ...buildFamilyCalendarEvents(familyMembers, familyDocuments, rangeStart, rangeEnd),
    ...buildVehicleCalendarEvents(vehicles, maintenanceRecords, vehicleDocuments, rangeStart, rangeEnd),
    ...buildStaffCalendarEvents(staff, salarySchedules, staffDocuments, rangeStart, rangeEnd),
    ...buildContractCalendarEvents(contracts, rangeStart, rangeEnd),
    ...buildPropertyCalendarEvents(properties, propertyDocuments, rangeStart, rangeEnd),
    ...buildTaskCalendarEvents(tasks, taskGroups, rangeStart, rangeEnd),
  ];
}
