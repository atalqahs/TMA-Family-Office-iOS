import type { TranslationKey } from '../../localization/translations';
import { getLocalToday } from '../../utils/localDate';
import { getCurrentOccurrence } from './taskRecurrence';
import type { Task, TaskCompletion } from './types';

export type TaskState = 'overdue' | 'dueToday' | 'upcoming' | 'noDueDate' | 'completed';

/** Shared status -> StatusBadge variant / label-key mappings, matching the same visual language used across Vehicles/Staff/Contracts. 'upcoming' and 'noDueDate' are both deliberately neutral, not a warning -- neither needs attention yet (an undated task was never given a deadline in the first place). */
export const TASK_STATE_VARIANT: Record<TaskState, 'neutral' | 'success' | 'warning' | 'danger'> = {
  overdue: 'danger',
  dueToday: 'warning',
  upcoming: 'neutral',
  noDueDate: 'neutral',
  completed: 'success',
};

export const TASK_STATE_LABEL_KEY: Record<TaskState, TranslationKey> = {
  overdue: 'taskStateOverdue',
  dueToday: 'taskStateDueToday',
  upcoming: 'taskStateUpcoming',
  noDueDate: 'taskStateNoDueDate',
  completed: 'taskStateCompleted',
};

/** Groups completion records by their task, for callers that need per-task completed-occurrence sets without an N+1 query per task (list sorting, calendar day maps). */
export function groupCompletionsByTaskId(completions: TaskCompletion[]): Map<string, TaskCompletion[]> {
  const grouped = new Map<string, TaskCompletion[]>();
  for (const completion of completions) {
    const existing = grouped.get(completion.taskId);
    if (existing) {
      existing.push(completion);
    } else {
      grouped.set(completion.taskId, [completion]);
    }
  }
  return grouped;
}

/** Urgency ordering shared by list sorting and calendar day-dot selection -- lower is more urgent/worth surfacing first. An undated task is never urgent, so it ranks just above Completed. */
export const TASK_STATE_URGENCY_RANK: Record<TaskState, number> = {
  overdue: 0,
  dueToday: 1,
  upcoming: 2,
  noDueDate: 3,
  completed: 4,
};

export interface TaskOccurrenceStatus {
  /** Stable identity for completion lookups (see taskRecurrence.ts). */
  occurrenceKey: string;
  /** The currently-relevant occurrence's due date -- only present when the task is dated. */
  occurrenceDate?: string;
  state: TaskState;
}

/**
 * The state a single, specific occurrence is in, given its (optional)
 * calendar date and whether IT (not necessarily the task's "current"
 * occurrence) has a completion. Shared by `computeTaskOccurrenceStatus`
 * below and by the calendar view, which needs the state of every
 * occurrence date shown in a month grid (including future/past ones
 * that aren't the task's currently-relevant occurrence) without
 * duplicating this branching logic. An `undefined` date (an undated
 * task's occurrence) is never overdue/due-today/upcoming -- it's simply
 * NO DUE DATE unless already completed.
 */
export function computeOccurrenceDateState(occurrenceDate: string | undefined, isCompleted: boolean, today: string): TaskState {
  if (isCompleted) {
    return 'completed';
  }
  if (occurrenceDate === undefined) {
    return 'noDueDate';
  }
  if (occurrenceDate < today) {
    return 'overdue';
  }
  if (occurrenceDate === today) {
    return 'dueToday';
  }
  return 'upcoming';
}

/**
 * The single source of truth for "what state is this task in right now,
 * and which occurrence does that refer to" -- centralizes exactly the
 * derivation Vehicles/Contracts already established for their own status
 * (never stored, always computed from the underlying data), and is the
 * shared building block both the UI (list grouping, status badges,
 * calendar dots) and a future Notifications module can query for "what
 * currently requires attention" without a second source of truth.
 *
 * Semantics:
 * - the oldest uncompleted occurrence date < today -> OVERDUE
 * - the oldest uncompleted occurrence date === today -> DUE TODAY
 * - the oldest uncompleted occurrence date > today -> UPCOMING
 * - the task has no due date at all -> NO DUE DATE (never overdue/due
 *   today/upcoming merely because it exists -- it was never given a
 *   deadline)
 * - that occurrence already has a TaskCompletion -> COMPLETED (this only
 *   happens for a one-time task whose single occurrence is done, since a
 *   recurring task's "oldest uncompleted" occurrence is, by construction,
 *   never itself completed unless every possible occurrence up to the
 *   lookup safety bound has been; a recurring task always has a due date,
 *   so NO DUE DATE only ever applies to one-time tasks)
 */
export function computeTaskOccurrenceStatus(
  task: Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'>,
  completions: Pick<TaskCompletion, 'occurrenceKey'>[],
  now: Date = new Date(),
): TaskOccurrenceStatus {
  const completedKeys = new Set(completions.map((c) => c.occurrenceKey));
  const occurrence = getCurrentOccurrence(task, completedKeys);
  const today = getLocalToday(now);

  return { ...occurrence, state: computeOccurrenceDateState(occurrence.occurrenceDate, completedKeys.has(occurrence.occurrenceKey), today) };
}
