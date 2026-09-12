import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ProfilePhotoPicker } from '../../../components/ProfilePhotoPicker';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday } from '../../../utils/localDate';
import { findFamilyMembersByCivilId } from '../familyRepository';
import { BLOOD_TYPES } from '../types';
import type { FamilyMember, FamilyMemberFormValues } from '../types';
import { validateFamilyMemberForm } from '../validation';
import './FamilyMemberForm.css';

interface FamilyMemberFormProps {
  initialValue?: FamilyMember;
  onSubmit: (values: FamilyMemberFormValues) => Promise<void>;
  onCancel: () => void;
}

function toFormValues(member?: FamilyMember): FamilyMemberFormValues {
  return {
    fullName: member?.fullName ?? '',
    relationship: member?.relationship ?? '',
    dateOfBirth: member?.dateOfBirth ?? '',
    nationality: member?.nationality ?? '',
    civilId: member?.civilId ?? '',
    civilIdExpiryDate: member?.civilIdExpiryDate ?? '',
    passportExpiryDate: member?.passportExpiryDate ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    bloodType: member?.bloodType,
    notes: member?.notes ?? '',
    profilePhoto: member?.profilePhoto,
  };
}

const TODAY = getLocalToday();

export function FamilyMemberForm({ initialValue, onSubmit, onCancel }: FamilyMemberFormProps) {
  const { t } = useLanguage();
  const formId = useId();
  const [values, setValues] = useState<FamilyMemberFormValues>(() => toFormValues(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateFamilyMemberForm>>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof FamilyMemberFormValues>(key: K, value: FamilyMemberFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCivilIdBlur = async () => {
    const civilId = values.civilId?.trim();
    if (!civilId) {
      setDuplicateWarning(false);
      return;
    }
    try {
      const matches = await findFamilyMembersByCivilId(civilId, initialValue?.id);
      setDuplicateWarning(matches.length > 0);
    } catch (err) {
      console.error('Failed to check for duplicate Civil ID', err);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateFamilyMemberForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        ...values,
        fullName: values.fullName.trim(),
        relationship: values.relationship?.trim() || undefined,
        nationality: values.nationality?.trim() || undefined,
        civilId: values.civilId?.trim() || undefined,
        civilIdExpiryDate: values.civilIdExpiryDate || undefined,
        passportExpiryDate: values.passportExpiryDate || undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
      });
    } catch (err) {
      console.error('Failed to save family member', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="family-member-form" onSubmit={handleSubmit} noValidate>
      <ProfilePhotoPicker
        name={values.fullName || t('appName')}
        photo={values.profilePhoto}
        onChange={(photo) => update('profilePhoto', photo)}
      />

      <FormField label={t('fieldFullName')} htmlFor={`${formId}-fullName`} error={errors.fullName && t(errors.fullName)}>
        <input
          id={`${formId}-fullName`}
          className="form-input"
          type="text"
          value={values.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldRelationship')} htmlFor={`${formId}-relationship`}>
        <input
          id={`${formId}-relationship`}
          className="form-input"
          type="text"
          value={values.relationship ?? ''}
          onChange={(e) => update('relationship', e.target.value)}
        />
      </FormField>

      <FormField
        label={t('fieldDateOfBirth')}
        htmlFor={`${formId}-dob`}
        error={errors.dateOfBirth && t(errors.dateOfBirth)}
      >
        <input
          id={`${formId}-dob`}
          className="form-input"
          type="date"
          max={TODAY}
          value={values.dateOfBirth ?? ''}
          onChange={(e) => update('dateOfBirth', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldNationality')} htmlFor={`${formId}-nationality`}>
        <input
          id={`${formId}-nationality`}
          className="form-input"
          type="text"
          value={values.nationality ?? ''}
          onChange={(e) => update('nationality', e.target.value)}
        />
      </FormField>

      <FormField
        label={t('fieldCivilId')}
        htmlFor={`${formId}-civilId`}
        hint={duplicateWarning ? t('validationDuplicateCivilId') : undefined}
      >
        <input
          id={`${formId}-civilId`}
          className="form-input"
          type="text"
          value={values.civilId ?? ''}
          onChange={(e) => {
            update('civilId', e.target.value);
            setDuplicateWarning(false);
          }}
          onBlur={handleCivilIdBlur}
        />
      </FormField>

      <FormField label={t('fieldCivilIdExpiryDate')} htmlFor={`${formId}-civilIdExpiryDate`}>
        <input
          id={`${formId}-civilIdExpiryDate`}
          className="form-input"
          type="date"
          value={values.civilIdExpiryDate ?? ''}
          onChange={(e) => update('civilIdExpiryDate', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPassportExpiryDate')} htmlFor={`${formId}-passportExpiryDate`}>
        <input
          id={`${formId}-passportExpiryDate`}
          className="form-input"
          type="date"
          value={values.passportExpiryDate ?? ''}
          onChange={(e) => update('passportExpiryDate', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPhone')} htmlFor={`${formId}-phone`}>
        <input
          id={`${formId}-phone`}
          className="form-input"
          type="tel"
          value={values.phone ?? ''}
          onChange={(e) => update('phone', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldEmail')} htmlFor={`${formId}-email`} error={errors.email && t(errors.email)}>
        <input
          id={`${formId}-email`}
          className="form-input"
          type="email"
          value={values.email ?? ''}
          onChange={(e) => update('email', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldBloodType')} htmlFor={`${formId}-bloodType`}>
        <select
          id={`${formId}-bloodType`}
          className="form-input"
          value={values.bloodType ?? ''}
          onChange={(e) => update('bloodType', (e.target.value || undefined) as FamilyMemberFormValues['bloodType'])}
        >
          <option value="">{t('bloodTypeUnknown')}</option>
          {BLOOD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
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
        <p className="family-member-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="family-member-form__actions">
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
