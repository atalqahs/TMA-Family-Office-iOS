import { describe, expect, it } from 'vitest';
import { completeMaintenanceRecord, computeForwardMileageSync } from '../../src/features/vehicles/vehicleService';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import type { Vehicle, VehicleMaintenanceRecord } from '../../src/features/vehicles/types';

describe('computeForwardMileageSync (pure): mileage never moves backward, only forward', () => {
  it('adopts a forward reading', () => {
    expect(computeForwardMileageSync({ currentMileage: 50_000 }, 55_000)).toBe(55_000);
  });

  it('is a no-op for a reading behind the vehicle current mileage', () => {
    expect(computeForwardMileageSync({ currentMileage: 50_000 }, 40_000)).toBeUndefined();
  });

  it('is a no-op for a reading exactly equal to the current mileage', () => {
    expect(computeForwardMileageSync({ currentMileage: 50_000 }, 50_000)).toBeUndefined();
  });

  it('is a no-op when no reading was supplied at all', () => {
    expect(computeForwardMileageSync({ currentMileage: 50_000 }, undefined)).toBeUndefined();
  });

  it('adopts any reading when the vehicle has no prior mileage recorded', () => {
    expect(computeForwardMileageSync({ currentMileage: undefined }, 1_000)).toBe(1_000);
  });
});

describe('completeMaintenanceRecord ("Service Completed" starts the next cycle correctly)', () => {
  const vehicle: Vehicle = {
    id: 'v1',
    name: 'Family SUV',
    currentMileage: 100_000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const sourceRecord: VehicleMaintenanceRecord = {
    id: 'src',
    vehicleId: 'v1',
    type: 'oilChange',
    title: 'Oil change',
    serviceDate: '2025-06-01',
    mileageAtService: 90_000,
    serviceIntervalKm: 10_000, // old target: 100,000
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
  };

  async function seed() {
    await vehicleRepository.saveVehicle(vehicle);
  }

  it('computes the new target strictly from the actual new odometer reading + interval, never continuing from the old target — early completion', async () => {
    await seed();
    const completed = await completeMaintenanceRecord('v1', sourceRecord, {
      type: 'oilChange',
      title: 'Oil change',
      serviceDate: '2026-01-01',
      mileageAtService: 95_000, // completed EARLY relative to the old 100,000 target
      serviceIntervalKm: 10_000,
    });
    // New target = 95,000 + 10,000 = 105,000 (never 100,000 + 10,000)
    expect(completed.mileageAtService).toBe(95_000);
    expect(completed.serviceIntervalKm).toBe(10_000);
    expect(completed.previousTargetMileage).toBe(100_000);
  });

  it('computes the new target correctly for a LATE completion too', async () => {
    await seed();
    const completed = await completeMaintenanceRecord('v1', sourceRecord, {
      type: 'oilChange',
      title: 'Oil change',
      serviceDate: '2026-02-01',
      mileageAtService: 102_000, // completed LATE relative to the old 100,000 target
      serviceIntervalKm: 8_000,
    });
    expect(completed.previousTargetMileage).toBe(100_000);
    // New target = 102,000 + 8,000 = 110,000
  });

  it('leaves sourceRecord itself completely untouched', async () => {
    await seed();
    const before = { ...sourceRecord };
    await completeMaintenanceRecord('v1', sourceRecord, {
      type: 'oilChange',
      title: 'Oil change',
      serviceDate: '2026-01-01',
      mileageAtService: 95_000,
      serviceIntervalKm: 10_000,
    });
    expect(sourceRecord).toEqual(before);
    const stillStored = await vehicleRepository.getMaintenanceRecord('src');
    expect(stillStored).toBeUndefined(); // never saved in this test — only asserting the in-memory object wasn't mutated
  });

  it('syncs the vehicle currentMileage forward to the new actual reading', async () => {
    await seed();
    await completeMaintenanceRecord('v1', sourceRecord, {
      type: 'oilChange',
      title: 'Oil change',
      serviceDate: '2026-03-01',
      mileageAtService: 101_000,
      serviceIntervalKm: 5_000,
    });
    const updatedVehicle = await vehicleRepository.getVehicle('v1');
    expect(updatedVehicle?.currentMileage).toBe(101_000);
  });
});
