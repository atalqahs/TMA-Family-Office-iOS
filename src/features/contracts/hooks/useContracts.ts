import { useCallback, useEffect, useState } from 'react';
import { listActiveContracts } from '../contractRepository';
import type { Contract } from '../types';

/** Loads every contract for the Contracts list page, same shape as useVehicles/useStaffList (a `refresh()` the page calls after add/edit/delete). */
export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setContracts(await listActiveContracts());
    } catch (err) {
      console.error('Failed to load contracts', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { contracts, loading, error, refresh };
}
