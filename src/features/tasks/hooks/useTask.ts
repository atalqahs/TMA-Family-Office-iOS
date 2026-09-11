import { useCallback, useEffect, useRef, useState } from 'react';
import { getTask, listCompletionsForTask } from '../taskRepository';
import type { Task, TaskCompletion } from '../types';

/**
 * `task` is `undefined` while loading, `null` if not found (or deleted).
 * `taskId` can change while a fetch for the previous id is still in
 * flight; `requestIdRef` tags each fetch and discards any result that
 * isn't the most recently started one (same guard as
 * useContract/useVehicle/useStaffMember/useProperty/useFamilyMember).
 */
export function useTask(taskId: string | undefined) {
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!taskId) {
      if (requestId === requestIdRef.current) setTask(null);
      return;
    }
    try {
      const [found, taskCompletions] = await Promise.all([getTask(taskId), listCompletionsForTask(taskId)]);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setTask(found ?? null);
      setCompletions(taskCompletions);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load task', err);
      setError(true);
      setTask(null);
    }
  }, [taskId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { task, completions, loading: task === undefined, error, refresh };
}
