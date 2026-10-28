import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import type { FamilyMember } from '../../family/types';
import type { HealthProfileFormValues } from '../types';
import { validateHealthProfileForm } from '../validation';
import { HealthProfileFields } from './HealthProfileFields';
import './HealthProfileCreateForm.css';

interface HealthProfileCreateFormProps {
  familyMembers: FamilyMember[];
  onSubmit: (familyMemberId: string, values: HealthProfileFormValues) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: HealthProfileFormValues = { healthStatus: 'healthy' };

/**
 * Step 1 of creation (Phase 11 Part 3.A): pick an existing Family Member,
 * then fill in the Health-specific fields. Duplicate prevention (at most
 * one Health profile per Family Member) is enforced by the service layer
 * (`DuplicateHealthProfileError`) -- the caller (HealthPage) catches that
 * and navigates to the existing profile instead of showing a generic
 * error, guiding the user there rather than silently blocking them.
 */
export function HealthProfileCreateForm({ familyMembers, onSubmit, onCancel }: HealthProfileCreateFormProps) {
  const { t } = useLanguage();
  const formId = useId();
  const [familyMemberId, setFamilyMemberId] = useState(familyMembers[0]?.id ?? '');
  const [values, setValues] = useState<HealthProfileFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<ReturnType<typeof validateHealthProfileForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof HealthProfileFormValues>(key: K, value: HealthProfileFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!familyMemberId) return;
    const validationErrors = validateHealthProfileForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(familyMemberId, {
        ...values,
        allergies: values.allergies?.trim() || undefined,
        healthNotes: values.healthNotes?.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to create health profile', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  if (familyMembers.length === 0) {
    return (
      <div className="health-profile-create-form">
        <p className="health-profile-create-form__empty">{t('healthNoFamilyMembersMessage')}</p>
        <div className="health-profile-create-form__actions">
          <SecondaryButton type="button" onClick={onCancel}>
            {t('actionCancel')}
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <form className="health-profile-create-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldSelectFamilyMember')} htmlFor={`${formId}-familyMember`}>
        <select
          id={`${formId}-familyMember`}
          className="form-input"
          value={familyMemberId}
          onChange={(e) => setFamilyMemberId(e.target.value)}
        >
          {familyMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName}
            </option>
          ))}
        </select>
      </FormField>

      <HealthProfileFields values={values} errors={errors} onChange={update} />

      {submitError && (
        <p className="health-profile-create-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="health-profile-create-form__actions">
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
