import { useCallback, useEffect, useState } from 'react';
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
  const [entries, setEntries] = useState<EducationProfileWithFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const profiles = await listActiveEducationProfiles();
      const familyMembers = await Promise.all(profiles.map((profile) => getFamilyMember(profile.familyMemberId)));
      setEntries(profiles.map((profile, index) => ({ profile, familyMember: familyMembers[index] })));
    } catch (err) {
      console.error('Failed to load education profiles', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, loading, error, refresh };
}
