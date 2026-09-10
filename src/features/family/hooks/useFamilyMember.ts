import { useCallback, useEffect, useState } from 'react';
import { getFamilyMember, listDocumentsForMember } from '../familyRepository';
import type { FamilyMember, FamilyMemberDocument } from '../types';

/** `member` is `undefined` while loading, `null` if not found (or deleted). */
export function useFamilyMember(memberId: string | undefined) {
  const [member, setMember] = useState<FamilyMember | null | undefined>(undefined);
  const [documents, setDocuments] = useState<FamilyMemberDocument[]>([]);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!memberId) {
      setMember(null);
      return;
    }
    try {
      const [foundMember, docs] = await Promise.all([getFamilyMember(memberId), listDocumentsForMember(memberId)]);
      setMember(foundMember ?? null);
      setDocuments(docs);
      setError(false);
    } catch (err) {
      console.error('Failed to load family member', err);
      setError(true);
      setMember(null);
    }
  }, [memberId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { member, documents, loading: member === undefined, error, refresh };
}
