import { useCallback, useEffect, useState } from 'react';
import { listActiveFamilyMembers } from '../familyRepository';
import type { FamilyMember } from '../types';

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await listActiveFamilyMembers();
      setMembers(result);
    } catch (err) {
      console.error('Failed to load family members', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { members, loading, error, refresh };
}
