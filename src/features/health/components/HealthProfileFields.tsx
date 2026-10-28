import { useId } from 'react';
import { FormField } from '../../../components/FormField';
import { useLanguage } from '../../../hooks/useLanguage';
import { HEALTH_STATUSES } from '../types';
import type { HealthProfileFormValues } from '../types';
import type { HealthProfileFormErrors } from '../validation';

interface HealthProfileFieldsProps {
  values: HealthProfileFormValues;
  errors: HealthProfileFormErrors;
  onChange: <K extends keyof HealthProfileFormValues>(key: K, value: HealthProfileFormValues[K]) => void;
}

/**
 * The Health-specific fields shared by both the create and edit forms
 * (Phase 11 Part 3.C): status/height/weight/allergies/notes. Never
 * includes any Family identity field -- those are read-only, resolved
 * live from Family (see HealthProfile's own doc comment).
 */
export function HealthProfileFields({ values, errors, onChange }: HealthProfileFieldsProps) {
  const { t, locale } = useLanguage();
  const formId = useId();

  return (
    <>
      <FormField label={t('fieldHealthStatus')} htmlFor={`${formId}-status`}>
        <select
          id={`${formId}-status`}
          className="form-input"
          value={values.healthStatus}
          onChange={(e) => onChange('healthStatus', e.target.value as HealthProfileFormValues['healthStatus'])}
        >
          {HEALTH_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldHeight')} htmlFor={`${formId}-height`} error={errors.height && t(errors.height)}>
        <input
          id={`${formId}-height`}
          className="form-input"
          type="number"
          min="0"
          step="0.1"
          value={values.height ?? ''}
          onChange={(e) => onChange('height', e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </FormField>

      <FormField label={t('fieldWeight')} htmlFor={`${formId}-weight`} error={errors.weight && t(errors.weight)}>
        <input
          id={`${formId}-weight`}
          className="form-input"
          type="number"
          min="0"
          step="0.1"
          value={values.weight ?? ''}
          onChange={(e) => onChange('weight', e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </FormField>

      <FormField label={t('fieldAllergies')} htmlFor={`${formId}-allergies`}>
        <textarea
          id={`${formId}-allergies`}
          className="form-input"
          value={values.allergies ?? ''}
          onChange={(e) => onChange('allergies', e.target.value)}
          rows={2}
        />
      </FormField>

      <FormField label={t('fieldHealthNotes')} htmlFor={`${formId}-notes`}>
        <textarea
          id={`${formId}-notes`}
          className="form-input"
          value={values.healthNotes ?? ''}
          onChange={(e) => onChange('healthNotes', e.target.value)}
          rows={4}
        />
      </FormField>
    </>
  );
}
