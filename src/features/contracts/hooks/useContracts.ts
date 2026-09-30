import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listActiveContracts } from '../contractRepository';
import type { Contract } from '../types';

/** Loads every contract for the Contracts list page, same shape as useVehicles/useStaffList (a `refresh()` the page calls after add/edit/delete). */
export function useContracts() {
  const fetcher = useCallback(() => listActiveContracts(), []);
  const { data: contracts, loading, error, refresh } = useAsyncResource<Contract[]>(fetcher, []);
  return { contracts, loading, error, refresh };
}
