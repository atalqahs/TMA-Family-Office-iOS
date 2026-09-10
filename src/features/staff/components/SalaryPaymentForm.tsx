import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { DuplicateSalaryMonthError } from '../staffService';
import type { StaffSalaryPayment, StaffSalaryPaymentFormValues } from '../types';
import { validateSalaryPaymentForm } from '../validation';
import './SalaryPaymentForm.css';

interface SalaryPaymentFormProps {
  initialValue?: StaffSalaryPayment;
  /** Prefill for a new payment's amount — the staff member's configured monthlySalary, if any. Ignored when editing (the saved amount wins). */
  defaultAmount?: number;
  onSubmit: (values: StaffSalaryPaymentFormValues) => Promise<void>;
  onCancel: () => void;
}

interface SalaryPaymentFormState {
  salaryMonth: string;
  amount: string;
  paidDate: string;
  notes: string;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function toFormState(payment?: StaffSalaryPayment, defaultAmount?: number): SalaryPaymentFormState {
  return {
    salaryMonth: payment?.salaryMonth ?? currentMonth(),
    amount: payment?.amount !== undefined ? String(payment.amount) : defaultAmount !== undefined ? String(defaultAmount) : '',
    paidDate: payment?.paidDate ?? today(),
    notes: payment?.notes ?? '',
  };
}

function toFormValues(state: SalaryPaymentFormState): StaffSalaryPaymentFormValues {
  return {
    salaryMonth: state.salaryMonth,
    amount: state.amount.trim() ? Number(state.amount) : Number.NaN,
    paidDate: state.paidDate,
    notes: state.notes.trim() || undefined,
  };
}

export function SalaryPaymentForm({ initialValue, defaultAmount, onSubmit, onCancel }: SalaryPaymentFormProps) {
  const { t } = useLanguage();
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
      if (err instanceof DuplicateSalaryMonthError) {
        setSubmitError(t('validationDuplicateSalaryMonth'));
      } else {
        console.error('Failed to save salary payment', err);
        setSubmitError(t('formSaveError'));
      }
      setSubmitting(false);
    }
  };

  return (
    <form className="salary-payment-form" onSubmit={handleSubmit} noValidate>
      <FormField
        label={t('fieldSalaryMonth')}
        htmlFor={`${formId}-salaryMonth`}
        error={errors.salaryMonth && t(errors.salaryMonth)}
      >
        <input
          id={`${formId}-salaryMonth`}
          className="form-input"
          type="month"
          value={state.salaryMonth}
          onChange={(e) => update('salaryMonth', e.target.value)}
          required
        />
      </FormField>

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
