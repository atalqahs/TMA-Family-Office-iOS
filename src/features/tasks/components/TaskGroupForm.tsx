import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import type { TaskGroup, TaskGroupFormValues } from '../types';
import { validateTaskGroupForm } from '../validation';
import './TaskGroupForm.css';

interface TaskGroupFormProps {
  initialValue?: TaskGroup;
  onSubmit: (values: TaskGroupFormValues) => Promise<void>;
  onCancel: () => void;
}

interface TaskGroupFormState {
  name: string;
  notes: string;
}

function toFormState(group?: TaskGroup): TaskGroupFormState {
  return { name: group?.name ?? '', notes: group?.notes ?? '' };
}

function toFormValues(state: TaskGroupFormState): TaskGroupFormValues {
  return { name: state.name.trim(), notes: state.notes.trim() || undefined };
}

export function TaskGroupForm({ initialValue, onSubmit, onCancel }: TaskGroupFormProps) {
  const { t } = useLanguage();
  const formId = useId();
  const [state, setState] = useState<TaskGroupFormState>(() => toFormState(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateTaskGroupForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof TaskGroupFormState>(key: K, value: TaskGroupFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateTaskGroupForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to save task group', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="task-group-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldGroupName')} htmlFor={`${formId}-name`} error={errors.name && t(errors.name)}>
        <input
          id={`${formId}-name`}
          className="form-input"
          type="text"
          value={state.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldNotes')} htmlFor={`${formId}-notes`}>
        <textarea
          id={`${formId}-notes`}
          className="form-input"
          value={state.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={3}
        />
      </FormField>

      {submitError && (
        <p className="task-group-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="task-group-form__actions">
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
