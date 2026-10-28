import { useCallback, useEffect, useRef, useState } from 'react';
import { getContract, listDocumentsForContract } from '../contractRepository';
import type { Contract, ContractDocument } from '../types';

/**
 * `contract` is `undefined` while loading, `null` if not found (or
 * deleted). `contractId` can change while a fetch for the previous id is
 * still in flight; `requestIdRef` tags each fetch and discards any result
 * that isn't the most recently started one (same guard as
 * useVehicle/useStaffMember/useProperty/useFamilyMember).
 */
export function useContract(contractId: string | undefined) {
  const [contract, setContract] = useState<Contract | null | undefined>(undefined);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!contractId) {
      if (requestId === requestIdRef.current) setContract(null);
      return;
    }
    try {
      const [found, docs] = await Promise.all([getContract(contractId), listDocumentsForContract(contractId)]);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setContract(found ?? null);
      setDocuments(docs);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load contract', err);
      setError(true);
      setContract(null);
    }
  }, [contractId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { contract, documents, loading: contract === undefined, error, refresh };
}
