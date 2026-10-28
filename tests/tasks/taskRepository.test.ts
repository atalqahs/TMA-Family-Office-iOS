import { describe, expect, it } from 'vitest';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { GroupNotEmptyError } from '../../src/features/tasks/taskRepository';
import { completeTaskOccurrence, createTask, DuplicateTaskOccurrenceError, removeTask } from '../../src/features/tasks/taskService';
import { UNSCHEDULED_OCCURRENCE_KEY } from '../../src/features/tasks/types';
import type { Task, TaskGroup } from '../../src/features/tasks/types';

function group(overrides: Partial<TaskGroup> = {}): TaskGroup {
  return {
    id: 'g1',
    name: 'Home',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Groups: atomic group-existence guard on Task save', () => {
  it('saving a task against a real group succeeds', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({ groupId: 'g1', title: 'Renew registration', priority: 'normal', recurrenceUnit: 'none' });
    expect(task.groupId).toBe('g1');
  });

  it('saving a task against a NONEXISTENT group is rejected and creates no orphan Task record', async () => {
    await expect(
      createTask({ groupId: 'does-not-exist', title: 'Orphan', priority: 'normal', recurrenceUnit: 'none' }),
    ).rejects.toThrow(/not found/i);
    expect(await taskRepository.listTasks()).toEqual([]);
  });
});

describe('Groups: deleteTaskGroupIfEmpty', () => {
  it('deletes a group with zero tasks', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.deleteTaskGroupIfEmpty('g1');
    expect(await taskRepository.getTaskGroup('g1')).toBeUndefined();
  });

  it('refuses to delete a group that still has tasks, and never touches those tasks', async () => {
    await taskRepository.saveTaskGroup(group());
    await createTask({ groupId: 'g1', title: 'Task', priority: 'normal', recurrenceUnit: 'none' });

    await expect(taskRepository.deleteTaskGroupIfEmpty('g1')).rejects.toThrow(GroupNotEmptyError);

    expect(await taskRepository.getTaskGroup('g1')).toBeDefined();
    expect(await taskRepository.listTasks()).toHaveLength(1);
  });
});

describe('Completion: atomic existence-guard + duplicate rejection', () => {
  it('completing an occurrence of a real task succeeds', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({ groupId: 'g1', title: 'Task', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-01-01' });
    const completion = await completeTaskOccurrence(task.id, '2026-01-01');
    expect(completion.taskId).toBe(task.id);
    expect(completion.occurrenceKey).toBe('2026-01-01');
  });

  it('completing an occurrence of a NONEXISTENT task is rejected', async () => {
    await expect(completeTaskOccurrence('does-not-exist', '2026-01-01')).rejects.toThrow(/not found/i);
  });

  it('a second completion for the SAME (taskId, occurrenceKey) is rejected atomically', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({ groupId: 'g1', title: 'Task', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-01-01' });
    await completeTaskOccurrence(task.id, '2026-01-01');
    await expect(completeTaskOccurrence(task.id, '2026-01-01')).rejects.toThrow(DuplicateTaskOccurrenceError);
  });

  it('an undated one-time task is completed via the UNSCHEDULED sentinel key', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({ groupId: 'g1', title: 'General reminder', priority: 'normal', recurrenceUnit: 'none' });
    const completion = await completeTaskOccurrence(task.id, UNSCHEDULED_OCCURRENCE_KEY);
    expect(completion.occurrenceKey).toBe(UNSCHEDULED_OCCURRENCE_KEY);
  });

  it('different tasks may each independently use the same occurrenceKey (uniqueness is scoped per-task)', async () => {
    await taskRepository.saveTaskGroup(group());
    const taskA = await createTask({ groupId: 'g1', title: 'A', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-01-01' });
    const taskB = await createTask({ groupId: 'g1', title: 'B', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-01-01' });
    await expect(completeTaskOccurrence(taskA.id, '2026-01-01')).resolves.toBeDefined();
    await expect(completeTaskOccurrence(taskB.id, '2026-01-01')).resolves.toBeDefined();
  });
});

describe('Delete cascade: removeTask removes every completion for it, and nothing else', () => {
  it('deletes the task and all of its completion history atomically', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({ groupId: 'g1', title: 'Recurring', priority: 'normal', recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-01-01' });
    await completeTaskOccurrence(task.id, '2026-01-01');
    await completeTaskOccurrence(task.id, '2026-02-01');

    await removeTask(task.id);

    expect(await taskRepository.getTask(task.id)).toBeUndefined();
    expect(await taskRepository.listCompletionsForTask(task.id)).toEqual([]);
  });

  it('never touches another task’s completions', async () => {
    await taskRepository.saveTaskGroup(group());
    const taskA = await createTask({ groupId: 'g1', title: 'A', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-01-01' });
    const taskB = await createTask({ groupId: 'g1', title: 'B', priority: 'normal', recurrenceUnit: 'none', dueDate: '2026-01-01' });
    await completeTaskOccurrence(taskB.id, '2026-01-01');

    await removeTask(taskA.id);

    expect(await taskRepository.listCompletionsForTask(taskB.id)).toHaveLength(1);
  });
});

describe('Independence: a Task record carries no cross-module fields at all', () => {
  it('a saved Task has no linkedEntityType/linkedEntityId property, regardless of how it is constructed', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({ groupId: 'g1', title: 'Task', priority: 'normal', recurrenceUnit: 'none' });
    expect(task).not.toHaveProperty('linkedEntityType');
    expect(task).not.toHaveProperty('linkedEntityId');
    const stored = (await taskRepository.getTask(task.id)) as Task;
    expect(stored).not.toHaveProperty('linkedEntityType');
    expect(stored).not.toHaveProperty('linkedEntityId');
  });
});

describe('Responsible person: assignedToName is a plain, unvalidated free-text label', () => {
  it('persists assignedToName exactly as given, with no relationship to any other module', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({
      groupId: 'g1',
      title: 'Task',
      priority: 'normal',
      recurrenceUnit: 'none',
      assignedToName: 'السائق',
    });
    const stored = await taskRepository.getTask(task.id);
    expect(stored?.assignedToName).toBe('السائق');
  });

  it('a task with no assignedToName at all is perfectly valid', async () => {
    await taskRepository.saveTaskGroup(group());
    const task = await createTask({ groupId: 'g1', title: 'Task', priority: 'normal', recurrenceUnit: 'none' });
    expect(task.assignedToName).toBeUndefined();
  });
});
