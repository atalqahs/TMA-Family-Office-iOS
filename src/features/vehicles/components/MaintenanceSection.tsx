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

  const mileageUnit = t('mileageUnitLabel');
  const serviceDateText = record.serviceDate ? new Intl.DateTimeFormat(locale).format(new Date(record.serviceDate)) : undefined;
  const nextServiceDateText = record.nextServiceDate
    ? new Intl.DateTimeFormat(locale).format(new Date(record.nextServiceDate))
    : undefined;
  const hasNextServiceInfo = serviceIntervalKm !== undefined || targetMileage !== undefined || nextServiceDateText !== undefined;

  return (
    <li className="maintenance-row">
      <div className="maintenance-row__header">
        <span className="maintenance-row__icon" aria-hidden="true">
          <Wrench size={20} strokeWidth={1.75} />
        </span>
        <div className="maintenance-row__heading">
          <span className="maintenance-row__title">{record.title}</span>
          <span className="maintenance-row__type">{typeLabel}</span>
        </div>
        {status && (
          <StatusBadge variant={VEHICLE_STATUS_VARIANT[status]}>{t(VEHICLE_STATUS_LABEL_KEY[status])}</StatusBadge>
        )}
      </div>

      {(serviceDateText || mileageAtService !== undefined) && (
        <dl className="maintenance-row__details">
          {serviceDateText && (
            <div className="maintenance-row__detail-row">
              <dt>{t('fieldServiceDate')}</dt>
              <dd>{serviceDateText}</dd>
            </div>
          )}
          {mileageAtService !== undefined && (
            <div className="maintenance-row__detail-row">
              <dt>{t('fieldMileageAtService')}</dt>
              <dd>{`${formatMileageNumber(mileageAtService, locale)} ${mileageUnit}`}</dd>
            </div>
          )}
        </dl>
      )}

      {hasNextServiceInfo && (
        <dl className="maintenance-row__details maintenance-row__details--next">
          <div className="maintenance-row__details-heading">{t('nextServiceLabel')}</div>
          {serviceIntervalKm !== undefined && (
            <div className="maintenance-row__detail-row">
              <dt>{t('fieldServiceIntervalKm')}</dt>
              <dd>{`${formatMileageNumber(serviceIntervalKm, locale)} ${mileageUnit}`}</dd>
            </div>
          )}
          {targetMileage !== undefined && (
            <div className="maintenance-row__detail-row">
              <dt>{t('fieldTargetMileage')}</dt>
              <dd>{`${formatMileageNumber(targetMileage, locale)} ${mileageUnit}`}</dd>
            </div>
          )}
          {nextServiceDateText && (
            <div className="maintenance-row__detail-row">
              <dt>{t('fieldNextServiceDate')}</dt>
              <dd>{nextServiceDateText}</dd>
            </div>
          )}
          {mileageWordingText && <div className="maintenance-row__remaining">{mileageWordingText}</div>}
        </dl>
      )}

      {record.notes && <p className="maintenance-row__notes">{record.notes}</p>}

      {error && <p className="maintenance-row__error">{error}</p>}

      <div className="maintenance-row__actions">
        <PrimaryButton type="button" onClick={onComplete}>
          {t('completeServiceAction')}
        </PrimaryButton>
        <div className="maintenance-row__actions-secondary">
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
        </div>
      </div>
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
