import { useCallback, useEffect, useState } from 'react';
import { getSetting, setSetting } from '../storage/db';

/**
 * Reads/writes a single key in the IndexedDB `settings` store, keeping a
 * React state value in sync. `ready` becomes true once the persisted value
 * has been loaded (or has failed to load), so callers can avoid flashing
 * the default before it — and never hang forever if IndexedDB is
 * unavailable (private browsing, quota errors, etc.): a failed read falls
 * back to `fallback` and still marks `ready`.
 *
 * Writes persist first and only commit to React state once the IndexedDB
 * write actually succeeds, so the UI can never show a value that wasn't
 * durably saved. `saveError` is set when the most recent write failed, so
 * callers can surface a message instead of pretending it worked.
 */
export function usePersistentSetting<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);

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
    async (next: T) => {
      try {
        await setSetting(key, next);
        setValue(next);
        setSaveError(false);
        return true;
      } catch (error) {
        console.error(`Failed to persist setting "${key}"`, error);
        setSaveError(true);
        return false;
      }
    },
    [key],
  );

  return { value, setValue: update, ready, saveError };
}
