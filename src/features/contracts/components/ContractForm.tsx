import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { useLinkableEntities } from '../hooks/useLinkableEntities';
import { CONTRACT_CURRENCIES, CONTRACT_TYPES } from '../types';
import type { Contract, ContractCurrency, ContractFormValues, ContractLinkedEntityType, ContractType } from '../types';
import { validateContractForm } from '../validation';
import { LinkedEntityFields } from './LinkedEntityFields';
import './ContractForm.css';

interface ContractFormProps {
  initialValue?: Contract;
  onSubmit: (values: ContractFormValues) => Promise<void>;
  onCancel: () => void;
}

/** All fields live as strings in the form (controlled inputs), converted to Contract's real numeric/optional types on submit. */
interface ContractFormState {
  title: string;
  contractType: ContractType;
  contractNumber: string;
  partyName: string;
  startDate: string;
  endDate: string;
  amount: string;
  currency: ContractCurrency | '';
  linkedEntityType: ContractLinkedEntityType | '';
  linkedEntityId: string;
  notes: string;
}

function toFormState(contract?: Contract): ContractFormState {
  return {
    title: contract?.title ?? '',
    contractType: contract?.contractType ?? 'other',
    contractNumber: contract?.contractNumber ?? '',
    partyName: contract?.partyName ?? '',
    startDate: contract?.startDate ?? '',
    endDate: contract?.endDate ?? '',
    amount: contract?.amount !== undefined ? String(contract.amount) : '',
    currency: contract?.currency ?? '',
    linkedEntityType: contract?.linkedEntityType ?? '',
    linkedEntityId: contract?.linkedEntityId ?? '',
    notes: contract?.notes ?? '',
  };
}

function toFormValues(state: ContractFormState): ContractFormValues {
  return {
    title: state.title.trim(),
    contractType: state.contractType,
    contractNumber: state.contractNumber.trim() || undefined,
    partyName: state.partyName.trim(),
    startDate: state.startDate,
    endDate: state.endDate || undefined,
    amount: state.amount.trim() ? Number(state.amount) : undefined,
    currency: state.currency || undefined,
    linkedEntityType: state.linkedEntityType || undefined,
    linkedEntityId: state.linkedEntityType ? state.linkedEntityId || undefined : undefined,
    notes: state.notes.trim() || undefined,
  };
}

export function ContractForm({ initialValue, onSubmit, onCancel }: ContractFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const { entities, loading: entitiesLoading } = useLinkableEntities();
  const [state, setState] = useState<ContractFormState>(() => toFormState(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateContractForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateContractForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to save contract', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="contract-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldContractTitle')} htmlFor={`${formId}-title`} error={errors.title && t(errors.title)}>
        <input
          id={`${formId}-title`}
          className="form-input"
          type="text"
          value={state.title}
          onChange={(e) => update('title', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldContractType')} htmlFor={`${formId}-type`}>
        <select
          id={`${formId}-type`}
          className="form-input"
          value={state.contractType}
          onChange={(e) => update('contractType', e.target.value as ContractType)}
        >
          {CONTRACT_TYPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldContractNumber')} htmlFor={`${formId}-number`}>
        <input
          id={`${formId}-number`}
          className="form-input"
          type="text"
          value={state.contractNumber}
          onChange={(e) => update('contractNumber', e.target.value)}
        />
      </FormField>

      <FormField
        label={t('fieldPartyName')}
        htmlFor={`${formId}-party`}
        error={errors.partyName && t(errors.partyName)}
      >
        <input
          id={`${formId}-party`}
          className="form-input"
          type="text"
          value={state.partyName}
          onChange={(e) => update('partyName', e.target.value)}
          required
        />
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

      <FormField
        label={t('fieldEndDateOptional')}
        htmlFor={`${formId}-endDate`}
        error={errors.endDate && t(errors.endDate)}
      >
        <input
          id={`${formId}-endDate`}
          className="form-input"
          type="date"
          value={state.endDate}
          onChange={(e) => update('endDate', e.target.value)}
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
        />
      </FormField>

      <FormField label={t('fieldCurrency')} htmlFor={`${formId}-currency`}>
        <select
          id={`${formId}-currency`}
          className="form-input"
          value={state.currency}
          onChange={(e) => update('currency', e.target.value as ContractCurrency | '')}
        >
          <option value="">{t('currencyUnspecifiedLabel')}</option>
          {CONTRACT_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </FormField>

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
        <p className="contract-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="contract-form__actions">
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
