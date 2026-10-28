import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shared fetch-on-mount + refresh-on-demand hook used by every list hook
 * (useVehicles, useStaffList, useTasks, useFamilyMembers, ...). Every one
 * of those hooks used to hand-roll the same `loading`/`error`/`refresh`
 * plumbing, and all of them shared the same bug: `refresh()` is exposed
 * for pages to call again after a mutation (add/edit/delete), but nothing
 * stopped two overlapping calls from racing -- a slow earlier call could
 * resolve AFTER a faster later one and overwrite the current state with
 * stale data. `requestIdRef` tags each call and discards any result that
 * isn't from the most recently started one, the same guard already used
 * by the single-record hooks (useFamilyMember, useVehicle, ...) for their
 * own id-changing race.
 *
 * `fetcher` must be a stable (memoized) function -- pass it via
 * `useCallback` with whatever dependencies it actually reads, exactly as
 * you would for `useEffect`/`useMemo`. It may resolve to any shape (a
 * single list, or several derived maps bundled into one object); this
 * hook only sequences the calls, it has no opinion on the domain shape.
 */
export function useAsyncResource<T>(fetcher: () => Promise<T>, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);
    try {
      const result = await fetcher();
      if (requestId !== requestIdRef.current) return; // superseded by a newer call
      setData(result);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load resource', err);
      setError(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
