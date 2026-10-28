import { describe, expect, it } from 'vitest';
import * as propertyRepository from '../../src/features/properties/propertyRepository';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import * as staffRepository from '../../src/features/staff/staffRepository';
import type { PropertyDocument } from '../../src/features/properties/types';
import type { VehicleDocument, VehicleMaintenanceRecord } from '../../src/features/vehicles/types';
import type { StaffDocument } from '../../src/features/staff/types';

/**
 * Phase 9A, Section K: characterization only — NOT a refactor. Documents
 * every module's own child-document save function does NOT re-verify the
 * parent still exists before writing (unlike the atomic existence-guard
 * pattern proven for Vehicle maintenance + mileage sync, Task completion,
 * and the Task group guard — see vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage
 * / taskRepository.completeTaskOccurrence / taskRepository.saveTaskWithGroupGuard).
 *
 * The race: a document upload is in flight (already validated against a
 * real, existing parent) at the exact moment the parent is deleted from
 * another part of the UI; the stale upload then completes and writes a
 * document row referencing a now-nonexistent parent id. These tests
 * reproduce that sequence deterministically (delete-then-write, no timing
 * flakiness needed since the race's OUTCOME is what's under test, not its
 * timing) and record the CURRENT behavior: the orphan document IS created.
 */

describe('Property documents (simple case): orphan-race characterization', () => {
  it('CURRENT BEHAVIOR: a document save completes successfully even after its parent Property has been deleted, creating an orphan', async () => {
    await propertyRepository.saveProperty({
      id: 'p1',
      name: 'Family Villa',
      type: 'house',
      status: 'owned',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    // The parent is deleted "concurrently" (e.g. from another tab/screen)
    // while a document upload for it was already in flight.
    await propertyRepository.deletePropertyWithDocuments('p1');

    const staleDocument: PropertyDocument = {
      id: 'd1',
      propertyId: 'p1', // the now-deleted parent
      type: 'other',
      title: 'Late upload',
      file: new Blob(['x']),
      fileName: 'late.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      createdAt: '2026-01-01T00:00:01.000Z',
      updatedAt: '2026-01-01T00:00:01.000Z',
    };
    // No existence guard in propertyRepository.savePropertyDocument -- this
    // resolves successfully rather than rejecting.
    await expect(propertyRepository.savePropertyDocument(staleDocument)).resolves.toBeUndefined();

    // The orphan is real and permanently unreachable via its parent.
    const orphaned = await propertyRepository.listDocumentsForProperty('p1');
    expect(orphaned).toHaveLength(1);
    expect(await propertyRepository.getProperty('p1')).toBeUndefined();
  });
});

describe('Vehicle documents/maintenance (complex case, two sibling child stores with DIFFERENT guarantees)', () => {
  it('CURRENT BEHAVIOR: vehicleDocuments has the SAME orphan-race as Property (no existence guard)', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Family SUV',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await vehicleRepository.deleteVehicleWithChildren('v1');

    const staleDocument: VehicleDocument = {
      id: 'd1',
      vehicleId: 'v1',
      type: 'other',
      title: 'Late upload',
      file: new Blob(['x']),
      fileName: 'late.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      createdAt: '2026-01-01T00:00:01.000Z',
      updatedAt: '2026-01-01T00:00:01.000Z',
    };
    await expect(vehicleRepository.saveVehicleDocument(staleDocument)).resolves.toBeUndefined();
    expect(await vehicleRepository.listDocumentsForVehicle('v1')).toHaveLength(1);
  });

  it('CONTRAST: vehicleMaintenanceRecords does NOT have this race — it already uses the atomic existence-guard pattern', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Family SUV',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await vehicleRepository.deleteVehicleWithChildren('v1');

    const staleRecord: VehicleMaintenanceRecord = {
      id: 'm1',
      vehicleId: 'v1',
      type: 'oilChange',
      title: 'Late maintenance entry',
      serviceDate: '2026-01-01',
      createdAt: '2026-01-01T00:00:01.000Z',
      updatedAt: '2026-01-01T00:00:01.000Z',
    };
    await expect(
      vehicleRepository.saveMaintenanceRecordAndSyncVehicleMileage(staleRecord, () => undefined),
    ).rejects.toThrow(/not found/i);
    expect(await vehicleRepository.listMaintenanceForVehicle('v1')).toEqual([]);
  });
});

describe('Staff documents: same orphan-race pattern as Property/Vehicle documents', () => {
  it('CURRENT BEHAVIOR: a document save completes even after its parent Staff member has been deleted', async () => {
    await staffRepository.saveStaffMember({
      id: 's1',
      fullName: 'Ahmed',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await staffRepository.deleteStaffWithChildren('s1');

    const staleDocument: StaffDocument = {
      id: 'd1',
      staffId: 's1',
      type: 'other',
      title: 'Late upload',
      file: new Blob(['x']),
      fileName: 'late.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      createdAt: '2026-01-01T00:00:01.000Z',
      updatedAt: '2026-01-01T00:00:01.000Z',
    };
    await expect(staffRepository.saveStaffDocument(staleDocument)).resolves.toBeUndefined();
    expect(await staffRepository.listDocumentsForStaff('s1')).toHaveLength(1);
  });
});
