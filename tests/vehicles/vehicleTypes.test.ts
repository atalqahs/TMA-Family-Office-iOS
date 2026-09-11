import { describe, expect, it } from 'vitest';
import {
  getMileageAtService,
  getServiceDelta,
  getServiceIntervalDisplay,
  getTargetMileage,
  type VehicleMaintenanceRecord,
} from '../../src/features/vehicles/types';

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

describe('vehicles/types: target-mileage derivation', () => {
  it('derives target from mileageAtService + serviceIntervalKm when both present (authoritative case)', () => {
    expect(getTargetMileage(record({ mileageAtService: 50_000, serviceIntervalKm: 5_000 }))).toBe(55_000);
  });

  it('falls back to legacy nextServiceMileage when no interval is stored', () => {
    expect(getTargetMileage(record({ mileageAtService: 50_000, nextServiceMileage: 60_000 }))).toBe(60_000);
  });

  it('falls back to legacy mileage field when mileageAtService is absent', () => {
    expect(getMileageAtService(record({ mileage: 42_000 }))).toBe(42_000);
    expect(getTargetMileage(record({ mileage: 42_000, serviceIntervalKm: 1_000 }))).toBe(43_000);
  });

  it('prefers mileageAtService over legacy mileage when both are present', () => {
    expect(getMileageAtService(record({ mileage: 1, mileageAtService: 2 }))).toBe(2);
  });

  it('returns undefined when no mileage data can produce a target at all (pure date-based record)', () => {
    expect(getTargetMileage(record({ nextServiceDate: '2026-06-01' }))).toBeUndefined();
  });

  describe('getServiceIntervalDisplay (display-only convenience)', () => {
    it('prefers the stored interval', () => {
      expect(getServiceIntervalDisplay(record({ serviceIntervalKm: 7_000 }))).toBe(7_000);
    });

    it('derives an interval arithmetically for legacy records with both a mileage-at-service and a legacy target', () => {
      expect(getServiceIntervalDisplay(record({ mileageAtService: 10_000, nextServiceMileage: 15_000 }))).toBe(5_000);
    });

    it('returns undefined rather than a negative/zero derived interval', () => {
      expect(getServiceIntervalDisplay(record({ mileageAtService: 15_000, nextServiceMileage: 10_000 }))).toBeUndefined();
    });
  });

  describe('getServiceDelta (defined but currently write-only — see Section L audit)', () => {
    it('is undefined when previousTargetMileage was never snapshotted', () => {
      expect(getServiceDelta(record({ mileageAtService: 55_000 }))).toBeUndefined();
    });

    it('reports "early" when the actual mileage is below the previous cycle target', () => {
      expect(getServiceDelta(record({ mileageAtService: 54_000, previousTargetMileage: 55_000 }))).toEqual({
        kind: 'early',
        km: 1_000,
      });
    });

    it('reports "onTime" when the actual mileage exactly matches the previous cycle target', () => {
      expect(getServiceDelta(record({ mileageAtService: 55_000, previousTargetMileage: 55_000 }))).toEqual({
        kind: 'onTime',
        km: 0,
      });
    });

    it('reports "late" when the actual mileage is above the previous cycle target', () => {
      expect(getServiceDelta(record({ mileageAtService: 56_500, previousTargetMileage: 55_000 }))).toEqual({
        kind: 'late',
        km: 1_500,
      });
    });
  });
});
