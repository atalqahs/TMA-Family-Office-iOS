import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listTaskGroups } from '../taskRepository';
import type { TaskGroup } from '../types';

/** Loads every TaskGroup, same `refresh()`-after-mutation shape as useContracts/useTasks. */
export function useTaskGroups() {
  const fetcher = useCallback(() => listTaskGroups(), []);
  const { data: groups, loading, error, refresh } = useAsyncResource<TaskGroup[]>(fetcher, []);
  return { groups, loading, error, refresh };
}
