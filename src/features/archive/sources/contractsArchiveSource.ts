import { listContracts } from '../../contracts/contractRepository';
import type { ArchivedCardItem } from '../types';

/** Reuses `listContracts` (non-deleted, archived included) -- never re-queries IndexedDB itself. */
export async function loadArchivedContracts(): Promise<ArchivedCardItem[]> {
  const all = await listContracts();
  return all
    .filter((contract) => contract.archivedAt !== undefined)
    .map((contract) => ({
      id: contract.id,
      sourceType: 'contracts' as const,
      title: contract.title,
      archivedAt: contract.archivedAt as string,
      route: `/contracts/${contract.id}`,
    }));
}
