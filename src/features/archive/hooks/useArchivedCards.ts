import { useCallback, useEffect, useState } from 'react';
import { getArchivedCardsForSource } from '../archiveService';
import type { ArchivedCardItem, ArchiveSourceType } from '../types';

/** Loads every archived card for one category (ArchiveCategoryPage). Same `refresh()`-after-mutation shape as every other list hook. */
export function useArchivedCards(sourceType: ArchiveSourceType) {
  const [cards, setCards] = useState<ArchivedCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setCards(await getArchivedCardsForSource(sourceType));
    } catch (err) {
      console.error('Failed to load archived cards', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sourceType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { cards, loading, error, refresh };
}
