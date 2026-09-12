import { describe, expect, it } from 'vitest';
import { DB_VERSION } from '../../src/storage/db';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import * as taskService from '../../src/features/tasks/taskService';
import { computeTaskOccurrenceStatus } from '../../src/features/tasks/taskStatus';
import { buildTaskNotifications } from '../../src/features/notifications/sources/taskNotifications';
import type { Task } from '../../src/features/tasks/types';

const NOW = '2026-01-01T00:00:00.000Z';

function task(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    groupId: 'g1',
    title: 'A task',
    priority: 'normal',
    recurrenceUnit: 'none',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/**
 * Permanent Phase 10.2 regression suite -- covering the "NON-RECURRING
 * TASK COMPLETION", "RECURRING TASK COMPLETION", "NOTIFICATIONS
 * REGRESSION PROTECTION", and "REGRESSION" spec sections (items #5-7,
 * #10-14, #17-21, #25-28). None of this phase's changes touch
 * TaskCompletion storage, recurrence math, or Notification source logic
 * -- these tests prove that directly, independent of the UI-removal
 * tests in completedUiRemoval.test.tsx.
 */
describe('NON-RECURRING task completion (data layer)', () => {
  it('5. completing a one-time task creates a real, permanent TaskCompletion record', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard(task({ dueDate: '2026-06-01' }));

    await taskService.completeTaskOccurrence('t1', '2026-06-01');

    const completions = await taskRepository.listCompletionsForTask('t1');
    expect(completions).toHaveLength(1);
    expect(completions[0].occurrenceKey).toBe('2026-06-01');
  });

  it('6. a completed one-time task stays hidden (state stays "completed") across a simulated reload -- never reappears as active', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard(task({ dueDate: '2026-06-01' }));
    await taskService.completeTaskOccurrence('t1', '2026-06-01');

    // Simulate a fresh reload: re-fetch everything from IndexedDB from scratch.
    const reloadedTask = await taskRepository.getTask('t1');
    const reloadedCompletions = await taskRepository.listCompletionsForTask('t1');
    const status = computeTaskOccurrenceStatus(reloadedTask!, reloadedCompletions, new Date('2026-06-15'));
    expect(status.state).toBe('completed');
    expect(reloadedTask).not.toHaveProperty('completed'); // never mutates the Task itself to mark it "done"
  });

  it('7. a completed one-time task does not generate a Notification', () => {
    const completed = task({ dueDate: '2026-06-01' });
    const items = buildTaskNotifications(
      [completed],
      [{ id: 'c1', taskId: 't1', occurrenceKey: '2026-06-01', completedAt: NOW }],
      new Date('2026-07-01'),
    );
    expect(items).toEqual([]);
  });
});

describe('RECURRING task completion (data layer)', () => {
  it('10. completing the current occurrence preserves the recurring Task itself', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard(
      task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-09-15' }),
    );

    await taskService.completeTaskOccurrence('t1', '2026-09-15');

    const stillExists = await taskRepository.getTask('t1');
    expect(stillExists).toBeDefined();
    expect(stillExists?.recurrenceUnit).toBe('month'); // never converted to a one-time task
  });

  it('11. the completion record for the recurring occurrence remains permanently stored', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard(
      task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-09-15' }),
    );
    await taskService.completeTaskOccurrence('t1', '2026-09-15');

    const completions = await taskRepository.listCompletionsForTask('t1');
    expect(completions.map((c) => c.occurrenceKey)).toContain('2026-09-15');
  });

  it('12. the completed recurring occurrence itself does not notify', () => {
    const recurring = task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-09-15' });
    const items = buildTaskNotifications(
      [recurring],
      [{ id: 'c1', taskId: 't1', occurrenceKey: '2026-09-15', completedAt: NOW }],
      new Date('2026-09-20'),
    );
    // The September occurrence is completed; October hasn't arrived yet
    // (today is still September) -- nothing should notify right now.
    expect(items).toEqual([]);
  });

  it('13. the NEXT occurrence still derives correctly (15/09 completed -> next is 15/10)', () => {
    const recurring = task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-09-15' });
    const status = computeTaskOccurrenceStatus(
      recurring,
      [{ occurrenceKey: '2026-09-15' }],
      new Date('2026-10-01'),
    );
    expect(status.occurrenceDate).toBe('2026-10-15');
  });

  it('14. the next occurrence can later notify normally once it becomes due/overdue', () => {
    const recurring = task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-09-15' });
    const items = buildTaskNotifications(
      [recurring],
      [{ id: 'c1', taskId: 't1', occurrenceKey: '2026-09-15', completedAt: NOW }],
      new Date('2026-10-20'), // October 15 has passed -> overdue
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'task:t1:2026-10-15', kind: 'taskOverdue' });
  });
});

describe('Notifications regression protection (items #17-21)', () => {
  it('17. an overdue uncompleted occurrence still notifies', () => {
    const items = buildTaskNotifications([task({ dueDate: '2026-06-01' })], [], new Date('2026-06-15'));
    expect(items[0]).toMatchObject({ kind: 'taskOverdue', severity: 'critical' });
  });

  it('18. a due-today uncompleted occurrence still notifies', () => {
    const items = buildTaskNotifications([task({ dueDate: '2026-06-15' })], [], new Date('2026-06-15'));
    expect(items[0]).toMatchObject({ kind: 'taskDueToday', severity: 'warning' });
  });

  it('19. a completed occurrence does not notify', () => {
    const items = buildTaskNotifications(
      [task({ dueDate: '2026-06-01' })],
      [{ id: 'c1', taskId: 't1', occurrenceKey: '2026-06-01', completedAt: NOW }],
      new Date('2026-06-15'),
    );
    expect(items).toEqual([]);
  });

  it('20. a future recurring occurrence remains eligible to notify later', () => {
    const recurring = task({ recurrenceUnit: 'month', recurrenceInterval: 1, dueDate: '2026-06-01' });
    // Not yet due -- no notification today...
    expect(buildTaskNotifications([recurring], [], new Date('2026-05-15'))).toEqual([]);
    // ...but the same occurrence notifies once its date arrives.
    expect(buildTaskNotifications([recurring], [], new Date('2026-06-01'))[0]).toMatchObject({ kind: 'taskDueToday' });
  });

  it('21. no duplicate notifications are ever produced for the same task', () => {
    const items = buildTaskNotifications([task({ dueDate: '2026-06-01' })], [], new Date('2026-06-15'));
    const ids = items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Regression (items #25-28)', () => {
  it('25. Archive TaskGroup behavior remains unchanged: archiving a group never hides/alters its Tasks or completions', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard(task({ dueDate: '2026-06-01' }));
    await taskService.completeTaskOccurrence('t1', '2026-06-01');

    await taskRepository.archiveTaskGroup('g1');

    const group = await taskRepository.getTaskGroup('g1');
    expect(group?.archivedAt).toBeDefined();
    expect(await taskRepository.getTask('t1')).toBeDefined();
    expect(await taskRepository.listCompletionsForTask('t1')).toHaveLength(1);
  });

  it('26. TaskCompletion history remains preserved across an edit to the task itself', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Home', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard(task({ dueDate: '2026-06-01' }));
    await taskService.completeTaskOccurrence('t1', '2026-06-01');

    await taskService.updateTask('t1', {
      groupId: 'g1',
      title: 'Renamed task',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-06-01',
    });

    expect(await taskRepository.listCompletionsForTask('t1')).toHaveLength(1);
  });

  it('28. DB_VERSION reflects only intentional schema changes -- this UI-only phase itself required none', () => {
    expect(DB_VERSION).toBe(13);
  });
});
