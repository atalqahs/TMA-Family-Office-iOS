/**
 * Item count for a category. Always 0 for now — no entity stores exist
 * yet (Phase 2 is app shell + navigation only). Once a category gets its
 * own IndexedDB store, this is the single place to wire up a live count
 * without touching CategoryCard, the Dashboard, or the header badge.
 */
export function useCategoryCount(_categoryId: string): number {
  return 0;
}
