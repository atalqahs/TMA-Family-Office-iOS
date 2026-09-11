import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CoverPhoto } from '../components/CoverPhoto';
import { DangerButton } from '../components/DangerButton';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { Sheet } from '../components/Sheet';
import { CompleteServiceForm } from '../features/vehicles/components/CompleteServiceForm';
import { MaintenanceRecordForm } from '../features/vehicles/components/MaintenanceRecordForm';
import { MaintenanceSection } from '../features/vehicles/components/MaintenanceSection';
import { VehicleDocumentForm } from '../features/vehicles/components/VehicleDocumentForm';
import { VehicleDocumentsSection } from '../features/vehicles/components/VehicleDocumentsSection';
import { VehicleForm } from '../features/vehicles/components/VehicleForm';
import * as vehicleService from '../features/vehicles/vehicleService';
import { useVehicle } from '../features/vehicles/hooks/useVehicle';
import type { VehicleMaintenanceRecord } from '../features/vehicles/types';
import { computeVehicleStatus, VEHICLE_STATUS_LABEL_KEY, VEHICLE_STATUS_VARIANT } from '../features/vehicles/vehicleStatus';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { formatMileageNumber } from '../utils/mileage';
import './VehicleProfilePage.css';

export function VehicleProfilePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { vehicle, documents, maintenanceRecords, loading, refresh } = useVehicle(vehicleId);
  const editSheet = useDisclosure();
  const addDocSheet = useDisclosure();
  const maintenanceSheet = useDisclosure();
  const completeServiceSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const [editingMaintenanceRecord, setEditingMaintenanceRecord] = useState<VehicleMaintenanceRecord | null>(null);
  const [completingMaintenanceRecord, setCompletingMaintenanceRecord] = useState<VehicleMaintenanceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="vehicle-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!vehicle) {
    return (
      <div className="vehicle-profile-page">
        <EmptyState
          title={t('vehicleNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/vehicles')}>{t('backToVehiclesLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  const status = computeVehicleStatus(vehicle, maintenanceRecords);
  const subtitleParts = [vehicle.make, vehicle.model, vehicle.year !== undefined ? String(vehicle.year) : undefined]
    .filter(Boolean)
    .join(' ');

  // Only rows that actually have a value are shown — an empty optional
  // field is simply omitted rather than displayed as a "-" placeholder row.
  const vehicleInfoRows: Array<[string, string]> = (
    [
      [t('fieldTrim'), vehicle.trim],
      [t('fieldColor'), vehicle.color],
      [t('fieldPlateNumber'), vehicle.plateNumber],
      [t('fieldVin'), vehicle.vin],
      [
        t('fieldCurrentMileage'),
        vehicle.currentMileage !== undefined
          ? `${formatMileageNumber(vehicle.currentMileage, locale)} ${t('mileageUnitLabel')}`
          : undefined,
      ],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const expiryRows: Array<[string, string]> = (
    [
      [
        t('fieldRegistrationExpiry'),
        vehicle.registrationExpiry && new Intl.DateTimeFormat(locale).format(new Date(vehicle.registrationExpiry)),
      ],
      [
        t('fieldInsuranceExpiry'),
        vehicle.insuranceExpiry && new Intl.DateTimeFormat(locale).format(new Date(vehicle.insuranceExpiry)),
      ],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await vehicleService.removeVehicle(vehicle.id);
      navigate('/vehicles');
    } catch (err) {
      console.error('Failed to delete vehicle', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  const openAddMaintenance = () => {
    setEditingMaintenanceRecord(null);
    maintenanceSheet.open();
  };

  const openEditMaintenance = (record: VehicleMaintenanceRecord) => {
    setEditingMaintenanceRecord(record);
    maintenanceSheet.open();
  };

  const openCompleteMaintenance = (record: VehicleMaintenanceRecord) => {
    setCompletingMaintenanceRecord(record);
    completeServiceSheet.open();
  };

  return (
    <div className="vehicle-profile-page">
      <div className="vehicle-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToVehiclesLabel')}
          onClick={() => navigate('/vehicles')}
        />
      </div>

      <div className="vehicle-profile-page__cover">
        <CoverPhoto photo={vehicle.coverPhoto} size="lg" />
      </div>

      <div className="vehicle-profile-page__header">
        <h1 className="vehicle-profile-page__name">{vehicle.name}</h1>
        {subtitleParts && <p className="vehicle-profile-page__subtitle">{subtitleParts}</p>}
        <StatusBadge variant={VEHICLE_STATUS_VARIANT[status]}>{t(VEHICLE_STATUS_LABEL_KEY[status])}</StatusBadge>
        <div className="vehicle-profile-page__header-actions">
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
        </div>
      </div>

      {vehicleInfoRows.length > 0 && (
        <section className="vehicle-profile-page__section">
          <h2 className="vehicle-profile-page__section-title">{t('profileSectionVehicleInfo')}</h2>
          <dl className="vehicle-profile-page__info-list">
            {vehicleInfoRows.map(([label, value]) => (
              <div className="vehicle-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {expiryRows.length > 0 && (
        <section className="vehicle-profile-page__section">
          <h2 className="vehicle-profile-page__section-title">{t('profileSectionExpiry')}</h2>
          <dl className="vehicle-profile-page__info-list">
            {expiryRows.map(([label, value]) => (
              <div className="vehicle-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="vehicle-profile-page__section">
        <h2 className="vehicle-profile-page__section-title">{t('profileSectionMaintenance')}</h2>
        <MaintenanceSection
          records={maintenanceRecords}
          currentMileage={vehicle.currentMileage}
          onAdd={openAddMaintenance}
          onEdit={openEditMaintenance}
          onComplete={openCompleteMaintenance}
          onRefresh={refresh}
        />
      </section>

      <section className="vehicle-profile-page__section">
        <h2 className="vehicle-profile-page__section-title">{t('profileSectionDocuments')}</h2>
        <VehicleDocumentsSection documents={documents} onAdd={addDocSheet.open} onRefresh={refresh} />
      </section>

      <section className="vehicle-profile-page__section">
        <h2 className="vehicle-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="vehicle-profile-page__notes">{vehicle.notes || t('profileNotesEmpty')}</p>
      </section>

      <div className="vehicle-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('vehicleDeleteAction')}</DangerButton>
      </div>

      <Sheet
        open={editSheet.isOpen}
        onClose={editSheet.close}
        title={t('vehicleFormEditTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <VehicleForm
          initialValue={vehicle}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await vehicleService.updateVehicle(vehicle.id, values);
            await refresh();
            editSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={addDocSheet.isOpen}
        onClose={addDocSheet.close}
        title={t('documentFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <VehicleDocumentForm
          onCancel={addDocSheet.close}
          onSubmit={async (values) => {
            await vehicleService.addVehicleDocument(vehicle.id, values);
            await refresh();
            addDocSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={maintenanceSheet.isOpen}
        onClose={maintenanceSheet.close}
        title={editingMaintenanceRecord ? t('maintenanceFormEditTitle') : t('maintenanceFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <MaintenanceRecordForm
          initialValue={editingMaintenanceRecord ?? undefined}
          onCancel={maintenanceSheet.close}
          onSubmit={async (values) => {
            if (editingMaintenanceRecord) {
              await vehicleService.updateMaintenanceRecord(editingMaintenanceRecord.id, values);
            } else {
              await vehicleService.addMaintenanceRecord(vehicle.id, values);
            }
            await refresh();
            maintenanceSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={completeServiceSheet.isOpen}
        onClose={completeServiceSheet.close}
        title={t('completeServiceFormTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        {completingMaintenanceRecord && (
          <CompleteServiceForm
            sourceRecord={completingMaintenanceRecord}
            onCancel={completeServiceSheet.close}
            onSubmit={async (values) => {
              await vehicleService.completeMaintenanceRecord(vehicle.id, completingMaintenanceRecord, values);
              await refresh();
              completeServiceSheet.close();
            }}
          />
        )}
      </Sheet>

      <Sheet
        open={deleteSheet.isOpen}
        onClose={deleteSheet.close}
        title={t('vehicleDeleteConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="vehicle-profile-page__delete-body">{t('vehicleDeleteConfirmBody')}</p>
        {deleteError && <p className="vehicle-profile-page__delete-error">{deleteError}</p>}
        <div className="vehicle-profile-page__delete-actions">
          <SecondaryButton onClick={deleteSheet.close} disabled={deleting}>
            {t('actionCancel')}
          </SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? t('formSaving') : t('vehicleDeleteConfirmAction')}
          </DangerButton>
        </div>
      </Sheet>
    </div>
  );
}
