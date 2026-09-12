import { useCallback, useEffect, useRef, useState } from 'react';
import { getFamilyMember } from '../../family/familyRepository';
import type { FamilyMember } from '../../family/types';
import { getHealthProfile, listDocumentsForHealthProfile } from '../healthRepository';
import type { HealthDocument, HealthProfile } from '../types';

/**
 * `profile` is `undefined` while loading, `null` if not found. Resolves
 * the linked Family Member's identity live from Family -- the single
 * source of truth -- alongside the profile's own Health-specific fields
 * and documents.
 *
 * `profileId` can change while a fetch for the previous id is still in
 * flight; `requestIdRef` tags each fetch and discards any result that
 * isn't the most recently started one (same guard as useStaffMember/
 * useFamilyMember/useVehicle).
 */
export function useHealthProfile(profileId: string | undefined) {
  const [profile, setProfile] = useState<HealthProfile | null | undefined>(undefined);
  const [familyMember, setFamilyMember] = useState<FamilyMember | undefined>(undefined);
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!profileId) {
      if (requestId === requestIdRef.current) setProfile(null);
      return;
    }
    try {
      const foundProfile = await getHealthProfile(profileId);
      if (requestId !== requestIdRef.current) return;
      if (!foundProfile) {
        setProfile(null);
        return;
      }
      const [member, docs] = await Promise.all([
        getFamilyMember(foundProfile.familyMemberId),
        listDocumentsForHealthProfile(profileId),
      ]);
      if (requestId !== requestIdRef.current) return;
      setProfile(foundProfile);
      setFamilyMember(member);
      setDocuments(docs);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load health profile', err);
      setError(true);
      setProfile(null);
    }
  }, [profileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, familyMember, documents, loading: profile === undefined, error, refresh };
}
