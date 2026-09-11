import { CoverPhoto } from '../../../components/CoverPhoto';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { formatMileageNumber } from '../../../utils/mileage';
import { computeVehicleStatus, VEHICLE_STATUS_LABEL_KEY, VEHICLE_STATUS_VARIANT } from '../vehicleStatus';
import type { Vehicle, VehicleMaintenanceRecord } from '../types';
import './VehicleCard.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  maintenanceRecords: VehicleMaintenanceRecord[];
  onClick: () => void;
}

export function VehicleCard({ vehicle, maintenanceRecords, onClick }: VehicleCardProps) {
  const { t, locale } = useLanguage();

  const status = computeVehicleStatus(vehicle, maintenanceRecords);
  const statusLabel = t(VEHICLE_STATUS_LABEL_KEY[status]);

  const metaParts = [vehicle.make, vehicle.model, vehicle.year !== undefined ? String(vehicle.year) : undefined]
    .filter(Boolean)
    .join(' ');
  const mileageLabel =
    vehicle.currentMileage !== undefined
      ? `${formatMileageNumber(vehicle.currentMileage, locale)} ${t('mileageUnitLabel')}`
      : undefined;

  return (
    <button type="button" className="vehicle-card" onClick={onClick}>
      <CoverPhoto photo={vehicle.coverPhoto} size="card" variant="vehicle" />
      <div className="vehicle-card__body">
        <span className="vehicle-card__name">{vehicle.name}</span>
        {metaParts && <span className="vehicle-card__meta">{metaParts}</span>}
        <div className="vehicle-card__facts">
          {vehicle.plateNumber && <span className="vehicle-card__fact">{vehicle.plateNumber}</span>}
          {mileageLabel && <span className="vehicle-card__fact">{mileageLabel}</span>}
        </div>
        <StatusBadge variant={VEHICLE_STATUS_VARIANT[status]}>{statusLabel}</StatusBadge>
      </div>
    </button>
  );
}
