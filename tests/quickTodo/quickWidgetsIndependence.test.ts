import { describe, expect, it } from 'vitest';
import { loadCalendarEvents } from '../../src/features/calendar/calendarService';
import { loadNotifications } from '../../src/features/notifications/notificationService';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import { createQuickNote, removeQuickNote, updateQuickNoteText } from '../../src/features/quickNotes/quickNotesService';
import {
  createQuickTodoItem,
  removeQuickTodoItem,
  toggleQuickTodoItemCompleted,
} from '../../src/features/quickTodo/quickTodoService';
import { getGridRange } from '../../src/utils/monthGrid';
import { getLocalYearMonth } from '../../src/utils/localDate';

/**
 * Regression coverage for the spec's "Critical Independence Rules"
 * (Section 4): Quick To-Do items and Quick Notes must never appear in
 * the General Calendar, must never generate Notifications, and must
 * never modify existing Tasks/Task Groups data.
 */
describe('Quick To-Do List / Quick Notes: independence from structured modules', () => {
  it('never appear in the General Calendar, however many items/notes exist', async () => {
    await createQuickTodoItem('Get a haircut');
    await createQuickTodoItem('Refuel the car');
    await createQuickNote('The driver needs something for his vehicle');
    await createQuickNote('A family member might travel soon');

    const { start, end } = getGridRange(getLocalYearMonth());
    expect(await loadCalendarEvents(start, end)).toEqual([]);
  });

  it('never generate Notifications, however many items/notes exist', async () => {
    const item = await createQuickTodoItem('Buy groceries');
    await toggleQuickTodoItemCompleted(item.id);
    await createQuickNote('General household observation');

    expect(await loadNotifications()).toEqual([]);
  });

  it('creating, toggling, and deleting Quick To-Do items never touches any existing TaskGroup', async () => {
    await taskRepository.saveTaskGroup({
      id: 'g1',
      name: 'Household',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const before = await taskRepository.getTaskGroup('g1');

    const item = await createQuickTodoItem('Pick up an item');
    await toggleQuickTodoItemCompleted(item.id);
    await removeQuickTodoItem(item.id);

    const after = await taskRepository.getTaskGroup('g1');
    expect(after).toEqual(before);
    expect(await taskRepository.listTasks()).toEqual([]);
  });

  it('creating, editing, and deleting Quick Notes never touches any existing TaskGroup or Task', async () => {
    await taskRepository.saveTaskGroup({
      id: 'g1',
      name: 'Household',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const before = await taskRepository.getTaskGroup('g1');

    const note = await createQuickNote('Idea for later');
    await updateQuickNoteText(note.id, 'A better idea for later');
    await removeQuickNote(note.id);

    const after = await taskRepository.getTaskGroup('g1');
    expect(after).toEqual(before);
    expect(await taskRepository.listTasks()).toEqual([]);
  });
});
