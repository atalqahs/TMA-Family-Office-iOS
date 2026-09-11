import { useCallback, useEffect, useState } from 'react';
import { loadNotifications } from '../notificationService';
import type { NotificationItem } from '../types';

/**
 * Loads the current derived notification list, same `refresh()`-after-
 * mutation shape as every other list hook (useVehicles/useTasks/...). A
 * load failure (any source repository rejecting) sets `error` rather than
 * silently reporting an empty list -- the page shows the same load-error
 * message every other list page already shows (Phase 9B spec Section X).
 */
export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await loadNotifications());
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
