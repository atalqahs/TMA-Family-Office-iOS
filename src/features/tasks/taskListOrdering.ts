import {
  computeTaskOccurrenceStatus,
  groupCompletionsByTaskId,
  TASK_STATE_URGENCY_RANK,
  type TaskOccurrenceStatus,
  type TaskState,
} from './taskStatus';
import type { Task, TaskCompletion, TaskPriority } from './types';

export interface TaskListEntry extends TaskOccurrenceStatus {
  task: Task;
}

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };

/** Pairs every task with its currently-relevant occurrence + derived state, using each task's own completion records (see taskStatus.ts). */
export function buildTaskListEntries(tasks: Task[], completions: TaskCompletion[]): TaskListEntry[] {
  const completionsByTask = groupCompletionsByTaskId(completions);
  return tasks.map((task) => ({
    task,
    ...computeTaskOccurrenceStatus(task, completionsByTask.get(task.id) ?? []),
  }));
}

/**
 * Overdue first (oldest obligation first), then due today, then upcoming
 * (nearest first), then completed last. Within the same occurrence date,
 * higher priority sorts first.
 */
export function sortTaskListEntries(entries: TaskListEntry[]): TaskListEntry[] {
  return [...entries].sort((a, b) => {
    const stateDiff = TASK_STATE_URGENCY_RANK[a.state] - TASK_STATE_URGENCY_RANK[b.state];
    if (stateDiff !== 0) return stateDiff;
    const dateDiff = a.occurrenceDate.localeCompare(b.occurrenceDate);
    if (dateDiff !== 0) return dateDiff;
    return PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority];
  });
}

export type TaskListFilter = 'all' | TaskState;

export function filterTaskListEntries(entries: TaskListEntry[], filter: TaskListFilter): TaskListEntry[] {
  if (filter === 'all') return entries;
  return entries.filter((entry) => entry.state === filter);
}
