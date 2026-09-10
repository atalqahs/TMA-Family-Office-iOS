import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ProfilePhotoPicker } from '../../../components/ProfilePhotoPicker';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { STAFF_ROLES } from '../types';
import type { HouseholdStaff, StaffFormValues, StaffRole } from '../types';
import { validateStaffForm } from '../validation';
import './StaffForm.css';

interface StaffFormProps {
  initialValue?: HouseholdStaff;
  onSubmit: (values: StaffFormValues) => Promise<void>;
  onCancel: () => void;
}

/** All fields live as strings in the form (controlled inputs), converted to HouseholdStaff's real numeric/optional types on submit. */
interface StaffFormState {
  fullName: string;
  role: StaffRole | '';
  nationality: string;
  dateOfBirth: string;
  civilId: string;
  passportNumber: string;
  phone: string;
  employmentStartDate: string;
  civilIdExpiry: string;
  passportExpiry: string;
  residencyExpiry: string;
  monthlySalary: string;
  notes: string;
  profilePhoto?: Blob;
}

function toFormState(staff?: HouseholdStaff): StaffFormState {
  return {
    fullName: staff?.fullName ?? '',
    role: staff?.role ?? '',
    nationality: staff?.nationality ?? '',
    dateOfBirth: staff?.dateOfBirth ?? '',
    civilId: staff?.civilId ?? '',
    passportNumber: staff?.passportNumber ?? '',
    phone: staff?.phone ?? '',
    employmentStartDate: staff?.employmentStartDate ?? '',
    civilIdExpiry: staff?.civilIdExpiry ?? '',
    passportExpiry: staff?.passportExpiry ?? '',
    residencyExpiry: staff?.residencyExpiry ?? '',
    monthlySalary: staff?.monthlySalary !== undefined ? String(staff.monthlySalary) : '',
    notes: staff?.notes ?? '',
    profilePhoto: staff?.profilePhoto,
  };
}

function toFormValues(state: StaffFormState): StaffFormValues {
  return {
    fullName: state.fullName.trim(),
    role: state.role || undefined,
    nationality: state.nationality.trim() || undefined,
    dateOfBirth: state.dateOfBirth || undefined,
    civilId: state.civilId.trim() || undefined,
    passportNumber: state.passportNumber.trim() || undefined,
    phone: state.phone.trim() || undefined,
    employmentStartDate: state.employmentStartDate || undefined,
    civilIdExpiry: state.civilIdExpiry || undefined,
    passportExpiry: state.passportExpiry || undefined,
    residencyExpiry: state.residencyExpiry || undefined,
    monthlySalary: state.monthlySalary.trim() ? Number(state.monthlySalary) : undefined,
    notes: state.notes.trim() || undefined,
    profilePhoto: state.profilePhoto,
  };
}

const TODAY = new Date().toISOString().slice(0, 10);

export function StaffForm({ initialValue, onSubmit, onCancel }: StaffFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const [state, setState] = useState<StaffFormState>(() => toFormState(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateStaffForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof StaffFormState>(key: K, value: StaffFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateStaffForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to save staff member', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="staff-form" onSubmit={handleSubmit} noValidate>
      <ProfilePhotoPicker
        name={state.fullName || t('appName')}
        photo={state.profilePhoto}
        onChange={(photo) => update('profilePhoto', photo)}
      />

      <FormField
        label={t('fieldFullName')}
        htmlFor={`${formId}-fullName`}
        error={errors.fullName && t(errors.fullName)}
      >
        <input
          id={`${formId}-fullName`}
          className="form-input"
          type="text"
          value={state.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldRole')} htmlFor={`${formId}-role`}>
        <select
          id={`${formId}-role`}
          className="form-input"
          value={state.role}
          onChange={(e) => update('role', e.target.value as StaffRole | '')}
        >
          <option value="">{t('staffRoleUnspecified')}</option>
          {STAFF_ROLES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('fieldNationality')} htmlFor={`${formId}-nationality`}>
        <input
          id={`${formId}-nationality`}
          className="form-input"
          type="text"
          value={state.nationality}
          onChange={(e) => update('nationality', e.target.value)}
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
          value={state.dateOfBirth}
          onChange={(e) => update('dateOfBirth', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldCivilId')} htmlFor={`${formId}-civilId`}>
        <input
          id={`${formId}-civilId`}
          className="form-input"
          type="text"
          value={state.civilId}
          onChange={(e) => update('civilId', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldCivilIdExpiry')} htmlFor={`${formId}-civilIdExpiry`}>
        <input
          id={`${formId}-civilIdExpiry`}
          className="form-input"
          type="date"
          value={state.civilIdExpiry}
          onChange={(e) => update('civilIdExpiry', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPassportNumber')} htmlFor={`${formId}-passportNumber`}>
        <input
          id={`${formId}-passportNumber`}
          className="form-input"
          type="text"
          value={state.passportNumber}
          onChange={(e) => update('passportNumber', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPassportExpiry')} htmlFor={`${formId}-passportExpiry`}>
        <input
          id={`${formId}-passportExpiry`}
          className="form-input"
          type="date"
          value={state.passportExpiry}
          onChange={(e) => update('passportExpiry', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldResidencyExpiry')} htmlFor={`${formId}-residencyExpiry`}>
        <input
          id={`${formId}-residencyExpiry`}
          className="form-input"
          type="date"
          value={state.residencyExpiry}
          onChange={(e) => update('residencyExpiry', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPhone')} htmlFor={`${formId}-phone`}>
        <input
          id={`${formId}-phone`}
          className="form-input"
          type="tel"
          value={state.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldEmploymentStartDate')} htmlFor={`${formId}-employmentStartDate`}>
        <input
          id={`${formId}-employmentStartDate`}
          className="form-input"
          type="date"
          value={state.employmentStartDate}
          onChange={(e) => update('employmentStartDate', e.target.value)}
        />
      </FormField>

      <FormField
        label={t('fieldMonthlySalary')}
        htmlFor={`${formId}-monthlySalary`}
        error={errors.monthlySalary && t(errors.monthlySalary)}
      >
        <input
          id={`${formId}-monthlySalary`}
          className="form-input"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.001"
          value={state.monthlySalary}
          onChange={(e) => update('monthlySalary', e.target.value)}
        />
      </FormField>

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
        <p className="staff-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="staff-form__actions">
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
