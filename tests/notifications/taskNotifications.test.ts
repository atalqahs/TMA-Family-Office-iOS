import { describe, expect, it } from 'vitest';
import { buildTaskNotifications } from '../../src/features/notifications/sources/taskNotifications';
import type { Task, TaskCompletion } from '../../src/features/tasks/types';

const NOW = new Date(2026, 5, 15); // local June 15, 2026

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 't1',
    groupId: 'g1',
    title: overrides.title ?? 'Pay school fees',
    priority: 'normal',
    recurrenceUnit: 'none',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Task notifications', () => {
  it('24. flags an overdue one-time task as critical', () => {
    const items = buildTaskNotifications([task({ dueDate: '2026-06-01' })], [], NOW);
    expect(items[0]).toMatchObject({ id: 'task:t1:2026-06-01', kind: 'taskOverdue', severity: 'critical', route: '/tasks/task/t1' });
  });

  it('25. flags a due-today task as warning', () => {
    const items = buildTaskNotifications([task({ dueDate: '2026-06-15' })], [], NOW);
    expect(items[0]).toMatchObject({ id: 'task:t1:2026-06-15', kind: 'taskDueToday', severity: 'warning' });
  });

  it('26. a future/upcoming task is excluded', () => {
    const items = buildTaskNotifications([task({ dueDate: '2026-07-01' })], [], NOW);
    expect(items).toEqual([]);
  });

  it('27. an undated task is excluded', () => {
    const items = buildTaskNotifications([task({ dueDate: undefined })], [], NOW);
    expect(items).toEqual([]);
  });

  it('28. a completed occurrence is excluded', () => {
    const completions: TaskCompletion[] = [{ id: 'c1', taskId: 't1', occurrenceKey: '2026-06-01', completedAt: '2026-06-01T00:00:00.000Z' }];
    const items = buildTaskNotifications([task({ dueDate: '2026-06-01' })], completions, NOW);
    expect(items).toEqual([]);
  });

  it('29. a recurring task notifies for its oldest outstanding occurrence, never a newer one', () => {
    const recurring = task({ dueDate: '2026-01-01', recurrenceUnit: 'month', recurrenceInterval: 1 });
    const completions: TaskCompletion[] = [
      { id: 'c1', taskId: 't1', occurrenceKey: '2026-01-01', completedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'c2', taskId: 't1', occurrenceKey: '2026-02-01', completedAt: '2026-02-01T00:00:00.000Z' },
      // March, April, May left uncompleted -- March (oldest) must be the one notified.
    ];
    const items = buildTaskNotifications([recurring], completions, NOW);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('task:t1:2026-03-01');
  });

  it('30. the notification id carries the exact occurrenceKey used for completion, not a fabricated one', () => {
    const items = buildTaskNotifications([task({ dueDate: '2026-06-01' })], [], NOW);
    const [, , occurrenceKey] = items[0].id.split(':');
    expect(occurrenceKey).toBe('2026-06-01');
    expect(items[0].effectiveDate).toBe('2026-06-01');
  });
});
