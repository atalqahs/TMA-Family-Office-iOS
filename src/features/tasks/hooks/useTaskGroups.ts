import { useCallback, useEffect, useState } from 'react';
import { listTaskGroups } from '../taskRepository';
import type { TaskGroup } from '../types';

/** Loads every TaskGroup, same `refresh()`-after-mutation shape as useContracts/useTasks. */
export function useTaskGroups() {
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setGroups(await listTaskGroups());
    } catch (err) {
      console.error('Failed to load task groups', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { groups, loading, error, refresh };
}
