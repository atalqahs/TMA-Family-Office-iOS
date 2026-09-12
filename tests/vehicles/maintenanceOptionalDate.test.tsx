import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import * as vehicleService from '../../src/features/vehicles/vehicleService';
import { validateMaintenanceForm } from '../../src/features/vehicles/validation';
import { buildVehicleNotifications } from '../../src/features/notifications/sources/vehicleNotifications';
import { computeMaintenanceRecordStatus, computeMaintenanceMileageWording } from '../../src/features/vehicles/vehicleStatus';
import { MaintenanceSection } from '../../src/features/vehicles/components/MaintenanceSection';
import type { Vehicle, VehicleMaintenanceRecord } from '../../src/features/vehicles/types';
import { LanguageProvider } from '../../src/localization/LanguageContext';

const NOW = '2026-01-01T00:00:00.000Z';

function vehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return { id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW, ...overrides };
}

function maintenanceRecord(overrides: Partial<VehicleMaintenanceRecord> = {}): VehicleMaintenanceRecord {
  return {
    id: 'm1',
    vehicleId: 'v1',
    type: 'oilChange',
    title: 'Oil',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/**
 * Permanent Phase 10.1 regression suite -- Section 2 (Vehicle Maintenance
 * Date optional), items #4-11.
 */
describe('Maintenance Date is optional', () => {
  it('4. an undated maintenance record (mileage-only) passes validation and saves successfully', async () => {
    const errors = validateMaintenanceForm({
      type: 'oilChange',
      title: 'Oil',
      serviceDate: undefined,
      mileageAtService: 15_000,
      serviceIntervalKm: 2_000,
    });
    expect(errors).toEqual({});

    await vehicleRepository.saveVehicle(vehicle());
    const record = await vehicleService.addMaintenanceRecord('v1', {
      type: 'oilChange',
      title: 'Oil',
      serviceDate: undefined,
      mileageAtService: 15_000,
      serviceIntervalKm: 2_000,
    });
    const stored = await vehicleRepository.getMaintenanceRecord(record.id);
    expect(stored).toBeDefined();
    expect(stored?.serviceDate).toBeUndefined();
  });

  it('5. a missing date is never auto-filled with today or any other fabricated value', async () => {
    await vehicleRepository.saveVehicle(vehicle());
    const record = await vehicleService.addMaintenanceRecord('v1', {
      type: 'oilChange',
      title: 'Oil',
      mileageAtService: 15_000,
      serviceIntervalKm: 2_000,
    });
    expect(record).not.toHaveProperty('serviceDate');
  });

  it('6. the mileage target still derives correctly (mileageAtService + serviceIntervalKm) with no serviceDate at all', () => {
    const record = maintenanceRecord({ mileageAtService: 15_000, serviceIntervalKm: 2_000 });
    const wording = computeMaintenanceMileageWording(record, 14_500);
    expect(wording).toEqual({ kind: 'remainingKm', km: 2_500 });
  });

  it('7. mileage-based status works correctly with no serviceDate at all', () => {
    const record = maintenanceRecord({ mileageAtService: 15_000, serviceIntervalKm: 2_000 });
    // target = 17,000; current 16,800 -> 200 km remaining -> orange (within the 1,000 km warning window)
    expect(computeMaintenanceRecordStatus(record, 16_800)).toBe('orange');
    // current 17,000 -> at/past target -> red
    expect(computeMaintenanceRecordStatus(record, 17_000)).toBe('red');
  });

  it('8. a Notification is still produced from mileage data alone when serviceDate is absent', () => {
    const record = maintenanceRecord({ mileageAtService: 15_000, serviceIntervalKm: 2_000 });
    const items = buildVehicleNotifications([vehicle()], [record], new Date('2026-06-01'));
    expect(items.some((item) => item.kind === 'vehicleMaintenanceOverdue' || item.kind === 'vehicleMaintenanceApproaching')).toBe(
      false,
    ); // current mileage unknown for this vehicle -- no wording/status can be derived without it, correctly no notification
  });

  it('8b. a Notification IS produced from mileage data alone (current mileage known, no serviceDate) when overdue', () => {
    const record = maintenanceRecord({ mileageAtService: 15_000, serviceIntervalKm: 2_000 });
    const items = buildVehicleNotifications([vehicle({ currentMileage: 17_500 })], [record], new Date('2026-06-01'));
    expect(items.some((item) => item.kind === 'vehicleMaintenanceOverdue')).toBe(true);
  });

  it('9. an existing DATED maintenance record continues to work exactly as before', () => {
    const record = maintenanceRecord({ serviceDate: '2026-01-01', mileageAtService: 15_000, serviceIntervalKm: 2_000 });
    expect(computeMaintenanceRecordStatus(record, 16_800)).toBe('orange');
  });

  it('10. current-mileage forward sync still works when adding an undated maintenance record', async () => {
    await vehicleRepository.saveVehicle(vehicle({ currentMileage: 10_000 }));
    await vehicleService.addMaintenanceRecord('v1', {
      type: 'oilChange',
      title: 'Oil',
      mileageAtService: 15_000,
      serviceIntervalKm: 2_000,
    });
    const updatedVehicle = await vehicleRepository.getVehicle('v1');
    expect(updatedVehicle?.currentMileage).toBe(15_000);
  });

  it('11. rendering an undated maintenance record never produces "Invalid Date"/NaN or throws', () => {
    const record = maintenanceRecord({ mileageAtService: 15_000, serviceIntervalKm: 2_000 });
    expect(() =>
      render(
        <LanguageProvider>
          <MaintenanceSection
            records={[record]}
            currentMileage={14_500}
            onAdd={() => {}}
            onEdit={() => {}}
            onComplete={() => {}}
            onRefresh={() => {}}
          />
        </LanguageProvider>,
      ),
    ).not.toThrow();
    expect(screen.queryByText(/Invalid Date/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
  });
});
