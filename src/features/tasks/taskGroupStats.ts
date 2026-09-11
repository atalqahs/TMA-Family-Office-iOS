import { computeTaskOccurrenceStatus, groupCompletionsByTaskId } from './taskStatus';
import type { Task, TaskCompletion } from './types';

export interface TaskGroupStats {
  totalCount: number;
  overdueCount: number;
  /** The nearest occurrence date among this group's UPCOMING (future, not yet due) tasks -- undefined if none. */
  nearestUpcomingDate?: string;
}

/**
 * Summary stats for one group's card on the top-level Groups page --
 * reuses the exact same per-task status derivation as everywhere else in
 * the module (see taskStatus.ts), just aggregated per group instead of
 * per task.
 */
export function computeTaskGroupStats(
  groupId: string,
  tasks: Task[],
  completions: TaskCompletion[],
  now: Date = new Date(),
): TaskGroupStats {
  const groupTasks = tasks.filter((task) => task.groupId === groupId);
  const completionsByTask = groupCompletionsByTaskId(completions);

  let overdueCount = 0;
  let nearestUpcomingDate: string | undefined;
  for (const task of groupTasks) {
    const { occurrenceDate, state } = computeTaskOccurrenceStatus(task, completionsByTask.get(task.id) ?? [], now);
    if (state === 'overdue') {
      overdueCount += 1;
    } else if (state === 'upcoming' && (!nearestUpcomingDate || occurrenceDate < nearestUpcomingDate)) {
      nearestUpcomingDate = occurrenceDate;
    }
  }

  return { totalCount: groupTasks.length, overdueCount, nearestUpcomingDate };
}
