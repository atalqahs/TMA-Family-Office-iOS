import { describe, expect, it } from 'vitest';
import { computeMaintenanceRecordStatus, computeVehicleStatus } from '../../src/features/vehicles/vehicleStatus';
import type { VehicleMaintenanceRecord } from '../../src/features/vehicles/types';

function record(overrides: Partial<VehicleMaintenanceRecord> = {}): VehicleMaintenanceRecord {
  return {
    id: 'r1',
    vehicleId: 'v1',
    type: 'oilChange',
    title: 'Oil change',
    serviceDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('vehicleStatus: mileage-priority over date', () => {
  it('stays green/orange purely on mileage even when nextServiceDate has already passed', () => {
    const r = record({
      mileageAtService: 100_000,
      serviceIntervalKm: 10_000,
      nextServiceDate: '2020-01-01', // long past
    });
    // currentMileage 105,000 vs target 110,000: 5,000km remaining -> green (not overdue)
    expect(computeMaintenanceRecordStatus(r, 105_000)).toBe('green');
  });

  it('a date-only past nextServiceDate does NOT make a mileage-tracked record overdue (date is ignored once a mileage target exists)', () => {
    const r = record({ mileageAtService: 100_000, serviceIntervalKm: 5_000, nextServiceDate: '2020-01-01' });
    expect(computeMaintenanceRecordStatus(r, 100_500)).not.toBe('red');
  });

  it('mileage reaching/passing the target is red regardless of date', () => {
    const r = record({ mileageAtService: 100_000, serviceIntervalKm: 5_000, nextServiceDate: '2099-01-01' });
    expect(computeMaintenanceRecordStatus(r, 105_000)).toBe('red');
  });

  it('date-fallback is authoritative ONLY when no mileage target can be derived at all', () => {
    const dateOnly = record({ nextServiceDate: '2020-01-01' });
    expect(computeMaintenanceRecordStatus(dateOnly, 999_999)).toBe('red');

    const futureDateOnly = record({ nextServiceDate: '2099-01-01' });
    expect(computeMaintenanceRecordStatus(futureDateOnly, 999_999)).toBe('green');
  });

  it('undefined when neither mileage target nor date exist', () => {
    expect(computeMaintenanceRecordStatus(record(), 50_000)).toBeUndefined();
  });
});

describe('vehicleStatus: overall vehicle status aggregation', () => {
  it('is green with no expiry dates and no maintenance records', () => {
    expect(computeVehicleStatus({}, [])).toBe('green');
  });

  it('only the most recent record per maintenance type contributes to the aggregate', () => {
    const oldRecord = record({
      id: 'old',
      serviceDate: '2020-01-01',
      mileageAtService: 10_000,
      serviceIntervalKm: 1_000, // long overdue target: 11,000
    });
    const newRecord = record({
      id: 'new',
      serviceDate: '2026-01-01',
      mileageAtService: 100_000,
      serviceIntervalKm: 50_000, // target 150,000, nowhere close
    });
    const status = computeVehicleStatus({ currentMileage: 100_500 }, [oldRecord, newRecord]);
    expect(status).toBe('green');
  });
});
