import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
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
  const fetcher = useCallback(() => loadNotifications(), []);
  const { data: items, loading, error, refresh } = useAsyncResource<NotificationItem[]>(fetcher, []);
  return { items, loading, error, refresh };
}
