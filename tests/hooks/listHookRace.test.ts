import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFamilyMembers } from '../../src/features/family/hooks/useFamilyMembers';
import * as familyRepository from '../../src/features/family/familyRepository';
import type { FamilyMember } from '../../src/features/family/types';
import { useVehicles } from '../../src/features/vehicles/hooks/useVehicles';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import type { Vehicle } from '../../src/features/vehicles/types';

/**
 * Maintenance hardening pass: this used to be a Phase 9A "characterization
 * only" test proving that every list hook (useVehicles, useStaffList,
 * useProperties, useFamilyMembers, useContracts, useTasks, useTaskGroups,
 * useEducationProfiles, useHealthProfiles, useArchivedCards,
 * useArchiveCategories, useNotifications) let an older, slower `refresh()`
 * call overwrite a newer one's already-rendered result. All of them now
 * share the same guarded `refresh()` via `useAsyncResource` (see
 * src/hooks/useAsyncResource.ts), the same `requestIdRef` pattern every
 * "detail" hook (useVehicle, useFamilyMember, ...) already used. This test
 * reproduces the race for `useVehicles` as a representative example and
 * now proves the fix: the newer result wins and survives the older one
 * resolving late.
 */
vi.mock('../../src/features/vehicles/vehicleRepository', () => ({
  listActiveVehicles: vi.fn(),
  listAllMaintenanceRecords: vi.fn(),
}));

vi.mock('../../src/features/family/familyRepository', () => ({
  listActiveFamilyMembers: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(vehicleRepository.listAllMaintenanceRecords).mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useVehicles: overlapping refresh() no longer lets a stale response win', () => {
  it('a NEWER refresh() result survives an OLDER, slower one resolving after it', async () => {
    const first = deferred<Vehicle[]>();
    const second = deferred<Vehicle[]>();

    const listVehiclesMock = vi.mocked(vehicleRepository.listActiveVehicles);
    listVehiclesMock.mockReturnValueOnce(first.promise);
    listVehiclesMock.mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useVehicles());

    // The initial mount effect starts the FIRST (soon-to-be-stale) request.
    expect(listVehiclesMock).toHaveBeenCalledTimes(1);

    // A second refresh (e.g. the user pulls to refresh again, or navigates
    // back to this list) starts a NEWER request while the first is still
    // in flight.
    act(() => {
      void result.current.refresh();
    });
    expect(listVehiclesMock).toHaveBeenCalledTimes(2);

    // The NEWER request resolves first (e.g. it's a cheap cached read)...
    await act(async () => {
      second.resolve([{ id: 'new', name: 'New Vehicle', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }]);
    });
    await waitFor(() => expect(result.current.vehicles.map((v) => v.id)).toEqual(['new']));

    // ...and when the OLDER, now-stale request finally resolves too, the
    // guard discards it -- the newer, already-displayed result is never
    // reverted.
    await act(async () => {
      first.resolve([{ id: 'old', name: 'Old Vehicle', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    });
    // Give any (incorrect) pending state update a chance to land, then
    // assert the list still shows the newer result.
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.vehicles.map((v) => v.id)).toEqual(['new']);
  });
});

describe('useFamilyMembers: the exact hook named in the maintenance review now guards overlapping refresh() calls too', () => {
  it('a NEWER refresh() result survives an OLDER, slower one resolving after it', async () => {
    const first = deferred<FamilyMember[]>();
    const second = deferred<FamilyMember[]>();

    const listMembersMock = vi.mocked(familyRepository.listActiveFamilyMembers);
    listMembersMock.mockReturnValueOnce(first.promise);
    listMembersMock.mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useFamilyMembers());
    expect(listMembersMock).toHaveBeenCalledTimes(1);

    act(() => {
      void result.current.refresh();
    });
    expect(listMembersMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.resolve([{ id: 'new', fullName: 'New Member', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }]);
    });
    await waitFor(() => expect(result.current.members.map((m) => m.id)).toEqual(['new']));

    await act(async () => {
      first.resolve([{ id: 'old', fullName: 'Old Member', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.members.map((m) => m.id)).toEqual(['new']);
  });
});
