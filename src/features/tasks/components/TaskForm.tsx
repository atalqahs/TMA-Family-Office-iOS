import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { useLinkableEntities } from '../hooks/useLinkableEntities';
import { TASK_PRIORITIES, TASK_RECURRENCE_UNITS } from '../types';
import type { Task, TaskFormValues, TaskLinkedEntityType, TaskPriority, TaskRecurrenceUnit } from '../types';
import { validateTaskForm } from '../validation';
import { LinkedEntityFields } from './LinkedEntityFields';
import './TaskForm.css';

interface TaskFormProps {
  initialValue?: Task;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel: () => void;
}

/** All fields live as strings in the form (controlled inputs), converted to Task's real numeric/optional types on submit. */
interface TaskFormState {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  recurrenceUnit: TaskRecurrenceUnit;
  recurrenceInterval: string;
  linkedEntityType: TaskLinkedEntityType | '';
  linkedEntityId: string;
  notes: string;
}

function toFormState(task?: Task): TaskFormState {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    dueDate: task?.dueDate ?? '',
    dueTime: task?.dueTime ?? '',
    priority: task?.priority ?? 'normal',
    recurrenceUnit: task?.recurrenceUnit ?? 'none',
    recurrenceInterval: task?.recurrenceInterval !== undefined ? String(task.recurrenceInterval) : '1',
    linkedEntityType: task?.linkedEntityType ?? '',
    linkedEntityId: task?.linkedEntityId ?? '',
    notes: task?.notes ?? '',
  };
}

function toFormValues(state: TaskFormState): TaskFormValues {
  return {
    title: state.title.trim(),
    description: state.description.trim() || undefined,
    dueDate: state.dueDate,
    dueTime: state.dueTime || undefined,
    priority: state.priority,
    recurrenceUnit: state.recurrenceUnit,
    recurrenceInterval:
      state.recurrenceUnit !== 'none' && state.recurrenceInterval.trim()
        ? Number(state.recurrenceInterval)
        : undefined,
    linkedEntityType: state.linkedEntityType || undefined,
    linkedEntityId: state.linkedEntityType ? state.linkedEntityId || undefined : undefined,
    notes: state.notes.trim() || undefined,
  };
}

export function TaskForm({ initialValue, onSubmit, onCancel }: TaskFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const { entities, loading: entitiesLoading } = useLinkableEntities();
  const [state, setState] = useState<TaskFormState>(() => toFormState(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateTaskForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateTaskForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to save task', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldTaskTitle')} htmlFor={`${formId}-title`} error={errors.title && t(errors.title)}>
        <input
          id={`${formId}-title`}
          className="form-input"
          type="text"
          value={state.title}
          onChange={(e) => update('title', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldDescription')} htmlFor={`${formId}-description`}>
        <textarea
          id={`${formId}-description`}
          className="form-input"
          value={state.description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
        />
      </FormField>

      <FormField label={t('fieldDueDate')} htmlFor={`${formId}-dueDate`} error={errors.dueDate && t(errors.dueDate)}>
        <input
          id={`${formId}-dueDate`}
          className="form-input"
          type="date"
          value={state.dueDate}
          onChange={(e) => update('dueDate', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldDueTime')} htmlFor={`${formId}-dueTime`}>
        <input
          id={`${formId}-dueTime`}
          className="form-input"
          type="time"
          value={state.dueTime}
          onChange={(e) => update('dueTime', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPriority')} htmlFor={`${formId}-priority`}>
        <select
          id={`${formId}-priority`}
          className="form-input"
          value={state.priority}
          onChange={(e) => update('priority', e.target.value as TaskPriority)}
        >
          {TASK_PRIORITIES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldTaskRepeat')} htmlFor={`${formId}-recurrenceUnit`}>
        <select
          id={`${formId}-recurrenceUnit`}
          className="form-input"
          value={state.recurrenceUnit}
          onChange={(e) => update('recurrenceUnit', e.target.value as TaskRecurrenceUnit)}
        >
          <option value="none">{t('recurrenceNoneLabel')}</option>
          {TASK_RECURRENCE_UNITS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      {state.recurrenceUnit !== 'none' && (
        <FormField
          label={t('frequencyEveryLabel')}
          htmlFor={`${formId}-recurrenceInterval`}
          error={errors.recurrenceInterval && t(errors.recurrenceInterval)}
        >
          <input
            id={`${formId}-recurrenceInterval`}
            className="form-input"
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            value={state.recurrenceInterval}
            onChange={(e) => update('recurrenceInterval', e.target.value)}
            required
          />
        </FormField>
      )}

      <LinkedEntityFields
        idPrefix={formId}
        entities={entities}
        entitiesLoading={entitiesLoading}
        linkedEntityType={state.linkedEntityType}
        onLinkedEntityTypeChange={(type) => update('linkedEntityType', type)}
        linkedEntityId={state.linkedEntityId}
        onLinkedEntityIdChange={(id) => update('linkedEntityId', id)}
        linkedEntityIdError={errors.linkedEntityId && t(errors.linkedEntityId)}
      />

      <FormField label={t('fieldNotes')} htmlFor={`${formId}-notes`}>
        <textarea
          id={`${formId}-notes`}
          className="form-input"
          value={state.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={4}
        />
      </FormField>

      {submitError && (
        <p className="task-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="task-form__actions">
        <SecondaryButton type="button" onClick={onCancel} disabled={submitting}>
          {t('actionCancel')}
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? t('formSaving') : t('actionSave')}
        </PrimaryButton>
      </div>
    </form>
  );
}
