import { describe, expect, it } from 'vitest';
import {
  computeOccurrenceDateState,
  computeTaskOccurrenceStatus,
  groupCompletionsByTaskId,
  TASK_STATE_URGENCY_RANK,
} from '../../src/features/tasks/taskStatus';
import type { Task, TaskCompletion } from '../../src/features/tasks/types';

const TODAY = new Date(2026, 5, 15); // local June 15, 2026

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    groupId: 'g1',
    title: 'Renew registration',
    priority: 'normal',
    recurrenceUnit: 'none',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeOccurrenceDateState: the five TaskState outcomes', () => {
  it('completed takes priority over everything else', () => {
    expect(computeOccurrenceDateState('2020-01-01', true, '2026-06-15')).toBe('completed');
    expect(computeOccurrenceDateState(undefined, true, '2026-06-15')).toBe('completed');
  });

  it('an undefined date (undated task) is noDueDate when not completed', () => {
    expect(computeOccurrenceDateState(undefined, false, '2026-06-15')).toBe('noDueDate');
  });

  it('a past date is overdue', () => {
    expect(computeOccurrenceDateState('2026-06-14', false, '2026-06-15')).toBe('overdue');
  });

  it('exactly today is dueToday', () => {
    expect(computeOccurrenceDateState('2026-06-15', false, '2026-06-15')).toBe('dueToday');
  });

  it('a future date is upcoming', () => {
    expect(computeOccurrenceDateState('2026-06-16', false, '2026-06-15')).toBe('upcoming');
  });
});

describe('TASK_STATE_URGENCY_RANK ordering', () => {
  it('ranks overdue < dueToday < upcoming < noDueDate < completed', () => {
    expect(TASK_STATE_URGENCY_RANK.overdue).toBeLessThan(TASK_STATE_URGENCY_RANK.dueToday);
    expect(TASK_STATE_URGENCY_RANK.dueToday).toBeLessThan(TASK_STATE_URGENCY_RANK.upcoming);
    expect(TASK_STATE_URGENCY_RANK.upcoming).toBeLessThan(TASK_STATE_URGENCY_RANK.noDueDate);
    expect(TASK_STATE_URGENCY_RANK.noDueDate).toBeLessThan(TASK_STATE_URGENCY_RANK.completed);
  });
});

describe('computeTaskOccurrenceStatus: end-to-end derivation', () => {
  it('an undated one-time task is noDueDate until its single occurrence is completed', () => {
    const t = task({ dueDate: undefined });
    expect(computeTaskOccurrenceStatus(t, [], TODAY).state).toBe('noDueDate');
  });

  it('an undated one-time task becomes completed once its UNSCHEDULED occurrence has a completion', () => {
    const t = task({ dueDate: undefined });
    const completions: Pick<TaskCompletion, 'occurrenceKey'>[] = [{ occurrenceKey: 'unscheduled' }];
    expect(computeTaskOccurrenceStatus(t, completions, TODAY).state).toBe('completed');
  });

  it('a dated one-time task in the past with no completion is overdue', () => {
    const t = task({ dueDate: '2026-01-01' });
    expect(computeTaskOccurrenceStatus(t, [], TODAY).state).toBe('overdue');
  });

  it('a recurring monthly task correctly reflects the oldest uncompleted occurrence as overdue', () => {
    const t = task({ dueDate: '2026-01-01', recurrenceUnit: 'month', recurrenceInterval: 1 });
    const completions: Pick<TaskCompletion, 'occurrenceKey'>[] = [
      { occurrenceKey: '2026-01-01' },
      { occurrenceKey: '2026-02-01' },
    ];
    const status = computeTaskOccurrenceStatus(t, completions, TODAY);
    expect(status.occurrenceKey).toBe('2026-03-01');
    expect(status.state).toBe('overdue');
  });
});

describe('groupCompletionsByTaskId', () => {
  it('groups multiple completions under their own task and keeps unrelated tasks separate', () => {
    const completions: TaskCompletion[] = [
      { id: 'c1', taskId: 'a', occurrenceKey: '2026-01-01', completedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'c2', taskId: 'a', occurrenceKey: '2026-02-01', completedAt: '2026-02-01T00:00:00.000Z' },
      { id: 'c3', taskId: 'b', occurrenceKey: 'unscheduled', completedAt: '2026-01-01T00:00:00.000Z' },
    ];
    const grouped = groupCompletionsByTaskId(completions);
    expect(grouped.get('a')).toHaveLength(2);
    expect(grouped.get('b')).toHaveLength(1);
    expect(grouped.get('missing')).toBeUndefined();
  });
});
