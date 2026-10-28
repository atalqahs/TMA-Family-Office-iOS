import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { getFamilyMember } from '../../family/familyRepository';
import type { FamilyMember } from '../../family/types';
import { listActiveHealthProfiles } from '../healthRepository';
import type { HealthProfile } from '../types';

export interface HealthProfileWithFamilyMember {
  profile: HealthProfile;
  familyMember: FamilyMember | undefined;
}

/**
 * Loads every active Health profile together with its Family Member
 * identity (photo/name/age), resolved live from Family -- the single
 * source of truth (see HealthProfile's own doc comment). Never stores a
 * copy of that identity data itself.
 */
export function useHealthProfiles() {
  const fetcher = useCallback(async (): Promise<HealthProfileWithFamilyMember[]> => {
    const profiles = await listActiveHealthProfiles();
    const familyMembers = await Promise.all(profiles.map((profile) => getFamilyMember(profile.familyMemberId)));
    return profiles.map((profile, index) => ({ profile, familyMember: familyMembers[index] }));
  }, []);
  const { data: entries, loading, error, refresh } = useAsyncResource<HealthProfileWithFamilyMember[]>(fetcher, []);
  return { entries, loading, error, refresh };
}
