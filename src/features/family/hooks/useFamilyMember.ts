import { useCallback, useEffect, useRef, useState } from 'react';
import { getFamilyMember, listDocumentsForMember } from '../familyRepository';
import type { FamilyMember, FamilyMemberDocument } from '../types';

/**
 * `member` is `undefined` while loading, `null` if not found (or deleted).
 *
 * `memberId` can change (navigating from one member's profile straight to
 * another's) while a fetch for the previous id is still in flight. Without
 * a guard, a slow request for the OLD id could resolve after a faster
 * request for the NEW id and overwrite it with the wrong member's data.
 * `requestIdRef` tags each fetch and discards any result that isn't the
 * most recently started one.
 */
export function useFamilyMember(memberId: string | undefined) {
  const [member, setMember] = useState<FamilyMember | null | undefined>(undefined);
  const [documents, setDocuments] = useState<FamilyMemberDocument[]>([]);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!memberId) {
      if (requestId === requestIdRef.current) setMember(null);
      return;
    }
    try {
      const [foundMember, docs] = await Promise.all([getFamilyMember(memberId), listDocumentsForMember(memberId)]);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setMember(foundMember ?? null);
      setDocuments(docs);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
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
