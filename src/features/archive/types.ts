/**
 * Archive is a DISPLAY/ORGANIZATION STATE of an existing top-level card,
 * never a second record type (see each entity's own `archivedAt` field --
 * Family/Staff/Property/Vehicle/Contract/TaskGroup). This module is a
 * derived aggregator over those six sources, structurally similar to
 * Notifications: nothing here is ever persisted, and archiving/
 * unarchiving only ever mutates the ONE existing record's `archivedAt`
 * field via each domain's own repository (see sources/*ArchiveSource.ts).
 *
 * `ArchivedCardItem` is intentionally NOT a copy of the entity -- just
 * enough to render one row/card and navigate/act on it. `title` is the
 * entity's own already-resolved display text (a name/title field, plain
 * user-entered text -- never a template), except for the one Tasks edge
 * case (the migration-created "General" group), which the UI resolves via
 * `getTaskGroupDisplayName` the same way every other Tasks screen already
 * does (see components/ArchivedCard.tsx).
 */
export type ArchiveSourceType =
  | 'family'
  | 'staff'
  | 'properties'
  | 'vehicles'
  | 'contracts'
  | 'tasks'
  | 'health'
  | 'education';

export interface ArchivedCardItem {
  id: string;
  sourceType: ArchiveSourceType;
  title: string;
  archivedAt: string;
  /** The entity's normal profile/detail route -- informational only. Per the Phase 10 hard rule, Archive never navigates here directly; only Unarchive/Delete Card act on an archived card. */
  route: string;
}

export interface ArchiveCategorySummary {
  sourceType: ArchiveSourceType;
  count: number;
}
