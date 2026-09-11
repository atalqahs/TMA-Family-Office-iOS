import type { TranslationKey } from '../../localization/translations';
import { MAX_RECURRENCE_INTERVAL } from './types';
import type { TaskFormValues, TaskGroupFormValues } from './types';

export interface TaskFormErrors {
  title?: TranslationKey;
  groupId?: TranslationKey;
  dueDate?: TranslationKey;
  dueTime?: TranslationKey;
  recurrenceInterval?: TranslationKey;
}

/**
 * Due date/time rules (see types.ts's Task doc comment for the product
 * reasoning):
 * - dueDate is optional for a one-time task (an undated general reminder
 *   is valid) but REQUIRED once recurrenceUnit !== 'none', since
 *   recurrence needs a real anchor date to compute from.
 * - dueTime may only be set alongside a dueDate -- a time without a date
 *   is meaningless and is rejected outright, regardless of recurrence.
 */
export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'validationTaskTitleRequired';
  }
  if (!values.groupId) {
    errors.groupId = 'validationTaskGroupRequired';
  }
  if (!values.dueDate && values.recurrenceUnit !== 'none') {
    errors.dueDate = 'validationTaskDueDateRequired';
  }
  if (values.dueTime && !values.dueDate) {
    errors.dueTime = 'validationDueTimeRequiresDueDate';
  }
  if (values.recurrenceUnit !== 'none') {
    const interval = values.recurrenceInterval;
    if (
      interval === undefined ||
      !Number.isInteger(interval) ||
      interval < 1 ||
      interval > MAX_RECURRENCE_INTERVAL
    ) {
      errors.recurrenceInterval = 'validationTaskRecurrenceIntervalInvalid';
    }
  }

  return errors;
}

export interface TaskGroupFormErrors {
  name?: TranslationKey;
}

export function validateTaskGroupForm(values: TaskGroupFormValues): TaskGroupFormErrors {
  const errors: TaskGroupFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'validationTaskGroupNameRequired';
  }

  return errors;
}
