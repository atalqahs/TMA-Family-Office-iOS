import { listAllTaskGroups } from '../../tasks/taskRepository';
import type { ArchivedCardItem } from '../types';

/**
 * Reuses `listAllTaskGroups` (non-deleted, archived included) -- never
 * re-queries IndexedDB itself. Archive applies to the GROUP only, never
 * individual Tasks (see TaskGroup's own doc comment) -- `title` is the
 * group's raw stored `name`; the one exception (the migration-created
 * "General" group) is resolved at render time by ArchivedCard the same
 * way every other Tasks screen already does (getTaskGroupDisplayName),
 * so this source stays free of any localization dependency.
 */
export async function loadArchivedTaskGroups(): Promise<ArchivedCardItem[]> {
  const all = await listAllTaskGroups();
  return all
    .filter((group) => group.archivedAt !== undefined)
    .map((group) => ({
      id: group.id,
      sourceType: 'tasks' as const,
      title: group.name,
      archivedAt: group.archivedAt as string,
      route: `/tasks/group/${group.id}`,
    }));
}
