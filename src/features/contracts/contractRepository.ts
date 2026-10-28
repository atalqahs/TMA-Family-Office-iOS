import { getDB } from '../../storage/db';
import type { Contract, ContractDocument } from './types';

/**
 * All IndexedDB access for the Contracts module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `contractService.ts`, which builds
 * on it) instead.
 */

/** Every contract, ARCHIVED ONES INCLUDED -- the read path for Notifications/Archive, which must see archived records too (see features/archive/, features/notifications/). */
export async function listContracts(): Promise<Contract[]> {
  const db = await getDB();
  const all = await db.getAll('contracts');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Non-archived -- the normal active Contracts list. Centralized here so no component ever filters `archivedAt` itself. */
export async function listActiveContracts(): Promise<Contract[]> {
  const all = await listContracts();
  return all.filter((contract) => !contract.archivedAt);
}

export async function getContract(id: string): Promise<Contract | undefined> {
  const db = await getDB();
  return db.get('contracts', id);
}

export async function saveContract(contract: Contract): Promise<void> {
  const db = await getDB();
  await db.put('contracts', contract);
}

export async function getActiveContractCount(): Promise<number> {
  const all = await listActiveContracts();
  return all.length;
}

/** Sets `archivedAt` -- a display/organization change only, never touching any other field. */
export async function archiveContract(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('contracts', id);
  if (!existing) return;
  await db.put('contracts', { ...existing, archivedAt: new Date().toISOString() });
}

/** Clears `archivedAt`, returning the contract to the active list exactly as it was -- never recreates/copies the record. */
export async function unarchiveContract(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('contracts', id);
  if (!existing) return;
  const { archivedAt: _archivedAt, ...rest } = existing;
  await db.put('contracts', rest);
}

export async function listDocumentsForContract(contractId: string): Promise<ContractDocument[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('contractDocuments', 'contractId', contractId);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveContractDocument(document: ContractDocument): Promise<void> {
  const db = await getDB();
  await db.put('contractDocuments', document);
}

export async function deleteContractDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('contractDocuments', id);
}

/**
 * Direct, permanent delete (acceptable for this experimental prototype).
 * Deletes the contract and every document that belongs to it in a single
 * IndexedDB transaction spanning both stores, so the operation either
 * fully commits or fully rolls back — never leaving orphaned documents.
 *
 * This only removes the Contract's own records. It never touches the
 * linked Property/Vehicle/Staff/Family entity (if any) — deleting a
 * Contract removes only the relationship from the Contract side.
 */
export async function deleteContractWithChildren(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['contracts', 'contractDocuments'], 'readwrite');
  const documentsStore = tx.objectStore('contractDocuments');

  const documentIds = await documentsStore.index('contractId').getAllKeys(id);

  await Promise.all([
    tx.objectStore('contracts').delete(id),
    ...documentIds.map((documentId) => documentsStore.delete(documentId)),
  ]);
  await tx.done;
}
