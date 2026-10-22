import type { CalendarEvent } from '../types';
import { getOccurrenceDatesInRange } from '../../tasks/taskRecurrence';
import { getTaskGroupColor } from '../../tasks/taskGroupColor';
import type { Task, TaskGroup } from '../../tasks/types';

/**
 * Every Task occurrence (recurring or one-time) that falls within range,
 * reusing `getOccurrenceDatesInRange` -- the same recurrence expansion the
 * Tasks Calendar itself is built on -- so the General Calendar can never
 * drift from, or duplicate, what the Tasks Calendar shows. Unlike every
 * other source here, a Task event's color is NOT the shared gray constant:
 * it's resolved from the task's own TaskGroup via `getTaskGroupColor`, so
 * the dot reflects whichever color that group is currently assigned.
 * `rawTitle` (not a translation key) because `task.title` is free-text
 * user data, same convention as `TaskCalendarPage.tsx`.
 */
export function buildTaskCalendarEvents(tasks: Task[], groups: TaskGroup[], rangeStart: string, rangeEnd: string): CalendarEvent[] {
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const events: CalendarEvent[] = [];

  for (const task of tasks) {
    const group = groupById.get(task.groupId);
    const color = getTaskGroupColor(group ?? {});

    for (const occurrenceDate of getOccurrenceDatesInRange(task, rangeStart, rangeEnd)) {
      events.push({
        id: `tasks:${task.id}:${occurrenceDate}`,
        category: 'tasks',
        sourceId: task.id,
        date: occurrenceDate,
        color,
        route: `/tasks/task/${task.id}`,
        rawTitle: task.title,
      });
    }
  }

  return events;
}
