import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday } from '../../../utils/localDate';
import { DuplicateSalaryOccurrenceError } from '../staffService';
import type { StaffSalaryPayment, StaffSalaryPaymentFormValues } from '../types';
import { validateSalaryPaymentForm } from '../validation';
import './SalaryPaymentForm.css';

interface SalaryPaymentFormProps {
  /** The occurrence being confirmed/edited — fixed, shown as read-only context (not editable: it identifies WHICH due date this payment is for). */
  dueDate: string;
  /** Default amount when confirming a new occurrence (the schedule's amount); ignored once `initialValue` is set (the saved amount wins). */
  defaultAmount?: number;
  initialValue?: StaffSalaryPayment;
  onSubmit: (values: StaffSalaryPaymentFormValues) => Promise<void>;
  onCancel: () => void;
}

interface SalaryPaymentFormState {
  amount: string;
  paidDate: string;
  notes: string;
}

function toFormState(payment?: StaffSalaryPayment, defaultAmount?: number): SalaryPaymentFormState {
  return {
    amount: payment?.amount !== undefined ? String(payment.amount) : defaultAmount !== undefined ? String(defaultAmount) : '',
    paidDate: payment?.paidDate ?? getLocalToday(),
    notes: payment?.notes ?? '',
  };
}

function toFormValues(state: SalaryPaymentFormState): StaffSalaryPaymentFormValues {
  return {
    amount: state.amount.trim() ? Number(state.amount) : Number.NaN,
    paidDate: state.paidDate,
    notes: state.notes.trim() || undefined,
  };
}

export function SalaryPaymentForm({ dueDate, defaultAmount, initialValue, onSubmit, onCancel }: SalaryPaymentFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const [state, setState] = useState<SalaryPaymentFormState>(() => toFormState(initialValue, defaultAmount));
  const [errors, setErrors] = useState<ReturnType<typeof validateSalaryPaymentForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof SalaryPaymentFormState>(key: K, value: SalaryPaymentFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateSalaryPaymentForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof DuplicateSalaryOccurrenceError) {
        setSubmitError(t('validationDuplicateSalaryOccurrence'));
      } else {
        console.error('Failed to save salary payment', err);
        setSubmitError(t('formSaveError'));
      }
      setSubmitting(false);
    }
  };

  const dueDateLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${dueDate}T00:00:00`),
  );

  return (
    <form className="salary-payment-form" onSubmit={handleSubmit} noValidate>
      <p className="salary-payment-form__context">
        {t('salaryOccurrenceDueLabel')}: {dueDateLabel}
      </p>

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

      <FormField
        label={t('fieldPaidDate')}
        htmlFor={`${formId}-paidDate`}
        error={errors.paidDate && t(errors.paidDate)}
      >
        <input
          id={`${formId}-paidDate`}
          className="form-input"
          type="date"
          value={state.paidDate}
          onChange={(e) => update('paidDate', e.target.value)}
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
        <p className="salary-payment-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="salary-payment-form__actions">
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
