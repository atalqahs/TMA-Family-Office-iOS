import { getFamilyMember } from '../../family/familyRepository';
import { listEducationProfiles } from '../../education/educationRepository';
import type { ArchivedCardItem } from '../types';

/** Reuses `listEducationProfiles` (archived included) -- never re-queries IndexedDB itself. Title is resolved from the linked Family Member's own name (an Education profile has no name of its own). */
export async function loadArchivedEducation(): Promise<ArchivedCardItem[]> {
  const all = await listEducationProfiles();
  const archived = all.filter((profile) => profile.archivedAt !== undefined);
  const items = await Promise.all(
    archived.map(async (profile) => {
      const familyMember = await getFamilyMember(profile.familyMemberId);
      return {
        id: profile.id,
        sourceType: 'education' as const,
        title: familyMember?.fullName ?? '',
        archivedAt: profile.archivedAt as string,
        route: `/education/${profile.id}`,
      };
    }),
  );
  return items;
}
