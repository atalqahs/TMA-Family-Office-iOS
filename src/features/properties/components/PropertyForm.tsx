import { useId, useState, type FormEvent } from 'react';
import { CoverPhotoPicker } from '../../../components/CoverPhotoPicker';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '../types';
import type { Property, PropertyFormValues, PropertyStatus, PropertyType } from '../types';
import { validatePropertyForm } from '../validation';
import './PropertyForm.css';

interface PropertyFormProps {
  initialValue?: Property;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  onCancel: () => void;
}

function toFormValues(property?: Property): PropertyFormValues {
  return {
    name: property?.name ?? '',
    type: property?.type ?? 'other',
    status: property?.status ?? 'other',
    country: property?.country ?? '',
    city: property?.city ?? '',
    area: property?.area ?? '',
    block: property?.block ?? '',
    street: property?.street ?? '',
    avenue: property?.avenue ?? '',
    houseNumber: property?.houseNumber ?? '',
    propertyNumber: property?.propertyNumber ?? '',
    notes: property?.notes ?? '',
    coverPhoto: property?.coverPhoto,
  };
}

export function PropertyForm({ initialValue, onSubmit, onCancel }: PropertyFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const [values, setValues] = useState<PropertyFormValues>(() => toFormValues(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validatePropertyForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validatePropertyForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        country: values.country?.trim() || undefined,
        city: values.city?.trim() || undefined,
        area: values.area?.trim() || undefined,
        block: values.block?.trim() || undefined,
        street: values.street?.trim() || undefined,
        avenue: values.avenue?.trim() || undefined,
        houseNumber: values.houseNumber?.trim() || undefined,
        propertyNumber: values.propertyNumber?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to save property', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="property-form" onSubmit={handleSubmit} noValidate>
      <CoverPhotoPicker photo={values.coverPhoto} onChange={(photo) => update('coverPhoto', photo)} />

      <FormField label={t('fieldPropertyName')} htmlFor={`${formId}-name`} error={errors.name && t(errors.name)}>
        <input
          id={`${formId}-name`}
          className="form-input"
          type="text"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldPropertyType')} htmlFor={`${formId}-type`}>
        <select
          id={`${formId}-type`}
          className="form-input"
          value={values.type}
          onChange={(e) => update('type', e.target.value as PropertyType)}
        >
          {PROPERTY_TYPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldPropertyStatus')} htmlFor={`${formId}-status`}>
        <select
          id={`${formId}-status`}
          className="form-input"
          value={values.status}
          onChange={(e) => update('status', e.target.value as PropertyStatus)}
        >
          {PROPERTY_STATUSES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldCountry')} htmlFor={`${formId}-country`}>
        <input
          id={`${formId}-country`}
          className="form-input"
          type="text"
          value={values.country ?? ''}
          onChange={(e) => update('country', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldCity')} htmlFor={`${formId}-city`}>
        <input
          id={`${formId}-city`}
          className="form-input"
          type="text"
          value={values.city ?? ''}
          onChange={(e) => update('city', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldArea')} htmlFor={`${formId}-area`}>
        <input
          id={`${formId}-area`}
          className="form-input"
          type="text"
          value={values.area ?? ''}
          onChange={(e) => update('area', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldBlock')} htmlFor={`${formId}-block`}>
        <input
          id={`${formId}-block`}
          className="form-input"
          type="text"
          value={values.block ?? ''}
          onChange={(e) => update('block', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldStreet')} htmlFor={`${formId}-street`}>
        <input
          id={`${formId}-street`}
          className="form-input"
          type="text"
          value={values.street ?? ''}
          onChange={(e) => update('street', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldAvenue')} htmlFor={`${formId}-avenue`}>
        <input
          id={`${formId}-avenue`}
          className="form-input"
          type="text"
          value={values.avenue ?? ''}
          onChange={(e) => update('avenue', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldHouseNumber')} htmlFor={`${formId}-houseNumber`}>
        <input
          id={`${formId}-houseNumber`}
          className="form-input"
          type="text"
          value={values.houseNumber ?? ''}
          onChange={(e) => update('houseNumber', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPropertyNumber')} htmlFor={`${formId}-propertyNumber`}>
        <input
          id={`${formId}-propertyNumber`}
          className="form-input"
          type="text"
          value={values.propertyNumber ?? ''}
          onChange={(e) => update('propertyNumber', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldNotes')} htmlFor={`${formId}-notes`}>
        <textarea
          id={`${formId}-notes`}
          className="form-input"
          value={values.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          rows={4}
        />
      </FormField>

      {submitError && (
        <p className="property-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="property-form__actions">
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
