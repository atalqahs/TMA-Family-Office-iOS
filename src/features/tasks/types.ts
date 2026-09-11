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

/** Which existing module a Task may optionally link to -- the same relationship shape Contracts established (stable id pair, never a data copy), extended with 'contract' itself since a Task may reasonably reference a Contract too. */
export type TaskLinkedEntityType = 'family' | 'property' | 'vehicle' | 'staff' | 'contract';

export const TASK_LINKED_ENTITY_TYPES: Array<{ id: TaskLinkedEntityType; title: LocalizedText }> = [
  { id: 'family', title: { ar: 'فرد من العائلة', en: 'Family Member' } },
  { id: 'property', title: { ar: 'عقار', en: 'Property' } },
  { id: 'vehicle', title: { ar: 'مركبة', en: 'Vehicle' } },
  { id: 'staff', title: { ar: 'عامل منزلي', en: 'Household Staff' } },
  { id: 'contract', title: { ar: 'عقد', en: 'Contract' } },
];

/**
 * A household task/reminder. `id` is a stable UUID, independent of
 * `title`.
 *
 * `dueDate` is the ANCHOR due date of the recurring schedule (or simply
 * the one due date for a one-time task) -- it never changes as occurrences
 * are completed. The currently-relevant occurrence date is always
 * DERIVED from `dueDate` + `recurrenceUnit`/`recurrenceInterval` +
 * which occurrences have a `TaskCompletion` (see taskRecurrence.ts /
 * taskStatus.ts), never stored, so it can never go stale and an
 * overdue occurrence can never be silently skipped.
 *
 * This is deliberately NOT a project-management suite: no subtasks, no
 * assignees, no tags/labels, no attachments here.
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  priority: TaskPriority;
  recurrenceUnit: TaskRecurrenceUnit;
  recurrenceInterval?: number;
  linkedEntityType?: TaskLinkedEntityType;
  linkedEntityId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskFormValues = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Closes exactly ONE occurrence of a Task -- `occurrenceDate` identifies
 * which one. For a one-time task there is only ever one meaningful
 * `occurrenceDate` (the task's own `dueDate`); for a recurring task, each
 * cycle gets its own completion record here while the Task definition
 * itself stays active for future occurrences. At most one completion may
 * exist per (taskId, occurrenceDate) pair -- enforced by a unique
 * IndexedDB index, the same pattern already proven for Staff salary
 * occurrences.
 */
export interface TaskCompletion {
  id: string;
  taskId: string;
  occurrenceDate: string;
  completedAt: string;
  notes?: string;
}
