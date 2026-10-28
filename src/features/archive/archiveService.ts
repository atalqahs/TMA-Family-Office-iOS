import { loadArchivedContracts } from './sources/contractsArchiveSource';
import { loadArchivedEducation } from './sources/educationArchiveSource';
import { loadArchivedFamilyMembers } from './sources/familyArchiveSource';
import { loadArchivedHealth } from './sources/healthArchiveSource';
import { loadArchivedProperties } from './sources/propertiesArchiveSource';
import { loadArchivedStaff } from './sources/staffArchiveSource';
import { loadArchivedTaskGroups } from './sources/tasksArchiveSource';
import { loadArchivedVehicles } from './sources/vehiclesArchiveSource';
import type { ArchivedCardItem, ArchiveCategorySummary, ArchiveSourceType } from './types';

/**
 * Bulk-loads every archive-capable source's own archived items in parallel
 * (the exact same repository read each source's own active-list hook
 * already uses -- see sources/*ArchiveSource.ts), keyed by source type. If
 * any source fails to load, this rejects rather than silently reporting
 * an empty Archive (same convention as notificationService.ts).
 */
async function loadArchivedCardsByType(): Promise<Record<ArchiveSourceType, ArchivedCardItem[]>> {
  const [family, staff, properties, vehicles, contracts, tasks, health, education] = await Promise.all([
    loadArchivedFamilyMembers(),
    loadArchivedStaff(),
    loadArchivedProperties(),
    loadArchivedVehicles(),
    loadArchivedContracts(),
    loadArchivedTaskGroups(),
    loadArchivedHealth(),
    loadArchivedEducation(),
  ]);
  return { family, staff, properties, vehicles, contracts, tasks, health, education };
}

/**
 * Only the categories that currently contain at least one archived card,
 * with its count -- this is what makes the Archive main page dynamic
 * (Phase 10 Section L): a category with zero archived cards is simply
 * absent from the result, never a placeholder.
 */
export async function getArchiveCategorySummaries(): Promise<ArchiveCategorySummary[]> {
  const byType = await loadArchivedCardsByType();
  return (Object.entries(byType) as Array<[ArchiveSourceType, ArchivedCardItem[]]>)
    .map(([sourceType, items]) => ({ sourceType, count: items.length }))
    .filter((summary) => summary.count > 0);
}

/** Every archived card for exactly one source/category -- for the ArchiveCategoryPage list. */
export async function getArchivedCardsForSource(sourceType: ArchiveSourceType): Promise<ArchivedCardItem[]> {
  const byType = await loadArchivedCardsByType();
  return byType[sourceType];
}

/**
 * The total number of archived top-level cards across every source (never
 * the number of categories) -- the derived Archive badge/dashboard count.
 * Never persisted, always recomputed from current source state.
 */
export async function getTotalArchivedCardCount(): Promise<number> {
  const byType = await loadArchivedCardsByType();
  return Object.values(byType).reduce((sum, items) => sum + items.length, 0);
}
