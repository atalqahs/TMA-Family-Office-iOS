import { useEffect, useState } from 'react';
import { getTotalArchivedCardCount } from '../features/archive/archiveService';
import { getActiveContractCount } from '../features/contracts/contractRepository';
import { getActiveEducationProfileCount } from '../features/education/educationRepository';
import { getActiveFamilyMemberCount } from '../features/family/familyRepository';
import { getActiveHealthProfileCount } from '../features/health/healthRepository';
import { getActionableNotificationCount } from '../features/notifications/notificationService';
import { getActivePropertyCount } from '../features/properties/propertyRepository';
import { getActiveStaffCount } from '../features/staff/staffRepository';
import { getTaskCount } from '../features/tasks/taskRepository';
import { getActiveVehicleCount } from '../features/vehicles/vehicleRepository';

const COUNT_LOADERS: Record<string, () => Promise<number>> = {
  // Every count below excludes archived records -- Phase 10: an archived
  // card must never inflate its active category's count.
  family: getActiveFamilyMemberCount,
  properties: getActivePropertyCount,
  vehicles: getActiveVehicleCount,
  staff: getActiveStaffCount,
  contracts: getActiveContractCount,
  tasks: getTaskCount,
  health: getActiveHealthProfileCount,
  education: getActiveEducationProfileCount,
  // Derived, never persisted -- see notificationService.ts. Recomputed on
  // every load, same as every other category's count.
  notifications: getActionableNotificationCount,
  // Total archived top-level cards across all eight domains -- derived,
  // never persisted, same treatment as the notifications count above.
  archive: getTotalArchivedCardCount,
};

/**
 * Item count for a category. `notifications` is the one derived count
 * (an aggregate over four other modules' own state, computed fresh each
 * time) — every other category still counts its own single store, until
 * its own module is built, at which point it gets the same treatment
 * here without touching any call site.
 */
export function useCategoryCount(categoryId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = COUNT_LOADERS[categoryId];
    if (!load) {
      setCount(0);
      return;
    }
    let cancelled = false;
    load()
      .then((value) => {
        if (!cancelled) setCount(value);
      })
      .catch((error) => {
        console.error(`Failed to load count for category "${categoryId}"`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return count;
}
