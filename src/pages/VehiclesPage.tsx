import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { VehicleCard } from '../features/vehicles/components/VehicleCard';
import { VehicleForm } from '../features/vehicles/components/VehicleForm';
import * as vehicleService from '../features/vehicles/vehicleService';
import { useVehicles } from '../features/vehicles/hooks/useVehicles';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './VehiclesPage.css';

const VEHICLES_CATEGORY = CATEGORIES.find((category) => category.id === 'vehicles')!;

export function VehiclesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { vehicles, maintenanceByVehicle, loading, error, refresh } = useVehicles();
  const addSheet = useDisclosure();

  const title = useLocalizedText(VEHICLES_CATEGORY.title);
  const subtitle = useLocalizedText(VEHICLES_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(VEHICLES_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(VEHICLES_CATEGORY.addLabel);
  const Icon = VEHICLES_CATEGORY.icon;

  return (
    <div className="vehicles-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="vehicles-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="vehicles-page__status">{t('formSaveError')}</p>}

      {!loading && !error && vehicles.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && vehicles.length > 0 && (
        <>
          <div className="vehicles-page__grid">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                maintenanceRecords={maintenanceByVehicle[vehicle.id] ?? []}
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
              />
            ))}
          </div>
          <div className="vehicles-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet
        open={addSheet.isOpen}
        onClose={addSheet.close}
        title={t('vehicleFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <VehicleForm
          onCancel={addSheet.close}
          onSubmit={async (values) => {
            await vehicleService.createVehicle(values);
            await refresh();
            addSheet.close();
          }}
        />
      </Sheet>
    </div>
  );
}
