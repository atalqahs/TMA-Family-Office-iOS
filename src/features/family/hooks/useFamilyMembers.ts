import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listActiveFamilyMembers } from '../familyRepository';
import type { FamilyMember } from '../types';

export function useFamilyMembers() {
  const fetcher = useCallback(() => listActiveFamilyMembers(), []);
  const { data: members, loading, error, refresh } = useAsyncResource<FamilyMember[]>(fetcher, []);
  return { members, loading, error, refresh };
}
