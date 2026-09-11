import type { LocalizedText } from '../../localization/translations';

export type TaskPriority = 'low' | 'normal' | 'high';

export const TASK_PRIORITIES: Array<{ id: TaskPriority; title: LocalizedText }> = [
  { id: 'low', title: { ar: 'منخفضة', en: 'Low' } },
  { id: 'normal', title: { ar: 'عادية', en: 'Normal' } },
  { id: 'high', title: { ar: 'عالية', en: 'High' } },
];

/** 'none' means a one-time task; every other unit requires `recurrenceInterval`. */
export type TaskRecurrenceUnit = 'none' | 'day' | 'week' | 'month' | 'year';

export const TASK_RECURRENCE_UNITS: Array<{ id: Exclude<TaskRecurrenceUnit, 'none'>; title: LocalizedText }> = [
  { id: 'day', title: { ar: 'يوم', en: 'Day' } },
  { id: 'week', title: { ar: 'أسبوع', en: 'Week' } },
  { id: 'month', title: { ar: 'شهر', en: 'Month' } },
  { id: 'year', title: { ar: 'سنة', en: 'Year' } },
];

/** A recurrence interval far beyond this is almost certainly a data-entry mistake -- a sensible safety bound, not a real-world limit anyone should hit. */
export const MAX_RECURRENCE_INTERVAL = 999;

/**
 * A user-created internal organizational folder for Tasks -- e.g. "Vehicle
 * Reminders", "Home", "Personal". Purely an organizational concept for the
 * Tasks module: a group named "Vehicle Reminders" has NO automatic
 * relationship to the Vehicles module (or any other module) -- Tasks &
 * Reminders is fully independent from every other category (see Task's
 * own doc comment below). Every Task belongs to exactly one group --
 * there are no ungrouped/orphan Tasks.
 */
export interface TaskGroup {
  id: string;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskGroupFormValues = Omit<TaskGroup, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * The stable id of the single group created once, automatically, by the
 * v8 -> v9 migration to hold every Task that existed before groups did.
 * Its display name is resolved via a translation key rather than this
 * literal string wherever it's shown (see taskGroupDisplay.ts), so it
 * reads as "General"/"عام" in either language regardless of what's
 * actually stored in its `name` field.
 */
export const MIGRATION_GENERAL_GROUP_ID = 'general';

/**
 * A household task/reminder. `id` is a stable UUID, independent of
 * `title`.
 *
 * `groupId` is mandatory -- every Task belongs to exactly one TaskGroup,
 * the user-facing top-level organization for this module.
 *
 * Tasks & Reminders is deliberately independent from every other module:
 * there is no relationship to Family/Property/Vehicle/Staff/Contract
 * records here (each of those modules owns its own expiry/obligation
 * state, and a future Notifications module aggregates across all of them
 * -- Tasks must never become a second reminder database for them).
 * `assignedToName` is the one allowance for "who is this for" -- a plain
 * free-text label (e.g. "السائق", "Ahmed"), NOT a foreign key: it is never
 * validated against, or looked up from, Family/Staff/any other module.
 *
 * `dueDate` is OPTIONAL -- a Task may be a general, undated reminder (see
 * taskStatus.ts's 'noDueDate' state). When present, it is the ANCHOR due
 * date of the recurring schedule (or simply the one due date for a
 * one-time task) -- it never changes as occurrences are completed. A
 * recurring Task (`recurrenceUnit !== 'none'`) MUST have a `dueDate`,
 * since recurrence needs an anchor to compute from -- enforced by
 * validation.ts, not by this type. `dueTime` may only be set alongside a
 * `dueDate` (a time without a date is meaningless and is rejected by
 * validation.ts too). The currently-relevant occurrence is always
 * DERIVED from these fields + which occurrences have a `TaskCompletion`
 * (see taskRecurrence.ts / taskStatus.ts), never stored, so it can never
 * go stale and an overdue occurrence can never be silently skipped.
 *
 * This is deliberately NOT a project-management suite: no subtasks, no
 * tags/labels, no attachments here.
 */
export interface Task {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority: TaskPriority;
  recurrenceUnit: TaskRecurrenceUnit;
  recurrenceInterval?: number;
  assignedToName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskFormValues = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/** The literal `occurrenceKey` used for the single, ever occurrence of an undated one-time Task -- never a fabricated calendar date (e.g. never "0000-00-00"). A stable, clearly-not-a-date sentinel string. */
export const UNSCHEDULED_OCCURRENCE_KEY = 'unscheduled';

/**
 * Closes exactly ONE occurrence of a Task -- `occurrenceKey` identifies
 * which one. For a dated Task, it's the occurrence's own 'YYYY-MM-DD'
 * date (for a one-time dated task there is only ever one meaningful
 * occurrence: the task's own `dueDate`; for a recurring task, each cycle
 * gets its own completion record here while the Task definition itself
 * stays active for future occurrences). For an undated one-time Task
 * (which has no calendar date to identify its single occurrence by), it
 * is the `UNSCHEDULED_OCCURRENCE_KEY` sentinel instead -- never a
 * fabricated date. At most one completion may exist per
 * (taskId, occurrenceKey) pair -- enforced by a unique IndexedDB index,
 * the same pattern already proven for Staff salary occurrences.
 */
export interface TaskCompletion {
  id: string;
  taskId: string;
  occurrenceKey: string;
  completedAt: string;
  notes?: string;
}
