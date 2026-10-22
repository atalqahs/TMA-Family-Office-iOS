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
    expect(computeVehicleStatus({}, []).level).toBe('green');
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
    expect(status.level).toBe('green');
  });
});

describe('vehicleStatus: reasons', () => {
  const NOW = new Date(2026, 5, 15); // local June 15, 2026

  it('lists multiple independent reasons at once: expired registration, expiring insurance, overdue maintenance', () => {
    const maintenance = record({
      id: 'oil',
      mileageAtService: 100_000,
      serviceIntervalKm: 5_000, // target 105,000
    });
    const { level, reasons } = computeVehicleStatus(
      { registrationExpiry: '2026-01-01', insuranceExpiry: '2026-06-20', currentMileage: 110_000 },
      [maintenance],
      NOW,
    );
    expect(level).toBe('red');
    expect(reasons).toHaveLength(3);
    expect(reasons).toContainEqual(
      expect.objectContaining({ level: 'red', textKey: 'vehicleReasonRegistrationExpired', params: { date: '2026-01-01' } }),
    );
    expect(reasons).toContainEqual(
      expect.objectContaining({
        level: 'orange',
        textKey: 'vehicleReasonInsuranceExpiringSoon',
        params: { date: '2026-06-20' },
      }),
    );
    expect(reasons).toContainEqual(
      expect.objectContaining({ level: 'red', textKey: 'vehicleReasonMaintenanceOverdueKm', detail: 'Oil change' }),
    );
  });

  it('resolving one reason (renewing registration) leaves the others untouched', () => {
    const maintenance = record({ id: 'oil', mileageAtService: 100_000, serviceIntervalKm: 5_000 });
    const { level, reasons } = computeVehicleStatus(
      { registrationExpiry: '2027-01-01', insuranceExpiry: '2026-06-20', currentMileage: 110_000 },
      [maintenance],
      NOW,
    );
    expect(level).toBe('red'); // still red from maintenance overdue
    expect(reasons).toHaveLength(2);
    expect(reasons.some((r) => r.textKey === 'vehicleReasonRegistrationExpired')).toBe(false);
    expect(reasons.some((r) => r.textKey === 'vehicleReasonInsuranceExpiringSoon')).toBe(true);
    expect(reasons.some((r) => r.textKey === 'vehicleReasonMaintenanceOverdueKm')).toBe(true);
  });

  it('resolving the final reason clears the badge back to green with no reasons', () => {
    const { level, reasons } = computeVehicleStatus(
      { registrationExpiry: '2027-01-01', insuranceExpiry: '2027-01-01', currentMileage: 100_000 },
      [],
      NOW,
    );
    expect(level).toBe('green');
    expect(reasons).toEqual([]);
  });

  it('a mileage-tracked record never contributes an overdue reason just because a fallback date passed', () => {
    const maintenance = record({
      mileageAtService: 100_000,
      serviceIntervalKm: 10_000, // target 110,000
      nextServiceDate: '2020-01-01', // long past, but mileage is authoritative
    });
    const { level, reasons } = computeVehicleStatus({ currentMileage: 105_000 }, [maintenance], NOW);
    expect(level).toBe('green');
    expect(reasons).toEqual([]);
  });

  it('only the active (most recent) record per type contributes a reason', () => {
    const oldRecord = record({ id: 'old', serviceDate: '2020-01-01', mileageAtService: 10_000, serviceIntervalKm: 1_000 });
    const newRecord = record({ id: 'new', serviceDate: '2026-01-01', mileageAtService: 100_000, serviceIntervalKm: 50_000 });
    const { level, reasons } = computeVehicleStatus({ currentMileage: 100_500 }, [oldRecord, newRecord], NOW);
    expect(level).toBe('green');
    expect(reasons).toEqual([]);
  });
});
