import { getDB } from '../../storage/db';
import type { HealthDocument, HealthProfile } from './types';

/**
 * All IndexedDB access for the Health module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `healthService.ts`, which builds on
 * it) instead.
 */

/** Every Health profile, ARCHIVED ONES INCLUDED -- the read path for Notifications/Archive, which must see archived records too (see features/archive/). */
export async function listHealthProfiles(): Promise<HealthProfile[]> {
  const db = await getDB();
  const all = await db.getAll('healthProfiles');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Non-archived -- the normal active Health list/count. Centralized here so no component ever filters `archivedAt` itself. */
export async function listActiveHealthProfiles(): Promise<HealthProfile[]> {
  const all = await listHealthProfiles();
  return all.filter((profile) => !profile.archivedAt);
}

export async function getHealthProfile(id: string): Promise<HealthProfile | undefined> {
  const db = await getDB();
  return db.get('healthProfiles', id);
}

/** At most one Health profile may exist per Family Member -- also enforced atomically by the unique `familyMemberId` IndexedDB index (see storage/db.ts), this is the read-side lookup used to guide the user to an existing profile instead of creating a duplicate. */
export async function getHealthProfileForFamilyMember(familyMemberId: string): Promise<HealthProfile | undefined> {
  const db = await getDB();
  return db.getFromIndex('healthProfiles', 'familyMemberId', familyMemberId);
}

export async function saveHealthProfile(profile: HealthProfile): Promise<void> {
  const db = await getDB();
  await db.put('healthProfiles', profile);
}

export async function getActiveHealthProfileCount(): Promise<number> {
  const all = await listActiveHealthProfiles();
  return all.length;
}

/** Sets `archivedAt` -- a display/organization change only, never touching any other field, never the linked Family Member or Education profile. */
export async function archiveHealthProfile(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('healthProfiles', id);
  if (!existing) return;
  await db.put('healthProfiles', { ...existing, archivedAt: new Date().toISOString() });
}

/** Clears `archivedAt`, returning the profile to the active list exactly as it was -- never recreates/copies the record. */
export async function unarchiveHealthProfile(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('healthProfiles', id);
  if (!existing) return;
  const { archivedAt: _archivedAt, ...rest } = existing;
  await db.put('healthProfiles', rest);
}

export async function listDocumentsForHealthProfile(healthProfileId: string): Promise<HealthDocument[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('healthDocuments', 'healthProfileId', healthProfileId);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveHealthDocument(document: HealthDocument): Promise<void> {
  const db = await getDB();
  await db.put('healthDocuments', document);
}

export async function deleteHealthDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('healthDocuments', id);
}

/**
 * Direct, permanent delete. Deletes the Health profile and every document
 * that belongs to it in a single IndexedDB transaction spanning both
 * stores, so the operation either fully commits or fully rolls back —
 * never leaving orphaned HealthDocument records. Never touches the linked
 * Family Member or Education profile.
 */
export async function deleteHealthProfileWithDocuments(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['healthProfiles', 'healthDocuments'], 'readwrite');
  const documentsStore = tx.objectStore('healthDocuments');

  const documentIds = await documentsStore.index('healthProfileId').getAllKeys(id);

  await Promise.all([
    tx.objectStore('healthProfiles').delete(id),
    ...documentIds.map((documentId) => documentsStore.delete(documentId)),
  ]);
  await tx.done;
}
