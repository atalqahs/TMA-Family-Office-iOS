import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { getGridRange } from '../../../utils/monthGrid';
import { loadCalendarEvents } from '../calendarService';
import type { CalendarEvent } from '../types';

/**
 * Loads every CalendarEvent whose date falls within `yearMonth`'s full
 * 42-cell grid (not just the exact month -- see `getGridRange`), so every
 * day actually tappable on screen, lead/trail days from adjacent months
 * included, has its events ready. Re-fetches whenever `yearMonth`
 * changes, same `refresh()`-after-mutation shape as every other list hook
 * (useVehicles/useTasks/useNotifications/...).
 */
export function useCalendarEvents(yearMonth: string) {
  const fetcher = useCallback(() => {
    const { start, end } = getGridRange(yearMonth);
    return loadCalendarEvents(start, end);
  }, [yearMonth]);
  const { data: events, loading, error, refresh } = useAsyncResource<CalendarEvent[]>(fetcher, []);
  return { events, loading, error, refresh };
}
