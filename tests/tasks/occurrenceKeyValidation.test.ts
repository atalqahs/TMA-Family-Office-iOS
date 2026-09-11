import { beforeEach, describe, expect, it } from 'vitest';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { completeTaskOccurrence } from '../../src/features/tasks/taskService';
import { UNSCHEDULED_OCCURRENCE_KEY } from '../../src/features/tasks/types';

/**
 * Phase 9A, Section I: `completeTaskOccurrence` previously verified only
 * that the task exists — it never checked that `occurrenceKey` is an
 * actually-actionable occurrence of that task's own schedule (only the
 * unique `(taskId, occurrenceKey)` DB index prevented a second completion
 * of the SAME key; nothing prevented completing a nonsense key in the
 * first place). This permanent suite locks in the HARDENED contract added
 * to close that gap: the service now validates `occurrenceKey` against
 * the task's own dueDate/recurrence schedule (see `isValidOccurrenceKey`
 * in taskService.ts, which reuses taskRecurrence.ts's existing
 * `getOccurrenceDatesInRange` rather than duplicating any recurrence math)
 * and rejects anything that doesn't belong to it, via
 * `InvalidTaskOccurrenceError`.
 */
beforeEach(async () => {
  await taskRepository.saveTaskGroup({
    id: 'g1',
    name: 'Home',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
});

describe('occurrenceKey hardening: invalid-occurrence rejection', () => {
  it('rejects an arbitrary future date that is not on a weekly recurring schedule', async () => {
    const task = await import('../../src/features/tasks/taskService').then((m) =>
      m.createTask({
        groupId: 'g1',
        title: 'Weekly bins',
        priority: 'normal',
        recurrenceUnit: 'week',
        recurrenceInterval: 1,
        dueDate: '2026-01-01', // Thursdays
      }),
    );
    // 2026-01-02 is a real calendar date but NOT one of this task's weekly
    // occurrences (which fall on 2026-01-01, 01-08, 01-15, ...).
    await expect(completeTaskOccurrence(task.id, '2026-01-02')).rejects.toThrow(/valid occurrence/i);
  });

  it('rejects the UNSCHEDULED sentinel on a DATED task', async () => {
    const { createTask } = await import('../../src/features/tasks/taskService');
    const task = await createTask({
      groupId: 'g1',
      title: 'Dated one-time task',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-01-01',
    });
    await expect(completeTaskOccurrence(task.id, UNSCHEDULED_OCCURRENCE_KEY)).rejects.toThrow(/valid occurrence/i);
  });

  it('rejects a real calendar-date key on an UNDATED one-time task', async () => {
    const { createTask } = await import('../../src/features/tasks/taskService');
    const task = await createTask({
      groupId: 'g1',
      title: 'Undated general reminder',
      priority: 'normal',
      recurrenceUnit: 'none',
    });
    await expect(completeTaskOccurrence(task.id, '2026-01-01')).rejects.toThrow(/valid occurrence/i);
  });

  it('rejects a date strictly BEFORE the recurring task’s own anchor date', async () => {
    const { createTask } = await import('../../src/features/tasks/taskService');
    const task = await createTask({
      groupId: 'g1',
      title: 'Monthly',
      priority: 'normal',
      recurrenceUnit: 'month',
      recurrenceInterval: 1,
      dueDate: '2026-06-01',
    });
    await expect(completeTaskOccurrence(task.id, '2026-01-01')).rejects.toThrow(/valid occurrence/i);
  });

  it('STILL accepts every legitimate occurrence — the hardening never breaks a valid existing flow', async () => {
    const { createTask } = await import('../../src/features/tasks/taskService');

    const oneTimeUndated = await createTask({ groupId: 'g1', title: 'A', priority: 'normal', recurrenceUnit: 'none' });
    await expect(completeTaskOccurrence(oneTimeUndated.id, UNSCHEDULED_OCCURRENCE_KEY)).resolves.toBeDefined();

    const oneTimeDated = await createTask({
      groupId: 'g1',
      title: 'B',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-03-01',
    });
    await expect(completeTaskOccurrence(oneTimeDated.id, '2026-03-01')).resolves.toBeDefined();

    const recurring = await createTask({
      groupId: 'g1',
      title: 'C',
      priority: 'normal',
      recurrenceUnit: 'month',
      recurrenceInterval: 1,
      dueDate: '2026-01-01',
    });
    await expect(completeTaskOccurrence(recurring.id, '2026-01-01')).resolves.toBeDefined();
    await expect(completeTaskOccurrence(recurring.id, '2026-02-01')).resolves.toBeDefined();
  });

  it('a nonexistent task is still reported as "not found", not as an occurrence-validity error', async () => {
    await expect(completeTaskOccurrence('does-not-exist', '2026-01-01')).rejects.toThrow(/not found/i);
  });
});
