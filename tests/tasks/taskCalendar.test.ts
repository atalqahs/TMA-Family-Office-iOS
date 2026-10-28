import { describe, expect, it } from 'vitest';
import { buildCalendarDayMap, getTasksForDate } from '../../src/features/tasks/taskCalendar';
import type { Task } from '../../src/features/tasks/types';

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 't1',
    groupId: 'g1',
    title: 'Task',
    priority: 'normal',
    recurrenceUnit: 'none',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildCalendarDayMap', () => {
  it('an undated task never appears on the calendar', () => {
    const map = buildCalendarDayMap([task({ dueDate: undefined })], [], '2026-01-01', '2026-01-31', '2026-01-15');
    expect(map.size).toBe(0);
  });

  it('shows the worst state among multiple tasks sharing the same day', () => {
    const tasks = [task({ id: 'a', dueDate: '2026-01-10' }), task({ id: 'b', dueDate: '2026-01-10' })];
    const map = buildCalendarDayMap(
      tasks,
      [{ id: 'c1', taskId: 'a', occurrenceKey: '2026-01-10', completedAt: '2026-01-10T00:00:00.000Z' }],
      '2026-01-01',
      '2026-01-31',
      '2026-01-15',
    );
    // task 'a' completed, task 'b' overdue (Jan 10 < Jan 15 today) -> worst is overdue
    expect(map.get('2026-01-10')?.worstState).toBe('overdue');
    expect(map.get('2026-01-10')?.taskIds).toEqual(['a', 'b']);
  });
});

describe('getTasksForDate', () => {
  it('returns only tasks with an occurrence on exactly the requested date', () => {
    const tasks = [task({ id: 'a', dueDate: '2026-01-10' }), task({ id: 'b', dueDate: '2026-01-11' })];
    const entries = getTasksForDate(tasks, [], '2026-01-10', '2026-01-15');
    expect(entries.map((e) => e.task.id)).toEqual(['a']);
    expect(entries[0].state).toBe('overdue');
  });
});
