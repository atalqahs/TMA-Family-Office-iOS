import * as contractRepository from '../contracts/contractRepository';
import * as staffRepository from '../staff/staffRepository';
import * as taskRepository from '../tasks/taskRepository';
import * as vehicleRepository from '../vehicles/vehicleRepository';
import { dedupeNotificationItems, sortNotificationItems } from './sorting';
import { buildContractNotifications } from './sources/contractNotifications';
import { buildStaffNotifications } from './sources/staffNotifications';
import { buildTaskNotifications } from './sources/taskNotifications';
import { buildVehicleNotifications } from './sources/vehicleNotifications';
import type { NotificationItem } from './types';

/**
 * The aggregator: bulk-loads metadata/business state (never document
 * blobs/photos) from each source's own approved repository -- exactly the
 * same repository functions each source's own list hooks already use, so
 * there is no second, Notifications-specific query path and no N+1 (one
 * bulk read per store, in parallel, same as useVehicles/useStaffList/
 * useTasks already do). If ANY source repository call rejects, this
 * function rejects too -- callers (see hooks/useNotifications.ts) surface
 * that the same way every other list hook already surfaces a load
 * failure, rather than silently reporting zero notifications.
 */
export async function loadNotifications(now: Date = new Date()): Promise<NotificationItem[]> {
  const [vehicles, maintenanceRecords, contracts, staff, salarySchedules, salaryPayments, tasks, completions] = await Promise.all([
    vehicleRepository.listVehicles(),
    vehicleRepository.listAllMaintenanceRecords(),
    contractRepository.listContracts(),
    staffRepository.listStaff(),
    staffRepository.listAllSalarySchedules(),
    staffRepository.listAllSalaryPayments(),
    taskRepository.listTasks(),
    taskRepository.listAllCompletions(),
  ]);

  const items = [
    ...buildVehicleNotifications(vehicles, maintenanceRecords, now),
    ...buildContractNotifications(contracts, now),
    ...buildStaffNotifications(staff, salarySchedules, salaryPayments, now),
    ...buildTaskNotifications(tasks, completions, now),
  ];

  return sortNotificationItems(dedupeNotificationItems(items));
}

/**
 * The small derived badge count (dashboard grid + header bell) --
 * "actionable" items only (critical + warning, which already includes
 * due-today tasks since their `severity` is 'warning'), never persisted,
 * always recomputed from current source state.
 */
export async function getActionableNotificationCount(now: Date = new Date()): Promise<number> {
  const items = await loadNotifications(now);
  return items.filter((item) => item.severity !== 'info').length;
}
