import { listFamilyMembers } from '../../family/familyRepository';
import type { ArchivedCardItem } from '../types';

/** Reuses `listFamilyMembers` (non-deleted, archived included) -- never re-queries IndexedDB itself. */
export async function loadArchivedFamilyMembers(): Promise<ArchivedCardItem[]> {
  const all = await listFamilyMembers();
  return all
    .filter((member) => member.archivedAt !== undefined)
    .map((member) => ({
      id: member.id,
      sourceType: 'family' as const,
      title: member.fullName,
      archivedAt: member.archivedAt as string,
      route: `/family/${member.id}`,
    }));
}
