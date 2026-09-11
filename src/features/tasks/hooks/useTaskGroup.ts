import { useCallback, useEffect, useRef, useState } from 'react';
import { getTaskGroup } from '../taskRepository';
import type { TaskGroup } from '../types';

/**
 * `group` is `undefined` while loading, `null` if not found. Fetches the
 * group DIRECTLY by id (never through the active-only `listTaskGroups()`),
 * so an archived group is still found here -- exactly what
 * TaskGroupDetailPage needs to show its "Archived, Unarchive to view"
 * notice instead of a false "not found" (see useVehicle/useStaffMember/
 * useProperty/useFamilyMember/useContract for the same
 * detail-vs-active-list distinction).
 *
 * `groupId` can change while a fetch for the previous id is still in
 * flight; `requestIdRef` tags each fetch and discards any result that
 * isn't the most recently started one (same guard as every other detail
 * hook).
 */
export function useTaskGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<TaskGroup | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!groupId) {
      if (requestId === requestIdRef.current) setGroup(null);
      return;
    }
    try {
      const found = await getTaskGroup(groupId);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setGroup(found ?? null);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load task group', err);
      setError(true);
      setGroup(null);
    }
  }, [groupId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { group, loading: group === undefined, error, refresh };
}
