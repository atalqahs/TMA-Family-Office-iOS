import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVehicles } from '../../src/features/vehicles/hooks/useVehicles';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import type { Vehicle } from '../../src/features/vehicles/types';

/**
 * Phase 9A, Section N: characterization only — NOT a refactor. Every
 * "list" hook (useVehicles, useStaffList, useProperties, useFamilyMembers,
 * useContracts, useTasks, useTaskGroups) fetches via a `refresh()` callback
 * with no stale-request guard, unlike every "detail" hook (useVehicle,
 * useStaffMember, useProperty, useFamilyMember, useContract, useTask),
 * which all tag each fetch with a `requestIdRef` and discard any result
 * that isn't from the most recently started request (see each hook's own
 * doc comment). This test reproduces the concrete failure this gap allows
 * for `useVehicles`, chosen as a representative example — the same
 * structural gap exists identically in every other list hook named above.
 */
vi.mock('../../src/features/vehicles/vehicleRepository', () => ({
  listVehicles: vi.fn(),
  listAllMaintenanceRecords: vi.fn(),
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

describe('useVehicles: no stale-request guard (unlike the detail hooks)', () => {
  it('CURRENT BEHAVIOR: an OLDER in-flight refresh() that resolves LAST overwrites the NEWER one’s already-rendered result', async () => {
    const first = deferred<Vehicle[]>();
    const second = deferred<Vehicle[]>();

    const listVehiclesMock = vi.mocked(vehicleRepository.listVehicles);
    listVehiclesMock.mockReturnValueOnce(first.promise);
    listVehiclesMock.mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useVehicles());

    // The initial mount effect starts the FIRST (soon-to-be-stale) request.
    expect(listVehiclesMock).toHaveBeenCalledTimes(1);

    // A second refresh (e.g. the user pulls to refresh again, or navigates
    // back to this list) starts a NEWER request while the first is still
    // in flight -- exactly the race window a `requestIdRef` guard closes
    // on every detail hook, but no list hook has one.
    act(() => {
      void result.current.refresh();
    });
    expect(listVehiclesMock).toHaveBeenCalledTimes(2);

    // The NEWER request resolves first (e.g. it's a cheap cached read)...
    await act(async () => {
      second.resolve([{ id: 'new', name: 'New Vehicle', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }]);
    });
    await waitFor(() => expect(result.current.vehicles.map((v) => v.id)).toEqual(['new']));

    // ...but then the OLDER, now-stale request finally resolves too, and
    // with no guard in place it unconditionally overwrites the state --
    // silently reverting the list back to stale data despite a newer,
    // already-displayed result existing.
    await act(async () => {
      first.resolve([{ id: 'old', name: 'Old Vehicle', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    });
    await waitFor(() => expect(result.current.vehicles.map((v) => v.id)).toEqual(['old']));
  });
});
