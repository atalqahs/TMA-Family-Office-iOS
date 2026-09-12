import { useState, type FormEvent } from 'react';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import type { HealthProfile, HealthProfileFormValues } from '../types';
import { validateHealthProfileForm } from '../validation';
import { HealthProfileFields } from './HealthProfileFields';
import './HealthProfileEditForm.css';

interface HealthProfileEditFormProps {
  initialValue: HealthProfile;
  onSubmit: (values: HealthProfileFormValues) => Promise<void>;
  onCancel: () => void;
}

function toFormValues(profile: HealthProfile): HealthProfileFormValues {
  return {
    healthStatus: profile.healthStatus,
    height: profile.height,
    weight: profile.weight,
    allergies: profile.allergies ?? '',
    healthNotes: profile.healthNotes ?? '',
  };
}

/** Edits Health-specific fields only -- never the linked Family Member (Phase 11 Part 3.F: Family remains the source of truth for identity data). */
export function HealthProfileEditForm({ initialValue, onSubmit, onCancel }: HealthProfileEditFormProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<HealthProfileFormValues>(() => toFormValues(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateHealthProfileForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof HealthProfileFormValues>(key: K, value: HealthProfileFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateHealthProfileForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        ...values,
        allergies: values.allergies?.trim() || undefined,
        healthNotes: values.healthNotes?.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to update health profile', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="health-profile-edit-form" onSubmit={handleSubmit} noValidate>
      <HealthProfileFields values={values} errors={errors} onChange={update} />

      {submitError && (
        <p className="health-profile-edit-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="health-profile-edit-form__actions">
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
