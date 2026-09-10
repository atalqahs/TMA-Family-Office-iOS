import type { TranslationKey } from '../../localization/translations';
import type { Vehicle, VehicleMaintenanceRecord } from './types';

export type VehicleStatusLevel = 'green' | 'orange' | 'red';

/** Shared status -> StatusBadge variant / label-key mappings, so the card, profile, and maintenance rows never disagree on what "orange" looks like. */
export const VEHICLE_STATUS_VARIANT: Record<VehicleStatusLevel, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  orange: 'warning',
  red: 'danger',
};

export const VEHICLE_STATUS_LABEL_KEY: Record<VehicleStatusLevel, TranslationKey> = {
  green: 'vehicleStatusGreen',
  orange: 'vehicleStatusOrange',
  red: 'vehicleStatusRed',
};

/** Centralized thresholds so status is never computed inconsistently in two places. */
const DATE_WARNING_DAYS = 30;
const MILEAGE_WARNING_KM = 1000;

const SEVERITY: Record<VehicleStatusLevel, number> = { green: 0, orange: 1, red: 2 };

function worse(a: VehicleStatusLevel, b: VehicleStatusLevel): VehicleStatusLevel {
  return SEVERITY[b] > SEVERITY[a] ? b : a;
}

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** RED when today or past, ORANGE within the warning window, GREEN otherwise. Undefined when there's no date to judge. */
function dateStatus(dateStr: string | undefined): VehicleStatusLevel | undefined {
  if (!dateStr) return undefined;
  const days = daysUntil(dateStr);
  if (days <= 0) return 'red';
  if (days <= DATE_WARNING_DAYS) return 'orange';
  return 'green';
}

/** RED once mileage has reached/passed the next-service mileage, ORANGE within the warning window. Undefined when either value is missing. */
function mileageStatus(
  currentMileage: number | undefined,
  nextServiceMileage: number | undefined,
): VehicleStatusLevel | undefined {
  if (currentMileage === undefined || nextServiceMileage === undefined) return undefined;
  if (currentMileage >= nextServiceMileage) return 'red';
  if (nextServiceMileage - currentMileage <= MILEAGE_WARNING_KM) return 'orange';
  return 'green';
}

/**
 * Overall vehicle status: the worst (most severe) signal across
 * registration expiry, insurance expiry, and every maintenance record's
 * next-service date/mileage. Missing data is simply skipped — it never
 * invents a warning. Used by both VehicleCard and VehicleProfilePage so the
 * calculation only exists in one place.
 */
export function computeVehicleStatus(
  vehicle: Pick<Vehicle, 'registrationExpiry' | 'insuranceExpiry' | 'currentMileage'>,
  maintenanceRecords: Array<Pick<VehicleMaintenanceRecord, 'nextServiceDate' | 'nextServiceMileage'>>,
): VehicleStatusLevel {
  let status: VehicleStatusLevel = 'green';

  const registrationStatus = dateStatus(vehicle.registrationExpiry);
  if (registrationStatus) status = worse(status, registrationStatus);

  const insuranceStatus = dateStatus(vehicle.insuranceExpiry);
  if (insuranceStatus) status = worse(status, insuranceStatus);

  for (const record of maintenanceRecords) {
    const nextDateStatus = dateStatus(record.nextServiceDate);
    if (nextDateStatus) status = worse(status, nextDateStatus);

    const nextMileageStatus = mileageStatus(vehicle.currentMileage, record.nextServiceMileage);
    if (nextMileageStatus) status = worse(status, nextMileageStatus);
  }

  return status;
}

/** Status for a single maintenance record's own next-due signals (used on the record row, not the vehicle-wide badge). */
export function computeMaintenanceRecordStatus(
  record: Pick<VehicleMaintenanceRecord, 'nextServiceDate' | 'nextServiceMileage'>,
  currentMileage: number | undefined,
): VehicleStatusLevel | undefined {
  const nextDateStatus = dateStatus(record.nextServiceDate);
  const nextMileageStatus = mileageStatus(currentMileage, record.nextServiceMileage);
  if (!nextDateStatus && !nextMileageStatus) return undefined;
  if (nextDateStatus && nextMileageStatus) return worse(nextDateStatus, nextMileageStatus);
  return nextDateStatus ?? nextMileageStatus;
}
