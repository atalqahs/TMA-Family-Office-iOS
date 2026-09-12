import { describe, expect, it } from 'vitest';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { buildTaskNotifications } from '../../src/features/notifications/sources/taskNotifications';
import type { Task, TaskCompletion, TaskGroup } from '../../src/features/tasks/types';

/**
 * Permanent Phase 10 regression suite -- Section AB (Task Group, 7 items),
 * explicitly required to be "tested explicitly": archiving a TaskGroup
 * must NEVER cascade to its Tasks, and Tasks/completions/recurrence/
 * Notifications must behave identically whether their group is active or
 * archived.
 */

const NOW = '2026-01-01T00:00:00.000Z';

function group(overrides: Partial<TaskGroup> = {}): TaskGroup {
  return { id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW, ...overrides };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    groupId: 'g1',
    title: 'Renew registration',
    priority: 'normal',
    recurrenceUnit: 'none',
    dueDate: '2026-01-01',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('TaskGroup: archive/unarchive lifecycle', () => {
  it('archiving a group sets ONLY its own archivedAt -- name/notes/timestamps untouched', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.archiveTaskGroup('g1');

    const archived = await taskRepository.getTaskGroup('g1');
    expect(archived?.archivedAt).toBeDefined();
    expect({ ...archived, archivedAt: undefined }).toEqual({ ...group(), archivedAt: undefined });
  });

  it('an archived group is excluded from listTaskGroups() (the top-level active Groups list)', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.archiveTaskGroup('g1');

    expect((await taskRepository.listTaskGroups()).map((g) => g.id)).not.toContain('g1');
  });

  it('an archived group is STILL included in listAllTaskGroups() -- the read path Archive uses', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.archiveTaskGroup('g1');

    expect((await taskRepository.listAllTaskGroups()).map((g) => g.id)).toContain('g1');
  });

  it('unarchiving fully removes archivedAt and returns the group to the active top-level list, never duplicated', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.archiveTaskGroup('g1');
    await taskRepository.unarchiveTaskGroup('g1');

    const restored = await taskRepository.getTaskGroup('g1');
    expect(restored).not.toHaveProperty('archivedAt');
    expect((await taskRepository.listTaskGroups()).map((g) => g.id)).toEqual(['g1']);
  });

  it('permanently deleting an empty group (Phase 11: real delete, no Trash) removes it from both listTaskGroups() and listAllTaskGroups()', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.archiveTaskGroup('g1');
    await taskRepository.deleteTaskGroupIfEmpty('g1');

    expect((await taskRepository.listTaskGroups()).map((g) => g.id)).not.toContain('g1');
    expect((await taskRepository.listAllTaskGroups()).map((g) => g.id)).not.toContain('g1');
    expect(await taskRepository.getTaskGroup('g1')).toBeUndefined();
  });

  it('archiving a group NEVER auto-archives, hides, or deletes its Tasks -- every Task remains fully visible via listTasks()', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.saveTaskWithGroupGuard(task());
    await taskRepository.archiveTaskGroup('g1');

    const tasks = await taskRepository.listTasks();
    expect(tasks.map((t) => t.id)).toContain('t1');
    expect(tasks[0]).not.toHaveProperty('archivedAt'); // Task itself never gained the field -- archive applies to the GROUP only
  });

  it('completing an occurrence of a Task in an archived group works exactly as normal -- recurrence/history is unaffected by the group archive state', async () => {
    await taskRepository.saveTaskGroup(group());
    await taskRepository.saveTaskWithGroupGuard(task({ recurrenceUnit: 'month', recurrenceInterval: 1 }));
    await taskRepository.archiveTaskGroup('g1');

    await taskRepository.completeTaskOccurrence({
      id: 'c1',
      taskId: 't1',
      occurrenceKey: '2026-01-01',
      completedAt: NOW,
    });

    const completions = await taskRepository.listCompletionsForTask('t1');
    expect(completions).toHaveLength(1);
    expect(completions[0].occurrenceKey).toBe('2026-01-01');
  });
});

describe('Notifications regression: a Task in an archived group still produces its normal Notification (Section AB x Section Z)', () => {
  it('buildTaskNotifications does not receive/consult TaskGroup at all -- Tasks are structurally independent of their group archive state', async () => {
    await taskRepository.saveTaskGroup(group({ archivedAt: NOW }));
    const overdueTask = task({ dueDate: '2020-01-01' }); // deep in the past -- guaranteed overdue
    await taskRepository.saveTaskWithGroupGuard(overdueTask);

    const tasks = await taskRepository.listTasks();
    const completions: TaskCompletion[] = [];
    const items = buildTaskNotifications(tasks, completions, new Date('2026-06-01'));

    expect(items.some((item) => item.sourceId === 't1')).toBe(true);
  });
});
