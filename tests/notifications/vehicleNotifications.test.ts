import { describe, expect, it } from 'vitest';
import { buildVehicleNotifications } from '../../src/features/notifications/sources/vehicleNotifications';
import type { Vehicle, VehicleMaintenanceRecord } from '../../src/features/vehicles/types';

const NOW = new Date(2026, 5, 15); // local June 15, 2026

function vehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v1',
    name: 'Land Cruiser',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function record(overrides: Partial<VehicleMaintenanceRecord> = {}): VehicleMaintenanceRecord {
  return {
    id: 'm1',
    vehicleId: 'v1',
    type: 'oilChange',
    title: 'Oil change',
    serviceDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Vehicle notifications', () => {
  it('1. flags an expired registration as critical', () => {
    const items = buildVehicleNotifications([vehicle({ registrationExpiry: '2026-01-01' })], [], NOW);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'vehicle:v1:registration-expired', severity: 'critical', route: '/vehicles/v1' });
  });

  it('2. flags a registration expiring soon as warning', () => {
    const items = buildVehicleNotifications([vehicle({ registrationExpiry: '2026-06-25' })], [], NOW);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'vehicle:v1:registration-expiring', severity: 'warning' });
  });

  it('3. a healthy (far future) registration produces no notification', () => {
    const items = buildVehicleNotifications([vehicle({ registrationExpiry: '2027-01-01' })], [], NOW);
    expect(items).toEqual([]);
  });

  it('4. flags an expired insurance as critical', () => {
    const items = buildVehicleNotifications([vehicle({ insuranceExpiry: '2026-01-01' })], [], NOW);
    expect(items[0]).toMatchObject({ id: 'vehicle:v1:insurance-expired', severity: 'critical' });
  });

  it('5. flags an insurance expiring soon as warning', () => {
    const items = buildVehicleNotifications([vehicle({ insuranceExpiry: '2026-06-20' })], [], NOW);
    expect(items[0]).toMatchObject({ id: 'vehicle:v1:insurance-expiring', severity: 'warning' });
  });

  it('6. flags mileage-based maintenance overdue as critical', () => {
    const items = buildVehicleNotifications(
      [vehicle({ currentMileage: 105_000 })],
      [record({ mileageAtService: 90_000, serviceIntervalKm: 10_000 })], // target 100,000, current 105,000 -> overdue
      NOW,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'vehicle:v1:maintenance:m1', kind: 'vehicleMaintenanceOverdue', severity: 'critical' });
    expect(items[0].metadata).toMatchObject({ km: 5_000 });
  });

  it('7. flags mileage-based maintenance approaching as warning', () => {
    const items = buildVehicleNotifications(
      [vehicle({ currentMileage: 99_500 })],
      [record({ mileageAtService: 90_000, serviceIntervalKm: 10_000 })], // target 100,000, 500km remaining -> within 1000km warning window
      NOW,
    );
    expect(items[0]).toMatchObject({ kind: 'vehicleMaintenanceApproaching', severity: 'warning' });
  });

  it('8. a past nextServiceDate never overrides a healthy mileage target', () => {
    const items = buildVehicleNotifications(
      [vehicle({ currentMileage: 91_000 })],
      [record({ mileageAtService: 90_000, serviceIntervalKm: 10_000, nextServiceDate: '2020-01-01' })], // target 100,000, current 91,000 -> healthy, long-past date must be ignored
      NOW,
    );
    expect(items).toEqual([]);
  });

  it('9. falls back to date-based maintenance status when no mileage target exists at all', () => {
    const items = buildVehicleNotifications([vehicle()], [record({ nextServiceDate: '2026-01-01' })], NOW);
    expect(items[0]).toMatchObject({ kind: 'vehicleMaintenanceOverdue', severity: 'critical' });
    expect(items[0].messageParams).toEqual({ date: '2026-01-01' });
  });

  it('10. never produces duplicate maintenance notifications for the same type — only the active (most recent) record contributes', () => {
    const items = buildVehicleNotifications(
      [vehicle({ currentMileage: 105_000 })],
      [
        record({ id: 'old', serviceDate: '2020-01-01', mileageAtService: 10_000, serviceIntervalKm: 1_000 }), // long-superseded overdue record
        record({ id: 'new', serviceDate: '2026-01-01', mileageAtService: 90_000, serviceIntervalKm: 10_000 }), // active, also overdue
      ],
      NOW,
    );
    const maintenanceItems = items.filter((item) => item.sourceType === 'vehicle' && item.kind.startsWith('vehicleMaintenance'));
    expect(maintenanceItems).toHaveLength(1);
    expect(maintenanceItems[0].id).toBe('vehicle:v1:maintenance:new');
  });

  it('registration and insurance issues on the same vehicle are two separate notifications, never merged', () => {
    const items = buildVehicleNotifications([vehicle({ registrationExpiry: '2026-01-01', insuranceExpiry: '2026-01-01' })], [], NOW);
    expect(items.map((item) => item.id).sort()).toEqual(['vehicle:v1:insurance-expired', 'vehicle:v1:registration-expired']);
  });
});
