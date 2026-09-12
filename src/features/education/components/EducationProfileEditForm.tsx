import { useState, type FormEvent } from 'react';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import type { EducationProfile, EducationProfileFormValues } from '../types';
import { validateEducationProfileForm } from '../validation';
import { EducationProfileFields } from './EducationProfileFields';
import './EducationProfileEditForm.css';

interface EducationProfileEditFormProps {
  initialValue: EducationProfile;
  onSubmit: (values: EducationProfileFormValues) => Promise<void>;
  onCancel: () => void;
}

function toFormValues(profile: EducationProfile): EducationProfileFormValues {
  return {
    educationStage: profile.educationStage,
    institution: profile.institution ?? '',
    gradeOrYear: profile.gradeOrYear ?? '',
    specialization: profile.specialization ?? '',
    educationStatus: profile.educationStatus,
    notes: profile.notes ?? '',
  };
}

/** Edits Education-specific fields only -- never the linked Family Member (Phase 11 Part 4.F: Family remains the source of truth for identity data). */
export function EducationProfileEditForm({ initialValue, onSubmit, onCancel }: EducationProfileEditFormProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<EducationProfileFormValues>(() => toFormValues(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateEducationProfileForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof EducationProfileFormValues>(key: K, value: EducationProfileFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateEducationProfileForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        ...values,
        educationStage: values.educationStage.trim(),
        institution: values.institution?.trim() || undefined,
        gradeOrYear: values.gradeOrYear?.trim() || undefined,
        specialization: values.specialization?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to update education profile', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="education-profile-edit-form" onSubmit={handleSubmit} noValidate>
      <EducationProfileFields values={values} errors={errors} onChange={update} />

      {submitError && (
        <p className="education-profile-edit-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="education-profile-edit-form__actions">
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
