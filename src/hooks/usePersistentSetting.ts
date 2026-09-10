import { useCallback, useEffect, useState } from 'react';
import { getSetting, setSetting } from '../storage/db';

/**
 * Reads/writes a single key in the IndexedDB `settings` store, keeping a
 * React state value in sync. `ready` becomes true once the persisted value
 * has been loaded (or has failed to load), so callers can avoid flashing
 * the default before it — and never hang forever if IndexedDB is
 * unavailable (private browsing, quota errors, etc.): a failed read falls
 * back to `fallback` and still marks `ready`.
 */
export function usePersistentSetting<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSetting<T>(key, fallback)
      .then((stored) => {
        if (!cancelled) {
          setValue(stored);
          setReady(true);
        }
      })
      .catch((error) => {
        console.error(`Failed to read persisted setting "${key}"`, error);
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      setSetting(key, next).catch((error) => {
        console.error(`Failed to persist setting "${key}"`, error);
      });
    },
    [key],
  );

  return { value, setValue: update, ready };
}
