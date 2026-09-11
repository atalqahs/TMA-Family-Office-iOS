import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTaskListEntries, filterTaskListEntries, sortTaskListEntries } from '../../src/features/tasks/taskListOrdering';
import type { Task, TaskCompletion } from '../../src/features/tasks/types';

// buildTaskListEntries has no injectable `now` parameter (it derives status
// via computeTaskOccurrenceStatus's default `new Date()`), so these tests
// pin the system clock instead of relying on relative dates that would
// silently drift into the wrong bucket as real time passes (Section P:
// tests must never depend on real "today").
const TODAY = new Date(2026, 5, 15); // local June 15, 2026

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 't1',
    groupId: 'g1',
    title: overrides.title ?? 'Task',
    priority: 'normal',
    recurrenceUnit: 'none',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('sortTaskListEntries: state, then date, then priority', () => {
  it('overdue sorts before upcoming, which sorts before noDueDate, which sorts before completed', () => {
    const tasks = [
      task({ id: 'completed', dueDate: '2026-01-01' }),
      task({ id: 'noDueDate', dueDate: undefined }),
      task({ id: 'upcoming', dueDate: '2026-07-01' }),
      task({ id: 'overdue', dueDate: '2026-01-01' }),
    ];
    const completions: TaskCompletion[] = [
      { id: 'c1', taskId: 'completed', occurrenceKey: '2026-01-01', completedAt: '2026-01-01T00:00:00.000Z' },
    ];
    const ids = sortTaskListEntries(buildTaskListEntries(tasks, completions)).map((e) => e.task.id);
    expect(ids.indexOf('overdue')).toBeLessThan(ids.indexOf('upcoming'));
    expect(ids.indexOf('upcoming')).toBeLessThan(ids.indexOf('noDueDate'));
    expect(ids.indexOf('noDueDate')).toBeLessThan(ids.indexOf('completed'));
  });

  it('within the same state, higher priority sorts first', () => {
    const tasks = [task({ id: 'low', dueDate: undefined, priority: 'low' }), task({ id: 'high', dueDate: undefined, priority: 'high' })];
    const ids = sortTaskListEntries(buildTaskListEntries(tasks, [])).map((e) => e.task.id);
    expect(ids).toEqual(['high', 'low']);
  });

  it('within the same occurrence date, higher priority sorts first', () => {
    const tasks = [
      task({ id: 'low', dueDate: '2026-01-01', priority: 'low' }),
      task({ id: 'high', dueDate: '2026-01-01', priority: 'high' }),
    ];
    const ids = sortTaskListEntries(buildTaskListEntries(tasks, [])).map((e) => e.task.id);
    expect(ids).toEqual(['high', 'low']);
  });
});

describe('filterTaskListEntries', () => {
  it('"all" returns every entry unchanged', () => {
    const tasks = [task({ id: 'a', dueDate: undefined })];
    const entries = buildTaskListEntries(tasks, []);
    expect(filterTaskListEntries(entries, 'all')).toHaveLength(1);
  });

  it('filters down to exactly the requested state', () => {
    const tasks = [task({ id: 'a', dueDate: undefined }), task({ id: 'b', dueDate: '2020-01-01' })];
    const entries = buildTaskListEntries(tasks, []);
    expect(filterTaskListEntries(entries, 'noDueDate').map((e) => e.task.id)).toEqual(['a']);
    expect(filterTaskListEntries(entries, 'overdue').map((e) => e.task.id)).toEqual(['b']);
  });
});
