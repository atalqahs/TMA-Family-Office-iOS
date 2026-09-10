import { useCallback, useEffect, useState } from 'react';
import { getSetting, setSetting } from '../storage/db';

/**
 * Reads/writes a single key in the IndexedDB `settings` store, keeping a
 * React state value in sync. `ready` becomes true once the persisted value
 * has been loaded, so callers can avoid flashing the default before it.
 */
export function usePersistentSetting<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSetting<T>(key, fallback).then((stored) => {
      if (!cancelled) {
        setValue(stored);
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
      void setSetting(key, next);
    },
    [key],
  );

  return { value, setValue: update, ready };
}
