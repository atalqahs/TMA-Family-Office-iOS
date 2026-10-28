import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listQuickNotes } from '../quickNotesRepository';
import type { QuickNote } from '../types';

/** Loads every Quick Note, same `refresh()`-after-mutation shape as every other list hook (useTaskGroups/useVehicles/...). */
export function useQuickNotes() {
  const fetcher = useCallback(() => listQuickNotes(), []);
  const { data: notes, loading, error, refresh } = useAsyncResource<QuickNote[]>(fetcher, []);
  return { notes, loading, error, refresh };
}
