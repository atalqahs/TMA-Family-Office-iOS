import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { getArchiveCategorySummaries } from '../archiveService';
import type { ArchiveCategorySummary } from '../types';

/** Loads the (dynamic) list of non-empty archive categories for the Archive main page. Same `refresh()`-after-mutation shape as every other list hook. */
export function useArchiveCategories() {
  const fetcher = useCallback(() => getArchiveCategorySummaries(), []);
  const { data: categories, loading, error, refresh } = useAsyncResource<ArchiveCategorySummary[]>(fetcher, []);
  return { categories, loading, error, refresh };
}
