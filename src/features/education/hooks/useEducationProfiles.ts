import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { getFamilyMember } from '../../family/familyRepository';
import type { FamilyMember } from '../../family/types';
import { listActiveEducationProfiles } from '../educationRepository';
import type { EducationProfile } from '../types';

export interface EducationProfileWithFamilyMember {
  profile: EducationProfile;
  familyMember: FamilyMember | undefined;
}

/**
 * Loads every active Education profile together with its Family Member
 * identity (photo/name), resolved live from Family -- the single source
 * of truth (see EducationProfile's own doc comment). Never stores a copy
 * of that identity data itself.
 */
export function useEducationProfiles() {
  const fetcher = useCallback(async (): Promise<EducationProfileWithFamilyMember[]> => {
    const profiles = await listActiveEducationProfiles();
    const familyMembers = await Promise.all(profiles.map((profile) => getFamilyMember(profile.familyMemberId)));
    return profiles.map((profile, index) => ({ profile, familyMember: familyMembers[index] }));
  }, []);
  const { data: entries, loading, error, refresh } = useAsyncResource<EducationProfileWithFamilyMember[]>(fetcher, []);
  return { entries, loading, error, refresh };
}
