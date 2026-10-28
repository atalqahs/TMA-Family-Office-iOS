import { describe, expect, it } from 'vitest';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import type { Vehicle, VehicleDocument, VehicleMaintenanceRecord } from '../../src/features/vehicles/types';

function vehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v1',
    name: 'Family SUV',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function maintenanceRecord(overrides: Partial<VehicleMaintenanceRecord> = {}): VehicleMaintenanceRecord {
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

describe('saveMaintenanceRecordAndSyncVehicleMileage: atomicity', () => {
  it('commits both the maintenance record and the vehicle mileage bump together', async () => {
    await vehicleRepository.saveVehicle(vehicle({ currentMileage: 50_000 }));
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
      maintenanceRecord({ mileageAtService: 60_000 }),
      (v) => (v.currentMileage !== undefined && 60_000 > v.currentMileage ? 60_000 : undefined),
    );

    const savedRecord = await vehicleRepository.getMaintenanceRecord('m1');
    const savedVehicle = await vehicleRepository.getVehicle('v1');
    expect(savedRecord).toBeDefined();
    expect(savedVehicle?.currentMileage).toBe(60_000);
  });

  it('aborts the ENTIRE write — no orphan maintenance record — when the referenced vehicle does not exist', async () => {
    await expect(
      vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
        maintenanceRecord({ vehicleId: 'missing-vehicle' }),
        () => undefined,
      ),
    ).rejects.toThrow(/not found/i);

    const orphan = await vehicleRepository.getMaintenanceRecord('m1');
    expect(orphan).toBeUndefined();
  });

  it('never changes vehicle mileage when the sync function returns undefined ("no change")', async () => {
    await vehicleRepository.saveVehicle(vehicle({ currentMileage: 70_000 }));
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(maintenanceRecord(), () => undefined);
    const savedVehicle = await vehicleRepository.getVehicle('v1');
    expect(savedVehicle?.currentMileage).toBe(70_000);
  });
});

describe('deleteVehicleWithChildren: cascade correctness', () => {
  it('deletes the vehicle and every one of its documents and maintenance records atomically', async () => {
    await vehicleRepository.saveVehicle(vehicle());
    const doc: VehicleDocument = {
      id: 'd1',
      vehicleId: 'v1',
      type: 'registration',
      title: 'Registration',
      file: new Blob(['x']),
      fileName: 'reg.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await vehicleRepository.saveVehicleDocument(doc);
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(maintenanceRecord(), () => undefined);

    await vehicleRepository.deleteVehicleWithChildren('v1');

    expect(await vehicleRepository.getVehicle('v1')).toBeUndefined();
    expect(await vehicleRepository.listDocumentsForVehicle('v1')).toEqual([]);
    expect(await vehicleRepository.listMaintenanceForVehicle('v1')).toEqual([]);
  });

  it('never touches another vehicle’s documents/maintenance records', async () => {
    await vehicleRepository.saveVehicle(vehicle({ id: 'v1' }));
    await vehicleRepository.saveVehicle(vehicle({ id: 'v2' }));
    await vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(
      maintenanceRecord({ id: 'm-v2', vehicleId: 'v2' }),
      () => undefined,
    );

    await vehicleRepository.deleteVehicleWithChildren('v1');

    expect(await vehicleRepository.getVehicle('v2')).toBeDefined();
    expect(await vehicleRepository.listMaintenanceForVehicle('v2')).toHaveLength(1);
  });
});
