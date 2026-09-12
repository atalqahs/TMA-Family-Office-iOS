import { getFamilyMember } from '../../family/familyRepository';
import { listHealthProfiles } from '../../health/healthRepository';
import type { ArchivedCardItem } from '../types';

/** Reuses `listHealthProfiles` (archived included) -- never re-queries IndexedDB itself. Title is resolved from the linked Family Member's own name (a Health profile has no name of its own). */
export async function loadArchivedHealth(): Promise<ArchivedCardItem[]> {
  const all = await listHealthProfiles();
  const archived = all.filter((profile) => profile.archivedAt !== undefined);
  const items = await Promise.all(
    archived.map(async (profile) => {
      const familyMember = await getFamilyMember(profile.familyMemberId);
      return {
        id: profile.id,
        sourceType: 'health' as const,
        title: familyMember?.fullName ?? '',
        archivedAt: profile.archivedAt as string,
        route: `/health/${profile.id}`,
      };
    }),
  );
  return items;
}
