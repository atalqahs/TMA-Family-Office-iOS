import { useId, useState, type FormEvent } from 'react';
import { CoverPhotoPicker } from '../../../components/CoverPhotoPicker';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import type { Vehicle, VehicleFormValues } from '../types';
import { validateVehicleForm } from '../validation';
import './VehicleForm.css';

interface VehicleFormProps {
  initialValue?: Vehicle;
  onSubmit: (values: VehicleFormValues) => Promise<void>;
  onCancel: () => void;
}

/** All fields live as strings in the form (controlled inputs), converted to Vehicle's real numeric/optional types on submit. */
interface VehicleFormState {
  name: string;
  make: string;
  model: string;
  year: string;
  trim: string;
  plateNumber: string;
  vin: string;
  color: string;
  currentMileage: string;
  registrationExpiry: string;
  insuranceExpiry: string;
  notes: string;
  coverPhoto?: Blob;
}

function toFormState(vehicle?: Vehicle): VehicleFormState {
  return {
    name: vehicle?.name ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year !== undefined ? String(vehicle.year) : '',
    trim: vehicle?.trim ?? '',
    plateNumber: vehicle?.plateNumber ?? '',
    vin: vehicle?.vin ?? '',
    color: vehicle?.color ?? '',
    currentMileage: vehicle?.currentMileage !== undefined ? String(vehicle.currentMileage) : '',
    registrationExpiry: vehicle?.registrationExpiry ?? '',
    insuranceExpiry: vehicle?.insuranceExpiry ?? '',
    notes: vehicle?.notes ?? '',
    coverPhoto: vehicle?.coverPhoto,
  };
}

function toFormValues(state: VehicleFormState): VehicleFormValues {
  return {
    name: state.name.trim(),
    make: state.make.trim() || undefined,
    model: state.model.trim() || undefined,
    year: state.year.trim() ? Number(state.year) : undefined,
    trim: state.trim.trim() || undefined,
    plateNumber: state.plateNumber.trim() || undefined,
    vin: state.vin.trim() || undefined,
    color: state.color.trim() || undefined,
    currentMileage: state.currentMileage.trim() ? Number(state.currentMileage) : undefined,
    registrationExpiry: state.registrationExpiry || undefined,
    insuranceExpiry: state.insuranceExpiry || undefined,
    notes: state.notes.trim() || undefined,
    coverPhoto: state.coverPhoto,
  };
}

export function VehicleForm({ initialValue, onSubmit, onCancel }: VehicleFormProps) {
  const { t } = useLanguage();
  const formId = useId();
  const [state, setState] = useState<VehicleFormState>(() => toFormState(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateVehicleForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof VehicleFormState>(key: K, value: VehicleFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateVehicleForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to save vehicle', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="vehicle-form" onSubmit={handleSubmit} noValidate>
      <CoverPhotoPicker photo={state.coverPhoto} onChange={(photo) => update('coverPhoto', photo)} variant="vehicle" />

      <FormField label={t('fieldVehicleName')} htmlFor={`${formId}-name`} error={errors.name && t(errors.name)}>
        <input
          id={`${formId}-name`}
          className="form-input"
          type="text"
          value={state.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('fieldMake')} htmlFor={`${formId}-make`}>
        <input
          id={`${formId}-make`}
          className="form-input"
          type="text"
          value={state.make}
          onChange={(e) => update('make', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldModel')} htmlFor={`${formId}-model`}>
        <input
          id={`${formId}-model`}
          className="form-input"
          type="text"
          value={state.model}
          onChange={(e) => update('model', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldYear')} htmlFor={`${formId}-year`} error={errors.year && t(errors.year)}>
        <input
          id={`${formId}-year`}
          className="form-input"
          type="number"
          inputMode="numeric"
          value={state.year}
          onChange={(e) => update('year', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldTrim')} htmlFor={`${formId}-trim`}>
        <input
          id={`${formId}-trim`}
          className="form-input"
          type="text"
          value={state.trim}
          onChange={(e) => update('trim', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldPlateNumber')} htmlFor={`${formId}-plateNumber`}>
        <input
          id={`${formId}-plateNumber`}
          className="form-input"
          type="text"
          value={state.plateNumber}
          onChange={(e) => update('plateNumber', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldVin')} htmlFor={`${formId}-vin`}>
        <input
          id={`${formId}-vin`}
          className="form-input"
          type="text"
          value={state.vin}
          onChange={(e) => update('vin', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldColor')} htmlFor={`${formId}-color`}>
        <input
          id={`${formId}-color`}
          className="form-input"
          type="text"
          value={state.color}
          onChange={(e) => update('color', e.target.value)}
        />
      </FormField>

      <FormField
        label={t('fieldCurrentMileage')}
        htmlFor={`${formId}-mileage`}
        error={errors.currentMileage && t(errors.currentMileage)}
      >
        <input
          id={`${formId}-mileage`}
          className="form-input"
          type="number"
          inputMode="numeric"
          min={0}
          value={state.currentMileage}
          onChange={(e) => update('currentMileage', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldRegistrationExpiry')} htmlFor={`${formId}-registrationExpiry`}>
        <input
          id={`${formId}-registrationExpiry`}
          className="form-input"
          type="date"
          value={state.registrationExpiry}
          onChange={(e) => update('registrationExpiry', e.target.value)}
        />
      </FormField>

      <FormField label={t('fieldInsuranceExpiry')} htmlFor={`${formId}-insuranceExpiry`}>
        <input
          id={`${formId}-insuranceExpiry`}
          className="form-input"
          type="date"
          value={state.insuranceExpiry}
          onChange={(e) => update('insuranceExpiry', e.target.value)}
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
        <p className="vehicle-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="vehicle-form__actions">
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
