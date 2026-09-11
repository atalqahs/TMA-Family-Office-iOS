import { addLocalDays, addLocalMonths } from '../../utils/localDate';
import type { Task } from './types';

/** A sensible safety bound on how many occurrences a lookup ever walks — real usage never gets remotely close to this; it only guards against a pathological/corrupted data state ever hanging the app. */
const MAX_OCCURRENCE_LOOKUPS = 10_000;

/**
 * The Nth occurrence date of a task's schedule, always computed from the
 * FIXED original anchor (`task.dueDate`), never by chaining from a
 * previously computed occurrence. This is what prevents a monthly/yearly
 * schedule from permanently drifting to a clamped day: adding
 * `interval * n` months fresh from the anchor's own day-of-month each
 * time means a January 31 anchor returns to the 31st every month that
 * has one, rather than getting stuck on the 28th after February clamped
 * it once. Day/week recurrence needs no clamping at all -- simple local
 * calendar-day arithmetic.
 */
export function getOccurrenceDate(task: Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'>, n: number): string {
  if (task.recurrenceUnit === 'none' || n === 0) {
    return task.dueDate;
  }
  const interval = task.recurrenceInterval ?? 1;
  switch (task.recurrenceUnit) {
    case 'day':
      return addLocalDays(task.dueDate, interval * n);
    case 'week':
      return addLocalDays(task.dueDate, interval * n * 7);
    case 'month':
      return addLocalMonths(task.dueDate, interval * n);
    case 'year':
      return addLocalMonths(task.dueDate, interval * n * 12);
  }
}

/**
 * The currently-relevant occurrence for a task: the OLDEST occurrence
 * that has not been completed yet. This is the rule that prevents an
 * overdue recurring occurrence from being silently skipped -- e.g. a
 * monthly task whose August occurrence was never completed stays on
 * August (not September) until that August occurrence is explicitly
 * completed, however far in the past it falls. A one-time task
 * (`recurrenceUnit === 'none'`) has exactly one occurrence: `dueDate`
 * itself.
 *
 * `completedOccurrenceDates` is the set of occurrence dates that already
 * have a TaskCompletion for this task (see taskStatus.ts, which is the
 * only caller expected to build this set from real completion records).
 */
export function getCurrentOccurrenceDate(
  task: Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'>,
  completedOccurrenceDates: ReadonlySet<string>,
): string {
  if (task.recurrenceUnit === 'none') {
    return task.dueDate;
  }
  let n = 0;
  let occurrenceDate = getOccurrenceDate(task, n);
  while (completedOccurrenceDates.has(occurrenceDate) && n < MAX_OCCURRENCE_LOOKUPS) {
    n += 1;
    occurrenceDate = getOccurrenceDate(task, n);
  }
  return occurrenceDate;
}

/**
 * Every occurrence date of a task that falls within [rangeStart,
 * rangeEnd] (inclusive, both local 'YYYY-MM-DD'), for calendar display.
 * Unlike `getCurrentOccurrenceDate`, this deliberately includes BOTH past
 * and future occurrences regardless of completion, so a month view can
 * show where a recurring task's schedule falls even before/after the
 * single currently-actionable occurrence.
 */
export function getOccurrenceDatesInRange(
  task: Pick<Task, 'dueDate' | 'recurrenceUnit' | 'recurrenceInterval'>,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  if (task.recurrenceUnit === 'none') {
    return task.dueDate >= rangeStart && task.dueDate <= rangeEnd ? [task.dueDate] : [];
  }
  const dates: string[] = [];
  let n = 0;
  let occurrenceDate = getOccurrenceDate(task, n);
  // Occurrence dates are monotonically increasing in n, so once we pass
  // rangeEnd we can stop; the anchor itself may already be after
  // rangeStart (nothing to skip) or long before it (skip forward).
  while (occurrenceDate <= rangeEnd && n < MAX_OCCURRENCE_LOOKUPS) {
    if (occurrenceDate >= rangeStart) {
      dates.push(occurrenceDate);
    }
    n += 1;
    occurrenceDate = getOccurrenceDate(task, n);
  }
  return dates;
}
