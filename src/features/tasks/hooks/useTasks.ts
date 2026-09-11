import { useCallback, useEffect, useState } from 'react';
import { listAllCompletions, listTasks } from '../taskRepository';
import type { Task, TaskCompletion } from '../types';

/**
 * Loads every task AND every completion for the Tasks list page in one
 * pass, same `refresh()`-after-mutation shape as useContracts/useVehicles.
 * Completions are loaded up front (not per-task) so the list can compute
 * each task's derived status (see taskStatus.ts) without an N+1 query,
 * the same pattern already used for Staff salary schedules/payments.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [allTasks, allCompletions] = await Promise.all([listTasks(), listAllCompletions()]);
      setTasks(allTasks);
      setCompletions(allCompletions);
    } catch (err) {
      console.error('Failed to load tasks', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { tasks, completions, loading, error, refresh };
}
