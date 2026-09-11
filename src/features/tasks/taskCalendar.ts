import { getOccurrenceDatesInRange } from './taskRecurrence';
import { computeOccurrenceDateState, groupCompletionsByTaskId, TASK_STATE_URGENCY_RANK, type TaskState } from './taskStatus';
import type { Task, TaskCompletion } from './types';

export interface CalendarDayInfo {
  date: string;
  /** The most urgent state among every task occurring on this day -- e.g. one overdue + one completed task sharing a date shows as overdue, since that is what still needs attention. */
  worstState: TaskState;
  taskIds: string[];
}

/**
 * Every day within [monthStart, monthEnd] (inclusive, local 'YYYY-MM-DD')
 * that has at least one task occurrence, for a month calendar's date
 * indicators. Entirely local-calendar-safe: occurrence dates come only
 * from `getOccurrenceDatesInRange` (taskRecurrence.ts), which is itself
 * built on local date arithmetic, never UTC.
 */
export function buildCalendarDayMap(
  tasks: Task[],
  completions: TaskCompletion[],
  monthStart: string,
  monthEnd: string,
  today: string,
): Map<string, CalendarDayInfo> {
  const completionsByTask = groupCompletionsByTaskId(completions);
  const dayMap = new Map<string, CalendarDayInfo>();

  for (const task of tasks) {
    const completedDates = new Set(
      (completionsByTask.get(task.id) ?? []).map((completion) => completion.occurrenceDate),
    );
    for (const occurrenceDate of getOccurrenceDatesInRange(task, monthStart, monthEnd)) {
      const state = computeOccurrenceDateState(occurrenceDate, completedDates.has(occurrenceDate), today);
      const existing = dayMap.get(occurrenceDate);
      if (!existing) {
        dayMap.set(occurrenceDate, { date: occurrenceDate, worstState: state, taskIds: [task.id] });
      } else {
        existing.taskIds.push(task.id);
        if (TASK_STATE_URGENCY_RANK[state] < TASK_STATE_URGENCY_RANK[existing.worstState]) {
          existing.worstState = state;
        }
      }
    }
  }
  return dayMap;
}

export interface CalendarDateEntry {
  task: Task;
  state: TaskState;
}

/** Every task with an occurrence on exactly one date, for the "tap a date" detail list. */
export function getTasksForDate(tasks: Task[], completions: TaskCompletion[], date: string, today: string): CalendarDateEntry[] {
  const completionsByTask = groupCompletionsByTaskId(completions);
  const entries: CalendarDateEntry[] = [];
  for (const task of tasks) {
    if (getOccurrenceDatesInRange(task, date, date).length === 0) continue;
    const completedDates = new Set(
      (completionsByTask.get(task.id) ?? []).map((completion) => completion.occurrenceDate),
    );
    entries.push({ task, state: computeOccurrenceDateState(date, completedDates.has(date), today) });
  }
  return entries;
}
