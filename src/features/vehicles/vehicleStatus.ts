import type { TranslationKey } from '../../localization/translations';
import { computeDateExpiryStatus } from '../../utils/expiryStatus';
import type { StatusReason } from '../../utils/statusReasons';
import { getTargetMileage, type Vehicle, type VehicleMaintenanceRecord } from './types';

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

/** Centralized threshold so mileage status is never computed inconsistently in two places (the date threshold lives in utils/expiryStatus.ts, shared with Staff). */
const MILEAGE_WARNING_KM = 1000;

const SEVERITY: Record<VehicleStatusLevel, number> = { green: 0, orange: 1, red: 2 };

function worse(a: VehicleStatusLevel, b: VehicleStatusLevel): VehicleStatusLevel {
  return SEVERITY[b] > SEVERITY[a] ? b : a;
}

/** RED once mileage has reached/passed the target mileage, ORANGE within the warning window. Undefined when either value is missing. */
function mileageStatus(
  currentMileage: number | undefined,
  targetMileage: number | undefined,
): VehicleStatusLevel | undefined {
  if (currentMileage === undefined || targetMileage === undefined) return undefined;
  if (currentMileage >= targetMileage) return 'red';
  if (targetMileage - currentMileage <= MILEAGE_WARNING_KM) return 'orange';
  return 'green';
}

/**
 * Status for a single maintenance record's own next-due signal (used on
 * the record row, and folded into the vehicle-wide badge).
 *
 * Mileage is authoritative whenever a target mileage can be derived for
 * this record (see `getTargetMileage`): passing `nextServiceDate` alone
 * must NOT mark such a record overdue — e.g. current mileage 105,000 with
 * a 110,000 target stays green/orange even if the next-service date has
 * already passed. Date is only used as a fallback signal when the record
 * has no mileage target at all (pure date-based maintenance).
 */
export function computeMaintenanceRecordStatus(
  record: VehicleMaintenanceRecord,
  currentMileage: number | undefined,
): VehicleStatusLevel | undefined {
  const targetMileage = getTargetMileage(record);
  if (targetMileage !== undefined) {
    return mileageStatus(currentMileage, targetMileage);
  }
  return computeDateExpiryStatus(record.nextServiceDate);
}

export type VehicleStatusReason = StatusReason;

export interface VehicleStatus {
  level: VehicleStatusLevel;
  reasons: VehicleStatusReason[];
}

/**
 * Overall vehicle status: the worst (most severe) signal across
 * registration expiry, insurance expiry, and every maintenance record's
 * own status (per `computeMaintenanceRecordStatus`, so mileage-vs-date
 * priority is identical here and on each record row — one calculation,
 * never duplicated). Missing data is simply skipped — it never invents a
 * warning. Used by both VehicleCard and VehicleProfilePage so the
 * calculation only exists in one place.
 *
 * Only the most recent record per maintenance type contributes to this
 * aggregate: once a "Service Completed" cycle starts a new record for a
 * type, the superseded old record (whose target/date is naturally now in
 * the past) must not keep the whole vehicle stuck red forever — each
 * record still shows its own true historical status in the maintenance
 * list, this only affects the single vehicle-wide badge.
 *
 * Alongside the level, returns every independent reason behind it (same
 * `{level, reasons}` shape as computeStaffStatus) -- a vehicle can be
 * "Overdue" for the registration, the insurance, AND an active
 * maintenance cycle all at once, and all of that must stay visible, not
 * just whichever is most severe.
 */
