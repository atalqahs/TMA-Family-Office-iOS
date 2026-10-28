import { computeDateExpiryStatus } from '../../../utils/expiryStatus';
import { computeMaintenanceMileageWording, computeMaintenanceRecordStatus, getActiveMaintenanceRecords } from '../../vehicles/vehicleStatus';
import type { Vehicle, VehicleMaintenanceRecord } from '../../vehicles/types';
import type { NotificationItem, NotificationSeverity } from '../types';

/**
 * Vehicle notifications reuse the module's own approved derived status
 * utilities verbatim -- `computeDateExpiryStatus` for registration/
 * insurance (same shared utility Staff/Contracts also use) and
 * `computeMaintenanceRecordStatus`/`computeMaintenanceMileageWording`/
 * `getActiveMaintenanceRecords` for maintenance, which already encode the
 * approved mileage-priority rule (mileage target authoritative when it
 * exists; a past date alone never overrides it; date is only a fallback
 * when no mileage target can be derived) and the "one active record per
 * maintenance type" selection that prevents a stale, superseded record
 * from producing a duplicate/stale notification. Nothing here recomputes
 * any of that.
 */
export function buildVehicleNotifications(
  vehicles: Vehicle[],
  maintenanceRecords: VehicleMaintenanceRecord[],
  now: Date = new Date(),
): NotificationItem[] {
  const maintenanceByVehicle = new Map<string, VehicleMaintenanceRecord[]>();
  for (const record of maintenanceRecords) {
    (maintenanceByVehicle.get(record.vehicleId) ?? maintenanceByVehicle.set(record.vehicleId, []).get(record.vehicleId)!).push(record);
  }

  const items: NotificationItem[] = [];

  for (const vehicle of vehicles) {
    const route = `/vehicles/${vehicle.id}`;

    const registrationExpiry = vehicle.registrationExpiry;
    if (registrationExpiry) {
      const status = computeDateExpiryStatus(registrationExpiry, now);
      if (status === 'red' || status === 'orange') {
        const expired = status === 'red';
        items.push({
          id: `vehicle:${vehicle.id}:registration-${expired ? 'expired' : 'expiring'}`,
          sourceType: 'vehicle',
          sourceId: vehicle.id,
          kind: expired ? 'vehicleRegistrationExpired' : 'vehicleRegistrationExpiringSoon',
          severity: expired ? 'critical' : 'warning',
          titleKey: expired ? 'notificationTitleVehicleRegistrationExpired' : 'notificationTitleVehicleRegistrationExpiringSoon',
          titleParams: { name: vehicle.name },
          messageKey: expired ? 'notificationMsgExpiredOn' : 'notificationMsgExpiringOn',
          messageParams: { date: registrationExpiry },
          effectiveDate: registrationExpiry,
          sortDate: registrationExpiry,
          route,
        });
      }
    }

    const insuranceExpiry = vehicle.insuranceExpiry;
    if (insuranceExpiry) {
      const status = computeDateExpiryStatus(insuranceExpiry, now);
      if (status === 'red' || status === 'orange') {
        const expired = status === 'red';
        items.push({
          id: `vehicle:${vehicle.id}:insurance-${expired ? 'expired' : 'expiring'}`,
          sourceType: 'vehicle',
          sourceId: vehicle.id,
          kind: expired ? 'vehicleInsuranceExpired' : 'vehicleInsuranceExpiringSoon',
          severity: expired ? 'critical' : 'warning',
          titleKey: expired ? 'notificationTitleVehicleInsuranceExpired' : 'notificationTitleVehicleInsuranceExpiringSoon',
          titleParams: { name: vehicle.name },
          messageKey: expired ? 'notificationMsgExpiredOn' : 'notificationMsgExpiringOn',
          messageParams: { date: insuranceExpiry },
          effectiveDate: insuranceExpiry,
          sortDate: insuranceExpiry,
          route,
        });
      }
    }

    const activeRecords = getActiveMaintenanceRecords(maintenanceByVehicle.get(vehicle.id) ?? []);
    for (const record of activeRecords) {
      const status = computeMaintenanceRecordStatus(record, vehicle.currentMileage);
      if (status !== 'red' && status !== 'orange') continue;

      const severity: NotificationSeverity = status === 'red' ? 'critical' : 'warning';
      const wording = computeMaintenanceMileageWording(record, vehicle.currentMileage);

      let messageParams: Record<string, string> | undefined;
      let effectiveDate: string | undefined;
      const messageKey = wording
        ? wording.kind === 'remainingKm'
          ? 'notificationMsgApproachingKm'
          : 'notificationMsgOverdueByKm'
        : status === 'red'
          ? 'notificationMsgExpiredOn'
          : 'notificationMsgExpiringOn';

      if (wording) {
        const km = wording.kind === 'serviceDue' ? 0 : wording.km;
        messageParams = { km: String(km) };
      } else if (record.nextServiceDate) {
        messageParams = { date: record.nextServiceDate };
        effectiveDate = record.nextServiceDate;
      }

      items.push({
        id: `vehicle:${vehicle.id}:maintenance:${record.id}`,
        sourceType: 'vehicle',
        sourceId: vehicle.id,
        kind: severity === 'critical' ? 'vehicleMaintenanceOverdue' : 'vehicleMaintenanceApproaching',
        severity,
        titleKey: severity === 'critical' ? 'notificationTitleVehicleMaintenanceOverdue' : 'notificationTitleVehicleMaintenanceApproaching',
        titleParams: { name: vehicle.name, maintenanceTitle: record.title },
        messageKey,
        messageParams,
        effectiveDate,
        sortDate: effectiveDate ?? record.serviceDate,
        route,
        metadata: wording ? { km: wording.kind === 'serviceDue' ? 0 : wording.km } : undefined,
      });
    }
  }

  return items;
}
