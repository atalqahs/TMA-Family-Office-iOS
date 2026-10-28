import { addLocalDays, addLocalMonths } from '../../utils/localDate';
import { UNSCHEDULED_OCCURRENCE_KEY } from './types';
import type { Task, TaskRecurrenceUnit } from './types';

/** A sensible safety bound on how many occurrences a lookup ever walks — real usage never gets remotely close to this; it only guards against a pathological/corrupted data state ever hanging the app. */
const MAX_OCCURRENCE_LOOKUPS = 10_000;

/**
 * The Nth occurrence date computed from a KNOWN, non-empty anchor date --
 * always fresh from that fixed anchor, never by chaining from a
 * previously computed occurrence. This is what prevents a monthly/yearly
 * schedule from permanently drifting to a clamped day: adding
 * `interval * n` months fresh from the anchor's own day-of-month each
 * time means a January 31 anchor returns to the 31st every month that
 * has one, rather than getting stuck on the 28th after February clamped
 * it once. Day/week recurrence needs no clamping at all -- simple local
 * calendar-day arithmetic.
 */
function computeDatedOccurrence(dueDate: string, recurrenceUnit: TaskRecurrenceUnit, recurrenceInterval: number | undefined, n: number): string {
  if (recurrenceUnit === 'none' || n === 0) {
    return dueDate;
  }
  const interval = recurrenceInterval ?? 1;
  switch (recurrenceUnit) {
    case 'day':
      return addLocalDays(dueDate, interval * n);
    case 'week':
      return addLocalDays(dueDate, interval * n * 7);
    case 'month':
      return addLocalMonths(dueDate, interval * n);
    case 'year':
      return addLocalMonths(dueDate, interval * n * 12);
  }
}

export interface TaskOccurrence {
  /** Stable identity for completion lookups: the occurrence's own date when the task is dated, or `UNSCHEDULED_OCCURRENCE_KEY` for an undated one-time task's single occurrence. */
  occurrenceKey: string;
  /** The real calendar date, only present for a dated occurrence. */
  occurrenceDate?: string;
}

/**
 * The currently-relevant occurrence for a task: the OLDEST occurrence
 * that has not been completed yet. This is the rule that prevents an
 * overdue recurring occurrence from being silently skipped -- e.g. a
 * monthly task whose August occurrence was never completed stays on
 * August (not September) until that August occurrence is explicitly
 * completed, however far in the past it falls. A one-time task
 * (`recurrenceUnit === 'none'`) has exactly one occurrence: `dueDate`
 * itself -- or, if the task has no `dueDate` at all, the single
 * `UNSCHEDULED_OCCURRENCE_KEY` occurrence.
 *
 * `completedOccurrenceKeys` is the set of occurrence keys that already
 * have a TaskCompletion for this task (see taskStatus.ts, which is the
 * only caller expected to build this set from real completion records).
 */
export function getCurrentOccurrence(
  task: Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'>,
  completedOccurrenceKeys: ReadonlySet<string>,
): TaskOccurrence {
  if (!task.dueDate) {
    return { occurrenceKey: UNSCHEDULED_OCCURRENCE_KEY, occurrenceDate: undefined };
  }
  if (task.recurrenceUnit === 'none') {
    return { occurrenceKey: task.dueDate, occurrenceDate: task.dueDate };
  }
  let n = 0;
  let occurrenceDate = computeDatedOccurrence(task.dueDate, task.recurrenceUnit, task.recurrenceInterval, n);
  while (completedOccurrenceKeys.has(occurrenceDate) && n < MAX_OCCURRENCE_LOOKUPS) {
    n += 1;
    occurrenceDate = computeDatedOccurrence(task.dueDate, task.recurrenceUnit, task.recurrenceInterval, n);
  }
  return { occurrenceKey: occurrenceDate, occurrenceDate };
}

/**
 * Every occurrence date of a task that falls within [rangeStart,
 * rangeEnd] (inclusive, both local 'YYYY-MM-DD'), for calendar display.
 * Unlike `getCurrentOccurrence`, this deliberately includes BOTH past
 * and future occurrences regardless of completion, so a month view can
 * show where a recurring task's schedule falls even before/after the
 * single currently-actionable occurrence.
 *
 * An undated task (no `dueDate`) has no calendar presence at all and
 * always returns an empty list -- the calendar must never fabricate a
 * date for it.
 */
export function getOccurrenceDatesInRange(
  task: Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'>,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  if (!task.dueDate) {
    return [];
  }
  if (task.recurrenceUnit === 'none') {
    return task.dueDate >= rangeStart && task.dueDate <= rangeEnd ? [task.dueDate] : [];
  }
  const dates: string[] = [];
  let n = 0;
  let occurrenceDate = computeDatedOccurrence(task.dueDate, task.recurrenceUnit, task.recurrenceInterval, n);
  // Occurrence dates are monotonically increasing in n, so once we pass
  // rangeEnd we can stop; the anchor itself may already be after
  // rangeStart (nothing to skip) or long before it (skip forward).
  while (occurrenceDate <= rangeEnd && n < MAX_OCCURRENCE_LOOKUPS) {
    if (occurrenceDate >= rangeStart) {
      dates.push(occurrenceDate);
    }
    n += 1;
    occurrenceDate = computeDatedOccurrence(task.dueDate, task.recurrenceUnit, task.recurrenceInterval, n);
  }
  return dates;
}
