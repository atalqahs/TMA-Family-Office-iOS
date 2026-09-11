import { useEffect, useState } from 'react';
import { getContractCount } from '../features/contracts/contractRepository';
import { getActiveFamilyMemberCount } from '../features/family/familyRepository';
import { getActionableNotificationCount } from '../features/notifications/notificationService';
import { getPropertyCount } from '../features/properties/propertyRepository';
import { getStaffCount } from '../features/staff/staffRepository';
import { getTaskCount } from '../features/tasks/taskRepository';
import { getVehicleCount } from '../features/vehicles/vehicleRepository';

const COUNT_LOADERS: Record<string, () => Promise<number>> = {
  family: getActiveFamilyMemberCount,
  properties: getPropertyCount,
  vehicles: getVehicleCount,
  staff: getStaffCount,
  contracts: getContractCount,
  tasks: getTaskCount,
  // Derived, never persisted -- see notificationService.ts. Recomputed on
  // every load, same as every other category's count.
  notifications: getActionableNotificationCount,
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
