import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listAllCompletions, listTasks } from '../taskRepository';
import type { Task, TaskCompletion } from '../types';

interface TasksData {
  tasks: Task[];
  completions: TaskCompletion[];
}

const EMPTY: TasksData = { tasks: [], completions: [] };

/**
 * Loads every task AND every completion for the Tasks list page in one
 * pass, same `refresh()`-after-mutation shape as useContracts/useVehicles.
 * Completions are loaded up front (not per-task) so the list can compute
 * each task's derived status (see taskStatus.ts) without an N+1 query,
 * the same pattern already used for Staff salary schedules/payments.
 */
export function useTasks() {
  const fetcher = useCallback(async (): Promise<TasksData> => {
    const [allTasks, allCompletions] = await Promise.all([listTasks(), listAllCompletions()]);
    return { tasks: allTasks, completions: allCompletions };
  }, []);
  const { data, loading, error, refresh } = useAsyncResource(fetcher, EMPTY);
  return { ...data, loading, error, refresh };
}
