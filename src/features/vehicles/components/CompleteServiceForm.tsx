import { useId, useState, type FormEvent } from 'react';
import { FormField } from '../../../components/FormField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { useLanguage } from '../../../hooks/useLanguage';
import { getLocalToday } from '../../../utils/localDate';
import { formatMileageNumber } from '../../../utils/mileage';
import { getServiceIntervalDisplay, getTargetMileage } from '../types';
import type { VehicleMaintenanceFormValues, VehicleMaintenanceRecord } from '../types';
import { MAX_SERVICE_INTERVAL_KM } from '../validation';
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

const SERVICE_INTERVAL_PRESETS_KM = [1000, 3000, 5000, 10000, 20000, 50000];

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
  const targetMileage =
    mileageAtServiceNum !== undefined && Number.isFinite(mileageAtServiceNum) &&
    serviceIntervalNum !== undefined && Number.isFinite(serviceIntervalNum)
      ? mileageAtServiceNum + serviceIntervalNum
      : undefined;

  const previousTargetMileage = getTargetMileage(sourceRecord);

  const validate = (): string | null => {
    if (!state.serviceDate) return t('validationMaintenanceDateRequired');
    if (mileageAtServiceNum === undefined || !Number.isFinite(mileageAtServiceNum) || mileageAtServiceNum < 0) {
      return t('validationMileageNegative');
    }
    if (serviceIntervalNum === undefined || !Number.isFinite(serviceIntervalNum) || serviceIntervalNum <= 0) {
      return t('validationServiceIntervalInvalid');
    }
    if (serviceIntervalNum > MAX_SERVICE_INTERVAL_KM) {
      return t('validationServiceIntervalTooLarge');
    }
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

      <FormField label={t('fieldMileageAtService')} htmlFor={`${formId}-mileageAtService`}>
        <input
          id={`${formId}-mileageAtService`}
          className="form-input"
          type="number"
          inputMode="numeric"
          min={0}
          value={state.mileageAtService}
          onChange={(e) => update('mileageAtService', e.target.value)}
          required
          autoFocus
        />
      </FormField>

      <FormField label={t('fieldServiceIntervalKm')} htmlFor={`${formId}-serviceIntervalKm`} hint={t('serviceIntervalHint')}>
        <input
          id={`${formId}-serviceIntervalKm`}
          className="form-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_SERVICE_INTERVAL_KM}
          value={state.serviceIntervalKm}
          onChange={(e) => update('serviceIntervalKm', e.target.value)}
        />
        <div className="maintenance-record-form__presets">
          {SERVICE_INTERVAL_PRESETS_KM.map((preset) => (
            <button
              key={preset}
              type="button"
              className={
                'maintenance-record-form__preset' +
                (Number(state.serviceIntervalKm) === preset ? ' maintenance-record-form__preset--active' : '')
              }
              onClick={() => update('serviceIntervalKm', String(preset))}
            >
              {formatMileageNumber(preset, locale)}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label={t('fieldTargetMileage')} htmlFor={`${formId}-targetMileage`}>
        <div id={`${formId}-targetMileage`} className="maintenance-record-form__computed">
          {targetMileage !== undefined ? (
            <>
              {formatMileageNumber(targetMileage, locale)} {t('mileageUnitLabel')}
            </>
          ) : (
            <span className="maintenance-record-form__computed-empty">{t('targetMileagePlaceholder')}</span>
          )}
        </div>
      </FormField>

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
