import type { TranslationKey } from '../../localization/translations';
import { MAX_RECURRENCE_INTERVAL } from './types';
import type { TaskFormValues, TaskGroupFormValues } from './types';

export interface TaskFormErrors {
  title?: TranslationKey;
  groupId?: TranslationKey;
  dueDate?: TranslationKey;
  recurrenceInterval?: TranslationKey;
  linkedEntityId?: TranslationKey;
}

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'validationTaskTitleRequired';
  }
  if (!values.groupId) {
    errors.groupId = 'validationTaskGroupRequired';
  }
  if (!values.dueDate) {
    errors.dueDate = 'validationTaskDueDateRequired';
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
  if (values.linkedEntityType && !values.linkedEntityId) {
    errors.linkedEntityId = 'validationLinkedEntityRequired';
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
