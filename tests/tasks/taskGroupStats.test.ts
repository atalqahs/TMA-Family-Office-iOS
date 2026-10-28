import { describe, expect, it } from 'vitest';
import { computeTaskGroupStats } from '../../src/features/tasks/taskGroupStats';
import type { Task } from '../../src/features/tasks/types';

const NOW = new Date(2026, 5, 15);

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 't1',
    groupId: overrides.groupId ?? 'g1',
    title: 'Task',
    priority: 'normal',
    recurrenceUnit: 'none',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeTaskGroupStats', () => {
  it('only counts tasks that belong to the requested group', () => {
    const tasks = [task({ id: 'a', groupId: 'g1' }), task({ id: 'b', groupId: 'g2' })];
    expect(computeTaskGroupStats('g1', tasks, [], NOW).totalCount).toBe(1);
  });

  it('counts overdue tasks correctly', () => {
    const tasks = [task({ id: 'a', groupId: 'g1', dueDate: '2026-01-01' })];
    expect(computeTaskGroupStats('g1', tasks, [], NOW).overdueCount).toBe(1);
  });

  it('finds the nearest upcoming date among the group’s upcoming tasks', () => {
    const tasks = [
      task({ id: 'a', groupId: 'g1', dueDate: '2026-09-01' }),
      task({ id: 'b', groupId: 'g1', dueDate: '2026-07-01' }),
    ];
    expect(computeTaskGroupStats('g1', tasks, [], NOW).nearestUpcomingDate).toBe('2026-07-01');
  });

  it('an empty group reports zero counts and no nearest date', () => {
    const stats = computeTaskGroupStats('empty-group', [], [], NOW);
    expect(stats).toEqual({ totalCount: 0, overdueCount: 0, nearestUpcomingDate: undefined });
  });
});
