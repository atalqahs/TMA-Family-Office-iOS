import { useCallback, useEffect, useState } from 'react';
import { getArchiveCategorySummaries } from '../archiveService';
import type { ArchiveCategorySummary } from '../types';

/** Loads the (dynamic) list of non-empty archive categories for the Archive main page. Same `refresh()`-after-mutation shape as every other list hook. */
export function useArchiveCategories() {
  const [categories, setCategories] = useState<ArchiveCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setCategories(await getArchiveCategorySummaries());
    } catch (err) {
      console.error('Failed to load archive categories', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
}
