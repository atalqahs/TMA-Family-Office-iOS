import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { DangerButton } from '../../../components/DangerButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { formatMileageNumber } from '../../../utils/mileage';
import { removeMaintenanceRecord } from '../vehicleService';
import { getMileageAtService, getServiceIntervalDisplay, getTargetMileage, VEHICLE_MAINTENANCE_TYPES } from '../types';
import type { VehicleMaintenanceRecord } from '../types';
import {
  computeMaintenanceRecordStatus,
  computeMaintenanceMileageWording,
  VEHICLE_STATUS_LABEL_KEY,
  VEHICLE_STATUS_VARIANT,
} from '../vehicleStatus';
import './MaintenanceSection.css';

interface MaintenanceSectionProps {
  records: VehicleMaintenanceRecord[];
  currentMileage: number | undefined;
  onAdd: () => void;
  onEdit: (record: VehicleMaintenanceRecord) => void;
  onComplete: (record: VehicleMaintenanceRecord) => void;
  onRefresh: () => Promise<void> | void;
}

interface MaintenanceRowProps {
  record: VehicleMaintenanceRecord;
  currentMileage: number | undefined;
  onEdit: () => void;
  onComplete: () => void;
  onRemoved: () => void;
}

function MaintenanceRow({ record, currentMileage, onEdit, onComplete, onRemoved }: MaintenanceRowProps) {
  const { t, locale } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = VEHICLE_MAINTENANCE_TYPES.find((option) => option.id === record.type)?.title[locale] ?? record.type;
  const status = computeMaintenanceRecordStatus(record, currentMileage);
  const mileageAtService = getMileageAtService(record);
  const serviceIntervalKm = getServiceIntervalDisplay(record);
  const targetMileage = getTargetMileage(record);
  const mileageWording = computeMaintenanceMileageWording(record, currentMileage);

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await removeMaintenanceRecord(record.id);
      onRemoved();
    } catch (err) {
      console.error('Failed to remove maintenance record', err);
      setError(t('formSaveError'));
      setRemoving(false);
    }
  };

  const mileageWordingText = (() => {
    if (!mileageWording) return undefined;
    if (mileageWording.kind === 'serviceDue') return t('maintenanceServiceDue');
    const km = formatMileageNumber(mileageWording.km, locale);
    const template = mileageWording.kind === 'remainingKm' ? t('maintenanceRemainingKm') : t('maintenanceOverdueByKm');
    return template.replace('{km}', km);
  })();

  return (
    <li className="maintenance-row">
      <span className="maintenance-row__icon" aria-hidden="true">
        <Wrench size={20} strokeWidth={1.75} />
      </span>
      <span className="maintenance-row__text">
        <span className="maintenance-row__title">{record.title}</span>
        <span className="maintenance-row__meta">
          {record.serviceDate ? `${typeLabel} · ${new Intl.DateTimeFormat(locale).format(new Date(record.serviceDate))}` : typeLabel}
          {mileageAtService !== undefined &&
            ` · ${t('fieldMileageAtService')}: ${formatMileageNumber(mileageAtService, locale)} ${t('mileageUnitLabel')}`}
        </span>
        {(serviceIntervalKm !== undefined || targetMileage !== undefined || record.nextServiceDate) && (
          <span className="maintenance-row__next">
            {t('nextServiceLabel')}:{' '}
            {[
              record.nextServiceDate && new Intl.DateTimeFormat(locale).format(new Date(record.nextServiceDate)),
              serviceIntervalKm !== undefined &&
                `${t('fieldServiceIntervalKm')} ${formatMileageNumber(serviceIntervalKm, locale)} ${t('mileageUnitLabel')}`,
              targetMileage !== undefined &&
                `${t('fieldTargetMileage')} ${formatMileageNumber(targetMileage, locale)} ${t('mileageUnitLabel')}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
        {mileageWordingText && <span className="maintenance-row__remaining">{mileageWordingText}</span>}
        {record.notes && <span className="maintenance-row__notes">{record.notes}</span>}
        {status && <StatusBadge variant={VEHICLE_STATUS_VARIANT[status]}>{t(VEHICLE_STATUS_LABEL_KEY[status])}</StatusBadge>}
        {error && <span className="maintenance-row__error">{error}</span>}
      </span>
      <span className="maintenance-row__actions">
        <PrimaryButton type="button" onClick={onComplete}>
          {t('completeServiceAction')}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onEdit}>
          {t('profileEditAction')}
        </SecondaryButton>
        {confirming ? (
          <DangerButton type="button" onClick={handleRemove} disabled={removing}>
            {removing ? t('formSaving') : t('actionConfirm')}
          </DangerButton>
        ) : (
          <DangerButton type="button" onClick={() => setConfirming(true)}>
            {t('documentDeleteAction')}
          </DangerButton>
        )}
      </span>
    </li>
  );
}

export function MaintenanceSection({ records, currentMileage, onAdd, onEdit, onComplete, onRefresh }: MaintenanceSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="maintenance-section">
      {records.length === 0 ? (
        <p className="maintenance-section__empty">{t('maintenanceEmpty')}</p>
      ) : (
        <ul className="maintenance-section__list">
          {records.map((record) => (
            <MaintenanceRow
              key={record.id}
              record={record}
              currentMileage={currentMileage}
              onEdit={() => onEdit(record)}
              onComplete={() => onComplete(record)}
              onRemoved={() => void onRefresh()}
            />
          ))}
        </ul>
      )}
      <PrimaryButton type="button" onClick={onAdd}>
        {t('maintenanceAddAction')}
      </PrimaryButton>
    </div>
  );
}
