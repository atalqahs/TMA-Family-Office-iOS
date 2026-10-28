import { FormField } from '../../../components/FormField';
import { useLanguage } from '../../../hooks/useLanguage';
import { formatMileageNumber } from '../../../utils/mileage';
import { SERVICE_INTERVAL_PRESETS_KM } from '../maintenanceConstants';
import { getTargetMileage } from '../types';
import { MAX_SERVICE_INTERVAL_KM } from '../validation';
import './MaintenanceRecordForm.css';

interface MaintenanceMileageFieldsProps {
  idPrefix: string;
  mileageAtService: string;
  onMileageAtServiceChange: (value: string) => void;
  mileageAtServiceError?: string;
  mileageAtServiceRequired?: boolean;
  mileageAtServiceAutoFocus?: boolean;
  serviceIntervalKm: string;
  onServiceIntervalKmChange: (value: string) => void;
  serviceIntervalKmError?: string;
}

function toNumber(value: string): number | undefined {
  return value.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined;
}

/**
 * The "Mileage at Service" + "Service After" (with interval presets) +
 * calculated "Target Mileage" block, shared by MaintenanceRecordForm
 * (add/edit a maintenance record) and CompleteServiceForm (start the next
 * cycle) — the one place these fields are laid out and the one place the
 * live target-mileage preview is computed, via the canonical
 * `getTargetMileage` helper (never a competing calculation). The two
 * forms remain otherwise separate: this component owns only this field
 * group, not the rest of either workflow.
 */
export function MaintenanceMileageFields({
  idPrefix,
  mileageAtService,
  onMileageAtServiceChange,
  mileageAtServiceError,
  mileageAtServiceRequired,
  mileageAtServiceAutoFocus,
  serviceIntervalKm,
  onServiceIntervalKmChange,
  serviceIntervalKmError,
}: MaintenanceMileageFieldsProps) {
  const { t, locale } = useLanguage();

  const targetMileage = getTargetMileage({
    mileageAtService: toNumber(mileageAtService),
    serviceIntervalKm: toNumber(serviceIntervalKm),
  });

  return (
    <>
      <FormField
        label={t('fieldMileageAtService')}
        htmlFor={`${idPrefix}-mileageAtService`}
        error={mileageAtServiceError}
      >
        <input
          id={`${idPrefix}-mileageAtService`}
          className="form-input"
          type="number"
          inputMode="numeric"
          min={0}
          value={mileageAtService}
          onChange={(e) => onMileageAtServiceChange(e.target.value)}
          required={mileageAtServiceRequired}
          autoFocus={mileageAtServiceAutoFocus}
        />
      </FormField>

      <FormField
        label={t('fieldServiceIntervalKm')}
        htmlFor={`${idPrefix}-serviceIntervalKm`}
        hint={t('serviceIntervalHint')}
        error={serviceIntervalKmError}
      >
        <input
          id={`${idPrefix}-serviceIntervalKm`}
          className="form-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_SERVICE_INTERVAL_KM}
          value={serviceIntervalKm}
          onChange={(e) => onServiceIntervalKmChange(e.target.value)}
        />
        <div className="maintenance-record-form__presets">
          {SERVICE_INTERVAL_PRESETS_KM.map((preset) => (
            <button
              key={preset}
              type="button"
              className={
                'maintenance-record-form__preset' +
                (Number(serviceIntervalKm) === preset ? ' maintenance-record-form__preset--active' : '')
              }
              onClick={() => onServiceIntervalKmChange(String(preset))}
            >
              {formatMileageNumber(preset, locale)}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label={t('fieldTargetMileage')} htmlFor={`${idPrefix}-targetMileage`}>
        <div id={`${idPrefix}-targetMileage`} className="maintenance-record-form__computed">
          {targetMileage !== undefined ? (
            <>
              {formatMileageNumber(targetMileage, locale)} {t('mileageUnitLabel')}
            </>
          ) : (
            <span className="maintenance-record-form__computed-empty">{t('targetMileagePlaceholder')}</span>
          )}
        </div>
      </FormField>
    </>
  );
}
