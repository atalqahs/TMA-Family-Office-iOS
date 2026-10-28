import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import type { FamilyMember } from '../../family/types';
import type { EducationProfileFormValues } from '../types';
import { validateEducationProfileForm } from '../validation';
import { EducationProfileFields } from './EducationProfileFields';
import './EducationProfileCreateForm.css';

interface EducationProfileCreateFormProps {
  familyMembers: FamilyMember[];
  onSubmit: (familyMemberId: string, values: EducationProfileFormValues) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: EducationProfileFormValues = { educationStage: '', educationStatus: 'currentlyStudying' };

/**
 * Step 1 of creation (Phase 11 Part 4.A): pick an existing Family Member,
 * then fill in the Education-specific fields. Duplicate prevention (at
 * most one Education profile per Family Member) is enforced by the
 * service layer (`DuplicateEducationProfileError`) -- the caller
 * (EducationPage) catches that and navigates to the existing profile
 * instead of showing a generic error.
 */
export function EducationProfileCreateForm({ familyMembers, onSubmit, onCancel }: EducationProfileCreateFormProps) {
  const { t } = useLanguage();
  const formId = useId();
  const [familyMemberId, setFamilyMemberId] = useState(familyMembers[0]?.id ?? '');
  const [values, setValues] = useState<EducationProfileFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<ReturnType<typeof validateEducationProfileForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof EducationProfileFormValues>(key: K, value: EducationProfileFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!familyMemberId) return;
    const validationErrors = validateEducationProfileForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(familyMemberId, {
        ...values,
        educationStage: values.educationStage.trim(),
        institution: values.institution?.trim() || undefined,
        gradeOrYear: values.gradeOrYear?.trim() || undefined,
        specialization: values.specialization?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to create education profile', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  if (familyMembers.length === 0) {
    return (
      <div className="education-profile-create-form">
        <p className="education-profile-create-form__empty">{t('educationNoFamilyMembersMessage')}</p>
        <div className="education-profile-create-form__actions">
          <SecondaryButton type="button" onClick={onCancel}>
            {t('actionCancel')}
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <form className="education-profile-create-form" onSubmit={handleSubmit} noValidate>
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

      <EducationProfileFields values={values} errors={errors} onChange={update} />

      {submitError && (
        <p className="education-profile-create-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="education-profile-create-form__actions">
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
