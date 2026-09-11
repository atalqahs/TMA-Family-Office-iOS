import { describe, expect, it } from 'vitest';
import { validateTaskForm, validateTaskGroupForm } from '../../src/features/tasks/validation';
import type { TaskFormValues } from '../../src/features/tasks/types';

function values(overrides: Partial<TaskFormValues> = {}): TaskFormValues {
  return {
    groupId: 'g1',
    title: 'Renew registration',
    priority: 'normal',
    recurrenceUnit: 'none',
    ...overrides,
  };
}

describe('validateTaskForm: independence from other modules', () => {
  it('has no linkedEntity-related error at all — TaskFormErrors carries no such field', () => {
    const errors = validateTaskForm(values());
    expect(errors).not.toHaveProperty('linkedEntityId');
    expect(errors).not.toHaveProperty('linkedEntityType');
  });

  it('assignedToName is accepted as plain free text with no validation against it', () => {
    const errors = validateTaskForm(values({ assignedToName: 'anything at all, not a real person' }));
    expect(errors).toEqual({});
  });
});

describe('validateTaskForm: optional due date / required group', () => {
  it('requires a title', () => {
    expect(validateTaskForm(values({ title: '  ' })).title).toBe('validationTaskTitleRequired');
  });

  it('requires a groupId — no ungrouped tasks', () => {
    expect(validateTaskForm(values({ groupId: '' })).groupId).toBe('validationTaskGroupRequired');
  });

  it('a one-time task with no dueDate is valid (undated general reminder)', () => {
    expect(validateTaskForm(values({ dueDate: undefined, recurrenceUnit: 'none' })).dueDate).toBeUndefined();
  });

  it('a recurring task REQUIRES a dueDate as its anchor', () => {
    expect(validateTaskForm(values({ dueDate: undefined, recurrenceUnit: 'month', recurrenceInterval: 1 })).dueDate).toBe(
      'validationTaskDueDateRequired',
    );
  });

  it('dueTime without dueDate is rejected regardless of recurrence', () => {
    expect(validateTaskForm(values({ dueDate: undefined, dueTime: '09:00' })).dueTime).toBe(
      'validationDueTimeRequiresDueDate',
    );
  });

  it('dueTime alongside a real dueDate is valid', () => {
    expect(validateTaskForm(values({ dueDate: '2026-01-01', dueTime: '09:00' })).dueTime).toBeUndefined();
  });

  it('rejects a recurrenceInterval of 0 or negative', () => {
    expect(
      validateTaskForm(values({ dueDate: '2026-01-01', recurrenceUnit: 'day', recurrenceInterval: 0 })).recurrenceInterval,
    ).toBe('validationTaskRecurrenceIntervalInvalid');
  });

  it('rejects a recurrenceInterval above MAX_RECURRENCE_INTERVAL', () => {
    expect(
      validateTaskForm(values({ dueDate: '2026-01-01', recurrenceUnit: 'day', recurrenceInterval: 1000 })).recurrenceInterval,
    ).toBe('validationTaskRecurrenceIntervalInvalid');
  });

  it('accepts a valid recurring task with all required fields', () => {
    expect(validateTaskForm(values({ dueDate: '2026-01-01', recurrenceUnit: 'week', recurrenceInterval: 2 }))).toEqual({});
  });
});

describe('validateTaskGroupForm', () => {
  it('requires a non-blank name', () => {
    expect(validateTaskGroupForm({ name: '   ' }).name).toBe('validationTaskGroupNameRequired');
    expect(validateTaskGroupForm({ name: 'Home' })).toEqual({});
  });
});
