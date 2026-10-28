import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday } from '../../../utils/localDate';
import type { SalaryRecurrence, StaffSalarySchedule, StaffSalaryScheduleFormValues } from '../types';
import { validateSalaryScheduleForm } from '../validation';
import './SalaryScheduleForm.css';

interface SalaryScheduleFormProps {
  initialValue?: StaffSalarySchedule;
  defaultAmount?: number;
  onSubmit: (values: StaffSalaryScheduleFormValues) => Promise<void>;
  onCancel: () => void;
}

interface ScheduleFormState {
  amount: string;
  recurrence: SalaryRecurrence;
  startDate: string;
  endDate: string;
  notes: string;
}

function toFormState(schedule?: StaffSalarySchedule, defaultAmount?: number): ScheduleFormState {
  return {
    amount: schedule?.amount !== undefined ? String(schedule.amount) : defaultAmount !== undefined ? String(defaultAmount) : '',
    recurrence: schedule?.recurrence ?? 'monthly',
    startDate: schedule?.startDate ?? getLocalToday(),
    endDate: schedule?.endDate ?? '',
    notes: schedule?.notes ?? '',
  };
}

function toFormValues(state: ScheduleFormState): StaffSalaryScheduleFormValues {
  return {
    amount: state.amount.trim() ? Number(state.amount) : Number.NaN,
    recurrence: state.recurrence,
    startDate: state.startDate,
    endDate: state.endDate || undefined,
    notes: state.notes.trim() || undefined,
  };
}

/**
 * Phase 10.1 simplification: exactly three recurrence choices
 * (weekly/monthly/yearly), `startDate` as the ONLY anchor -- no separate
 * "repeats every N" interval and no separate due-day/due-month fields.
 */
export function SalaryScheduleForm({ initialValue, defaultAmount, onSubmit, onCancel }: SalaryScheduleFormProps) {
  const { t } = useLanguage();
  const formId = useId();
  const [state, setState] = useState<ScheduleFormState>(() => toFormState(initialValue, defaultAmount));
  const [errors, setErrors] = useState<ReturnType<typeof validateSalaryScheduleForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateSalaryScheduleForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to save salary schedule', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="salary-schedule-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldAmount')} htmlFor={`${formId}-amount`} error={errors.amount && t(errors.amount)}>
        <input
          id={`${formId}-amount`}
          className="form-input"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.001"
          value={state.amount}
          onChange={(e) => update('amount', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldRecurrence')} htmlFor={`${formId}-recurrence`}>
        <select
          id={`${formId}-recurrence`}
          className="form-input"
          value={state.recurrence}
          onChange={(e) => update('recurrence', e.target.value as SalaryRecurrence)}
        >
          <option value="weekly">{t('recurrenceWeekly')}</option>
          <option value="monthly">{t('recurrenceMonthly')}</option>
          <option value="yearly">{t('recurrenceYearly')}</option>
        </select>
      </FormField>

      <FormField
        label={t('fieldStartDate')}
        htmlFor={`${formId}-startDate`}
        error={errors.startDate && t(errors.startDate)}
      >
        <input
          id={`${formId}-startDate`}
          className="form-input"
          type="date"
          value={state.startDate}
          onChange={(e) => update('startDate', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldEndDateOptional')} htmlFor={`${formId}-endDate`} error={errors.endDate && t(errors.endDate)}>
        <input
          id={`${formId}-endDate`}
          className="form-input"
          type="date"
          value={state.endDate}
          onChange={(e) => update('endDate', e.target.value)}
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
        <p className="salary-schedule-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="salary-schedule-form__actions">
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
