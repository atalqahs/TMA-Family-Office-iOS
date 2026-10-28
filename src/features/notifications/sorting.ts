import type { NotificationItem } from './types';

/**
 * One centralized, deterministic sort -- never incidental IndexedDB
 * ordering. Priority tiers (Phase 9B spec Section K):
 *   1. critical (overdue/expired)
 *   2. due-today tasks specifically (a distinct tier between critical and
 *      the general "warning" bucket, even though its own `severity` is
 *      'warning' for badge/color purposes -- the model deliberately keeps
 *      only 3 severities, so this one tier gets a `kind`-based exception
 *      here rather than a 4th severity value)
 *   3. warning (expiring soon / approaching maintenance / salary due)
 *   4. info
 * Within a tier, the nearest/oldest relevant date sorts first (ascending
 * 'YYYY-MM-DD' comparison serves both "most overdue first" and "soonest
 * upcoming first" identically). Undated items within a tier sort after
 * dated ones. Final tie-break is fully deterministic (source, kind,
 * title, id) so re-renders/reloads can never reorder two otherwise-equal
 * items.
 */
function getSortPriority(item: NotificationItem): number {
  if (item.severity === 'critical') return 0;
  if (item.kind === 'taskDueToday') return 1;
  if (item.severity === 'warning') return 2;
  return 3;
}

export function sortNotificationItems(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => {
    const priorityDiff = getSortPriority(a) - getSortPriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const aDate = a.sortDate ?? a.effectiveDate;
    const bDate = b.sortDate ?? b.effectiveDate;
    if (aDate !== undefined && bDate !== undefined && aDate !== bDate) {
      return aDate.localeCompare(bDate);
    }
    if (aDate !== undefined && bDate === undefined) return -1;
    if (aDate === undefined && bDate !== undefined) return 1;

    const sourceDiff = a.sourceType.localeCompare(b.sourceType);
    if (sourceDiff !== 0) return sourceDiff;
    const kindDiff = a.kind.localeCompare(b.kind);
    if (kindDiff !== 0) return kindDiff;
    const titleDiff = a.titleKey.localeCompare(b.titleKey);
    if (titleDiff !== 0) return titleDiff;
    return a.id.localeCompare(b.id);
  });
}

/** Deterministic de-duplication by id -- the same underlying condition (same deterministic id) can never appear twice, regardless of source-adapter overlap or repeated aggregation. */
export function dedupeNotificationItems(items: NotificationItem[]): NotificationItem[] {
  const byId = new Map<string, NotificationItem>();
  for (const item of items) {
    byId.set(item.id, item);
  }
  return [...byId.values()];
}
