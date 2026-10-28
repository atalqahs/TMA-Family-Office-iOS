import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listQuickTodoItems } from '../quickTodoRepository';
import type { QuickTodoItem } from '../types';

/** Loads every Quick To-Do item, same `refresh()`-after-mutation shape as every other list hook (useTaskGroups/useVehicles/...). */
export function useQuickTodoItems() {
  const fetcher = useCallback(() => listQuickTodoItems(), []);
  const { data: items, loading, error, refresh } = useAsyncResource<QuickTodoItem[]>(fetcher, []);
  return { items, loading, error, refresh };
}
