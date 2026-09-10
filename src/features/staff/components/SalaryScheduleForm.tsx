import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday } from '../../../utils/localDate';
import type { SalaryFrequency, StaffSalarySchedule, StaffSalaryScheduleFormValues } from '../types';
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
  frequency: SalaryFrequency;
  interval: string;
  dueDayOfMonth: string;
  dueMonth: string;
  startDate: string;
  endDate: string;
  notes: string;
}

function toFormState(schedule?: StaffSalarySchedule, defaultAmount?: number): ScheduleFormState {
  const today = getLocalToday();
  return {
    amount: schedule?.amount !== undefined ? String(schedule.amount) : defaultAmount !== undefined ? String(defaultAmount) : '',
    frequency: schedule?.frequency ?? 'month',
    interval: schedule?.interval !== undefined ? String(schedule.interval) : '1',
    dueDayOfMonth: schedule?.dueDayOfMonth !== undefined ? String(schedule.dueDayOfMonth) : String(Number(today.slice(8, 10))),
    dueMonth: schedule?.dueMonth !== undefined ? String(schedule.dueMonth) : String(Number(today.slice(5, 7))),
    startDate: schedule?.startDate ?? today,
    endDate: schedule?.endDate ?? '',
    notes: schedule?.notes ?? '',
  };
}

function toFormValues(state: ScheduleFormState): StaffSalaryScheduleFormValues {
  return {
    amount: state.amount.trim() ? Number(state.amount) : Number.NaN,
    frequency: state.frequency,
    interval: state.interval.trim() ? Number(state.interval) : Number.NaN,
    dueDayOfMonth:
      state.frequency === 'month' || state.frequency === 'year'
        ? state.dueDayOfMonth.trim()
          ? Number(state.dueDayOfMonth)
          : undefined
        : undefined,
    dueMonth: state.frequency === 'year' ? (state.dueMonth.trim() ? Number(state.dueMonth) : undefined) : undefined,
    startDate: state.startDate,
    endDate: state.endDate || undefined,
    notes: state.notes.trim() || undefined,
  };
}

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

      <FormField label={t('fieldRepeatsEvery')} htmlFor={`${formId}-interval`} error={errors.interval && t(errors.interval)}>
        <div className="salary-schedule-form__repeat-row">
          <input
            id={`${formId}-interval`}
            className="form-input salary-schedule-form__interval-input"
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            value={state.interval}
            onChange={(e) => update('interval', e.target.value)}
            required
          />
          <select
            className="form-input"
            value={state.frequency}
            onChange={(e) => update('frequency', e.target.value as SalaryFrequency)}
          >
            <option value="day">{t('frequencyDay')}</option>
            <option value="month">{t('frequencyMonth')}</option>
            <option value="year">{t('frequencyYear')}</option>
          </select>
        </div>
      </FormField>

      {(state.frequency === 'month' || state.frequency === 'year') && (
        <FormField
          label={t('fieldDueDayOfMonth')}
          htmlFor={`${formId}-dueDay`}
          error={errors.dueDayOfMonth && t(errors.dueDayOfMonth)}
        >
          <input
            id={`${formId}-dueDay`}
            className="form-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            step="1"
            value={state.dueDayOfMonth}
            onChange={(e) => update('dueDayOfMonth', e.target.value)}
            required
          />
        </FormField>
      )}

      {state.frequency === 'year' && (
        <FormField
          label={t('fieldDueMonth')}
          htmlFor={`${formId}-dueMonth`}
          error={errors.dueMonth && t(errors.dueMonth)}
        >
          <input
            id={`${formId}-dueMonth`}
            className="form-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            step="1"
            value={state.dueMonth}
            onChange={(e) => update('dueMonth', e.target.value)}
            required
          />
        </FormField>
      )}

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
