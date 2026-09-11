import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getMileageAtService, getServiceIntervalDisplay, VEHICLE_MAINTENANCE_TYPES } from '../types';
import type { VehicleMaintenanceFormValues, VehicleMaintenanceRecord, VehicleMaintenanceType } from '../types';
import { validateMaintenanceForm } from '../validation';
import { MaintenanceMileageFields } from './MaintenanceMileageFields';
import './MaintenanceRecordForm.css';

interface MaintenanceRecordFormProps {
  initialValue?: VehicleMaintenanceRecord;
  onSubmit: (values: VehicleMaintenanceFormValues) => Promise<void>;
  onCancel: () => void;
}

interface MaintenanceFormState {
  type: VehicleMaintenanceType;
  title: string;
  serviceDate: string;
  mileageAtService: string;
  serviceIntervalKm: string;
  nextServiceDate: string;
  notes: string;
}

function toFormState(record?: VehicleMaintenanceRecord): MaintenanceFormState {
  const mileageAtService = record ? getMileageAtService(record) : undefined;
  const serviceIntervalKm = record ? getServiceIntervalDisplay(record) : undefined;
  return {
    type: record?.type ?? 'oilChange',
    title: record?.title ?? '',
    serviceDate: record?.serviceDate ?? '',
    mileageAtService: mileageAtService !== undefined ? String(mileageAtService) : '',
    serviceIntervalKm: serviceIntervalKm !== undefined ? String(serviceIntervalKm) : '',
    nextServiceDate: record?.nextServiceDate ?? '',
    notes: record?.notes ?? '',
  };
}

function toFormValues(state: MaintenanceFormState): VehicleMaintenanceFormValues {
  return {
    type: state.type,
    title: state.title.trim(),
    serviceDate: state.serviceDate,
    mileageAtService: state.mileageAtService.trim() ? Number(state.mileageAtService) : undefined,
    serviceIntervalKm: state.serviceIntervalKm.trim() ? Number(state.serviceIntervalKm) : undefined,
    nextServiceDate: state.nextServiceDate || undefined,
    notes: state.notes.trim() || undefined,
  };
}

export function MaintenanceRecordForm({ initialValue, onSubmit, onCancel }: MaintenanceRecordFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const [state, setState] = useState<MaintenanceFormState>(() => toFormState(initialValue));
  const [errors, setErrors] = useState<ReturnType<typeof validateMaintenanceForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof MaintenanceFormState>(key: K, value: MaintenanceFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const values = toFormValues(state);
    const validationErrors = validateMaintenanceForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to save maintenance record', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="maintenance-record-form" onSubmit={handleSubmit} noValidate>
      <FormField label={t('fieldMaintenanceType')} htmlFor={`${formId}-type`}>
        <select
          id={`${formId}-type`}
          className="form-input"
          value={state.type}
          onChange={(e) => update('type', e.target.value as VehicleMaintenanceType)}
        >
          {VEHICLE_MAINTENANCE_TYPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title[locale]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label={t('fieldMaintenanceTitle')}
        htmlFor={`${formId}-title`}
        error={errors.title && t(errors.title)}
      >
        <input
          id={`${formId}-title`}
          className="form-input"
          type="text"
          value={state.title}
          onChange={(e) => update('title', e.target.value)}
          required
        />
      </FormField>

      <FormField
        label={t('fieldServiceDate')}
        htmlFor={`${formId}-serviceDate`}
        error={errors.serviceDate && t(errors.serviceDate)}
      >
        <input
          id={`${formId}-serviceDate`}
          className="form-input"
          type="date"
          value={state.serviceDate}
          onChange={(e) => update('serviceDate', e.target.value)}
          required
        />
      </FormField>

      <MaintenanceMileageFields
        idPrefix={formId}
        mileageAtService={state.mileageAtService}
        onMileageAtServiceChange={(value) => update('mileageAtService', value)}
        mileageAtServiceError={errors.mileageAtService && t(errors.mileageAtService)}
        serviceIntervalKm={state.serviceIntervalKm}
        onServiceIntervalKmChange={(value) => update('serviceIntervalKm', value)}
        serviceIntervalKmError={errors.serviceIntervalKm && t(errors.serviceIntervalKm)}
      />

      <FormField label={t('fieldNextServiceDate')} htmlFor={`${formId}-nextServiceDate`}>
        <input
          id={`${formId}-nextServiceDate`}
          className="form-input"
          type="date"
          value={state.nextServiceDate}
          onChange={(e) => update('nextServiceDate', e.target.value)}
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
        <p className="maintenance-record-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="maintenance-record-form__actions">
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
