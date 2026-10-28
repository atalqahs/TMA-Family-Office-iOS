import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday } from '../../../utils/localDate';
import { formatMileageNumber } from '../../../utils/mileage';
import { getServiceIntervalDisplay, getTargetMileage } from '../types';
import type { VehicleMaintenanceFormValues, VehicleMaintenanceRecord } from '../types';
import { validateMaintenanceForm } from '../validation';
import { MaintenanceMileageFields } from './MaintenanceMileageFields';
import './MaintenanceRecordForm.css';

interface CompleteServiceFormProps {
  sourceRecord: VehicleMaintenanceRecord;
  onSubmit: (values: VehicleMaintenanceFormValues) => Promise<void>;
  onCancel: () => void;
}

interface CompleteServiceFormState {
  serviceDate: string;
  mileageAtService: string;
  serviceIntervalKm: string;
  nextServiceDate: string;
  notes: string;
}

/**
 * "Service Completed" — starts a brand-new maintenance cycle for the same
 * item (same type/title), always anchored to the ACTUAL odometer reading
 * entered here, never to the old target. The previous interval is
 * prefilled as a convenience only (per the correction spec: "do not
 * automatically assume the same interval is always correct") — fully
 * editable before saving.
 */
export function CompleteServiceForm({ sourceRecord, onSubmit, onCancel }: CompleteServiceFormProps) {
  const { t, locale } = useLanguage();
  const formId = useId();
  const [state, setState] = useState<CompleteServiceFormState>(() => {
    const prefillInterval = getServiceIntervalDisplay(sourceRecord);
    return {
      serviceDate: getLocalToday(),
      mileageAtService: '',
      serviceIntervalKm: prefillInterval !== undefined ? String(prefillInterval) : '',
      nextServiceDate: '',
      notes: '',
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof CompleteServiceFormState>(key: K, value: CompleteServiceFormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const mileageAtServiceNum = state.mileageAtService.trim() ? Number(state.mileageAtService) : undefined;
  const serviceIntervalNum = state.serviceIntervalKm.trim() ? Number(state.serviceIntervalKm) : undefined;

  const previousTargetMileage = getTargetMileage(sourceRecord);

  /**
   * Service Completed has one rule beyond the shared form validation: the
   * actual odometer reading is REQUIRED here (unlike add/edit, where
   * mileage tracking is optional for a record). Everything else -- the
   * negative/positive/max-200,000 numeric checks -- delegates to the same
   * `validateMaintenanceForm` the add/edit form uses, so those thresholds
   * have exactly one source of truth.
   */
  const validate = (): string | null => {
    if (!state.serviceDate) return t('validationMaintenanceDateRequired');
    if (mileageAtServiceNum === undefined) return t('validationMileageNegative');
    const formErrors = validateMaintenanceForm({
      type: sourceRecord.type,
      title: sourceRecord.title,
      serviceDate: state.serviceDate,
      mileageAtService: mileageAtServiceNum,
      serviceIntervalKm: serviceIntervalNum,
    });
    if (formErrors.mileageAtService) return t(formErrors.mileageAtService);
    if (formErrors.serviceIntervalKm) return t(formErrors.serviceIntervalKm);
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    const values: VehicleMaintenanceFormValues = {
      type: sourceRecord.type,
      title: sourceRecord.title,
      serviceDate: state.serviceDate,
      mileageAtService: mileageAtServiceNum,
      serviceIntervalKm: serviceIntervalNum,
      nextServiceDate: state.nextServiceDate || undefined,
      notes: state.notes.trim() || undefined,
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Failed to complete maintenance record', err);
      setSubmitError(t('formSaveError'));
      setSubmitting(false);
    }
  };

  return (
    <form className="maintenance-record-form" onSubmit={handleSubmit} noValidate>
      {previousTargetMileage !== undefined && (
        <p className="maintenance-record-form__computed-empty">
          {t('completeServicePreviousTargetLabel')}: {formatMileageNumber(previousTargetMileage, locale)}{' '}
          {t('mileageUnitLabel')}
        </p>
      )}

      <FormField label={t('fieldServiceDate')} htmlFor={`${formId}-serviceDate`}>
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
        mileageAtServiceRequired
        mileageAtServiceAutoFocus
        serviceIntervalKm={state.serviceIntervalKm}
        onServiceIntervalKmChange={(value) => update('serviceIntervalKm', value)}
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
          rows={3}
        />
      </FormField>

      {error && (
        <p className="maintenance-record-form__error" role="alert">
          {error}
        </p>
      )}
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
          {submitting ? t('formSaving') : t('completeServiceSubmitAction')}
        </PrimaryButton>
      </div>
    </form>
  );
}
