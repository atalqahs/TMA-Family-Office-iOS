import { useCallback, useEffect, useState } from 'react';
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
  const [entries, setEntries] = useState<HealthProfileWithFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const profiles = await listActiveHealthProfiles();
      const familyMembers = await Promise.all(profiles.map((profile) => getFamilyMember(profile.familyMemberId)));
      setEntries(profiles.map((profile, index) => ({ profile, familyMember: familyMembers[index] })));
    } catch (err) {
      console.error('Failed to load health profiles', err);
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
