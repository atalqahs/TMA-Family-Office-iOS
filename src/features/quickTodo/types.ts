/**
 * A single Quick To-Do checklist item -- a tiny, informal, spontaneous
 * reminder (e.g. "Get a haircut", "Refuel the car"), deliberately NOT a
 * `Task` (see features/tasks/). There is no `dueDate`, no priority, no
 * recurrence, no group, no assignee -- none of Tasks & Reminders'
 * structure applies here on purpose (Section 2/4 of the spec this
 * feature was built from): this is a fast personal checklist, not a
 * second task-management system, and it must never be confused with one.
 *
 * Deletion is direct and permanent -- there is no archive/trash state.
 * `completed` items are never auto-removed (Section 2: "Keep completed
 * items accessible until the user deletes them") -- they stay in the
 * list, struck through, until the user explicitly deletes them.
 *
 * This module has ZERO relationship to any other feature: it is never
 * read by the General Calendar, Notifications, Archive, or Tasks &
 * Reminders (see the architecture gate's own isolation rule) -- it exists
 * purely for fast, informal personal organization directly on the
 * Dashboard.
 */
export interface QuickTodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
