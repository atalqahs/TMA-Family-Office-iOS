import { useEffect, useState } from 'react';
import { getActiveFamilyMemberCount } from '../features/family/familyRepository';

/**
 * Item count for a category. Only `family` has a real store so far — every
 * other category still returns 0 until its own module is built, at which
 * point it gets the same treatment here without touching any call site.
 */
export function useCategoryCount(categoryId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (categoryId !== 'family') {
      setCount(0);
      return;
    }
    let cancelled = false;
    getActiveFamilyMemberCount()
      .then((value) => {
        if (!cancelled) setCount(value);
      })
      .catch((error) => {
        console.error('Failed to load family member count', error);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return count;
}
