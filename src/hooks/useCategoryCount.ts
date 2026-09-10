import { useEffect, useState } from 'react';
import { getActiveFamilyMemberCount } from '../features/family/familyRepository';
import { getPropertyCount } from '../features/properties/propertyRepository';
import { getVehicleCount } from '../features/vehicles/vehicleRepository';

const COUNT_LOADERS: Record<string, () => Promise<number>> = {
  family: getActiveFamilyMemberCount,
  properties: getPropertyCount,
  vehicles: getVehicleCount,
};

/**
 * Item count for a category. Only `family`, `properties`, and `vehicles`
 * have a real store so far — every other category still returns 0 until
 * its own module is built, at which point it gets the same treatment here
 * without touching any call site.
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
