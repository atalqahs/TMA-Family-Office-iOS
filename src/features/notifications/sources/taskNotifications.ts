import { computeTaskOccurrenceStatus, groupCompletionsByTaskId } from '../../tasks/taskStatus';
import type { Task, TaskCompletion } from '../../tasks/types';
import type { NotificationItem } from '../types';

/**
 * Reuses `computeTaskOccurrenceStatus` verbatim -- the single source of
 * truth for a task's currently-relevant occurrence (the Phase 8
 * anchor-based recurrence math + the "oldest uncompleted occurrence"
 * rule, both already implemented in taskRecurrence.ts/taskStatus.ts). No
 * recurrence logic is recalculated here; the occurrence's own
 * `occurrenceKey` is carried straight into the notification id, exactly
 * as it exists in TaskCompletion records.
 *
 * Undated tasks (`noDueDate`), future/upcoming occurrences, and completed
 * occurrences are all excluded by construction -- only `overdue` and
 * `dueToday` ever produce a notification.
 */
export function buildTaskNotifications(tasks: Task[], completions: TaskCompletion[], now: Date = new Date()): NotificationItem[] {
  const items: NotificationItem[] = [];
  const completionsByTask = groupCompletionsByTaskId(completions);

  for (const task of tasks) {
    const { occurrenceKey, occurrenceDate, state } = computeTaskOccurrenceStatus(task, completionsByTask.get(task.id) ?? [], now);
    if (state !== 'overdue' && state !== 'dueToday') continue;

    const overdue = state === 'overdue';
    items.push({
      id: `task:${task.id}:${occurrenceKey}`,
      sourceType: 'task',
      sourceId: task.id,
      kind: overdue ? 'taskOverdue' : 'taskDueToday',
      severity: overdue ? 'critical' : 'warning',
      titleKey: overdue ? 'notificationTitleTaskOverdue' : 'notificationTitleTaskDueToday',
      titleParams: { title: task.title },
      messageKey: overdue ? 'notificationMsgOverdueSince' : 'notificationMsgDueToday',
      messageParams: overdue && occurrenceDate ? { date: occurrenceDate } : undefined,
      effectiveDate: occurrenceDate,
      sortDate: occurrenceDate,
      route: `/tasks/task/${task.id}`,
    });
  }

  return items;
}
