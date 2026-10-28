import { NON_TASK_EVENT_COLOR } from '../colors';
import type { CalendarEvent } from '../types';
import { buildDocumentExpiryEvents } from './documentExpirySource';
import { getActiveMaintenanceRecords } from '../../vehicles/vehicleStatus';
import type { Vehicle, VehicleDocument, VehicleMaintenanceRecord } from '../../vehicles/types';

/**
 * Registration/insurance expiry, each vehicle's own documents with an
 * independent `expiryDate`, and date-based maintenance -- reusing
 * `getActiveMaintenanceRecords` (the same "one current record per
 * maintenance type" selection `vehicleNotifications.ts` already uses) so
 * a superseded/completed service cycle never produces a phantom future
 * event. Mileage-only maintenance (no `nextServiceDate` recorded) has no
 * calendar date at all and is correctly skipped -- it has nothing true to
 * place on a day grid.
 */
export function buildVehicleCalendarEvents(
  vehicles: Vehicle[],
  maintenanceRecords: VehicleMaintenanceRecord[],
  documents: VehicleDocument[],
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const maintenanceByVehicle = new Map<string, VehicleMaintenanceRecord[]>();
  for (const record of maintenanceRecords) {
    (maintenanceByVehicle.get(record.vehicleId) ?? maintenanceByVehicle.set(record.vehicleId, []).get(record.vehicleId)!).push(record);
  }

  for (const vehicle of vehicles) {
    const route = `/vehicles/${vehicle.id}`;

    if (vehicle.registrationExpiry && vehicle.registrationExpiry >= rangeStart && vehicle.registrationExpiry <= rangeEnd) {
      events.push({
        id: `vehicles:${vehicle.id}:registration`,
        category: 'vehicles',
        sourceId: vehicle.id,
        date: vehicle.registrationExpiry,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventVehicleRegistrationTitle',
        titleParams: { name: vehicle.name },
      });
    }

    if (vehicle.insuranceExpiry && vehicle.insuranceExpiry >= rangeStart && vehicle.insuranceExpiry <= rangeEnd) {
      events.push({
        id: `vehicles:${vehicle.id}:insurance`,
        category: 'vehicles',
        sourceId: vehicle.id,
        date: vehicle.insuranceExpiry,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventVehicleInsuranceTitle',
        titleParams: { name: vehicle.name },
      });
    }

    const activeRecords = getActiveMaintenanceRecords(maintenanceByVehicle.get(vehicle.id) ?? []);
    for (const record of activeRecords) {
      const date = record.nextServiceDate;
      if (!date || date < rangeStart || date > rangeEnd) continue;
      events.push({
        id: `vehicles:${vehicle.id}:maintenance:${record.id}`,
        category: 'vehicles',
        sourceId: vehicle.id,
        date,
        color: NON_TASK_EVENT_COLOR,
        route,
        titleKey: 'calendarEventVehicleMaintenanceTitle',
        titleParams: { name: vehicle.name, maintenanceTitle: record.title },
      });
    }
  }

  const nameById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.name]));
  events.push(
    ...buildDocumentExpiryEvents(
      documents,
      'vehicles',
      rangeStart,
      rangeEnd,
      (document) => nameById.get(document.vehicleId) ?? '',
      (document) => `/vehicles/${document.vehicleId}`,
    ),
  );

  return events;
}