export function computeVehicleStatus(
  vehicle: Pick<Vehicle, 'registrationExpiry' | 'insuranceExpiry' | 'currentMileage'>,
  maintenanceRecords: VehicleMaintenanceRecord[],
  now: Date = new Date(),
): VehicleStatus {
  const reasons: VehicleStatusReason[] = [];
  let level: VehicleStatusLevel = 'green';

  const addReason = (
    reasonLevel: 'orange' | 'red',
    textKey: TranslationKey,
    params?: Record<string, string>,
    detail?: string,
  ) => {
    reasons.push({ level: reasonLevel, textKey, params, detail });
    level = worse(level, reasonLevel);
  };

  if (vehicle.registrationExpiry) {
    const registrationStatus = computeDateExpiryStatus(vehicle.registrationExpiry, now);
    if (registrationStatus === 'red') {
      addReason('red', 'vehicleReasonRegistrationExpired', { date: vehicle.registrationExpiry });
    } else if (registrationStatus === 'orange') {
      addReason('orange', 'vehicleReasonRegistrationExpiringSoon', { date: vehicle.registrationExpiry });
    }
  }

  if (vehicle.insuranceExpiry) {
    const insuranceStatus = computeDateExpiryStatus(vehicle.insuranceExpiry, now);
    if (insuranceStatus === 'red') {
      addReason('red', 'vehicleReasonInsuranceExpired', { date: vehicle.insuranceExpiry });
    } else if (insuranceStatus === 'orange') {
      addReason('orange', 'vehicleReasonInsuranceExpiringSoon', { date: vehicle.insuranceExpiry });
    }
  }

  for (const record of getActiveMaintenanceRecords(maintenanceRecords)) {
    const recordStatus = computeMaintenanceRecordStatus(record, vehicle.currentMileage);
    if (recordStatus !== 'orange' && recordStatus !== 'red') continue;

    const targetMileage = getTargetMileage(record);
    if (targetMileage !== undefined) {
      const wording = computeMaintenanceMileageWording(record, vehicle.currentMileage);
      if (wording?.kind === 'overdueByKm') {
        addReason(recordStatus, 'vehicleReasonMaintenanceOverdueKm', { km: String(wording.km) }, record.title);
      } else if (wording?.kind === 'serviceDue') {
        addReason(recordStatus, 'vehicleReasonMaintenanceServiceDue', undefined, record.title);
      } else if (wording?.kind === 'remainingKm') {
        addReason(recordStatus, 'vehicleReasonMaintenanceApproachingKm', { km: String(wording.km) }, record.title);
      }
    } else if (record.nextServiceDate) {
      const textKey = recordStatus === 'red' ? 'vehicleReasonMaintenanceOverdueDate' : 'vehicleReasonMaintenanceDueSoonDate';
      addReason(recordStatus, textKey, { date: record.nextServiceDate }, record.title);
    }
  }

  return { level, reasons };
}

/**
 * The "active" record per maintenance type: the most recently performed
 * one (by `serviceDate`, tie-broken by `createdAt`). Every maintenance
 * type is tracked independently, so a vehicle with both oil and tires
 * records keeps one active cycle per type simultaneously.
 *
 * Exported so the Notifications aggregator (Phase 9B) can reuse this exact
 * "one active cycle per type" selection instead of re-deriving it -- a
 * maintenance item's notification is tied to its active record's own id,
 * so a warning-to-overdue transition on the same item naturally becomes
 * the current notification rather than coexisting as a duplicate.
 */
export function getActiveMaintenanceRecords(records: VehicleMaintenanceRecord[]): VehicleMaintenanceRecord[] {
  const latestByType = new Map<string, VehicleMaintenanceRecord>();
  for (const record of records) {
    const current = latestByType.get(record.type);
    if (!current || isMoreRecent(record, current)) {
      latestByType.set(record.type, record);
    }
  }
  return [...latestByType.values()];
}

function isMoreRecent(a: VehicleMaintenanceRecord, b: VehicleMaintenanceRecord): boolean {
  // Undated records (Phase 10.1: serviceDate is optional) fall back to
  // createdAt -- comparing an absent serviceDate against a present one
  // would otherwise be meaningless.
  if (a.serviceDate && b.serviceDate && a.serviceDate !== b.serviceDate) return a.serviceDate > b.serviceDate;
  return a.createdAt > b.createdAt;
}

export type MaintenanceMileageWording =
  | { kind: 'remainingKm'; km: number }
  | { kind: 'serviceDue' }
  | { kind: 'overdueByKm'; km: number };

/**
 * Human-facing wording for a maintenance record's mileage standing against
 * the vehicle's LIVE current mileage — "10,000 km remaining", "Service
 * due", "Overdue by 2,000 km". Pure and derived every time from the fixed
 * `targetMileage` and the live `currentMileage`, per the requirement that
 * the target itself never moves as the vehicle is driven — only this
 * remaining/overdue figure does. `undefined` when there's no mileage
 * target to report against (date-only record) or no current mileage yet.
 */
export function computeMaintenanceMileageWording(
  record: VehicleMaintenanceRecord,
  currentMileage: number | undefined,
): MaintenanceMileageWording | undefined {
  const targetMileage = getTargetMileage(record);
  if (targetMileage === undefined || currentMileage === undefined) return undefined;
  const remaining = targetMileage - currentMileage;
  if (remaining > 0) return { kind: 'remainingKm', km: remaining };
  if (remaining === 0) return { kind: 'serviceDue' };
  return { kind: 'overdueByKm', km: -remaining };
}
