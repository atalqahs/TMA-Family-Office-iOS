import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { getArchivedCardsForSource } from '../archiveService';
import type { ArchivedCardItem, ArchiveSourceType } from '../types';

/** Loads every archived card for one category (ArchiveCategoryPage). Same `refresh()`-after-mutation shape as every other list hook. */
export function useArchivedCards(sourceType: ArchiveSourceType) {
  const fetcher = useCallback(() => getArchivedCardsForSource(sourceType), [sourceType]);
  const { data: cards, loading, error, refresh } = useAsyncResource<ArchivedCardItem[]>(fetcher, []);
  return { cards, loading, error, refresh };
}
