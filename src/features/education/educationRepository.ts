import { getDB } from '../../storage/db';
import type { EducationDocument, EducationProfile } from './types';

/**
 * All IndexedDB access for the Education module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `educationService.ts`, which builds
 * on it) instead.
 */

/** Every Education profile, ARCHIVED ONES INCLUDED -- the read path for Notifications/Archive, which must see archived records too (see features/archive/). */
export async function listEducationProfiles(): Promise<EducationProfile[]> {
  const db = await getDB();
  const all = await db.getAll('educationProfiles');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Non-archived -- the normal active Education list/count. Centralized here so no component ever filters `archivedAt` itself. */
export async function listActiveEducationProfiles(): Promise<EducationProfile[]> {
  const all = await listEducationProfiles();
  return all.filter((profile) => !profile.archivedAt);
}

export async function getEducationProfile(id: string): Promise<EducationProfile | undefined> {
  const db = await getDB();
  return db.get('educationProfiles', id);
}

/** At most one Education profile may exist per Family Member -- also enforced atomically by the unique `familyMemberId` IndexedDB index (see storage/db.ts), this is the read-side lookup used to guide the user to an existing profile instead of creating a duplicate. */
export async function getEducationProfileForFamilyMember(familyMemberId: string): Promise<EducationProfile | undefined> {
  const db = await getDB();
  return db.getFromIndex('educationProfiles', 'familyMemberId', familyMemberId);
}

export async function saveEducationProfile(profile: EducationProfile): Promise<void> {
  const db = await getDB();
  await db.put('educationProfiles', profile);
}

export async function getActiveEducationProfileCount(): Promise<number> {
  const all = await listActiveEducationProfiles();
  return all.length;
}

/** Sets `archivedAt` -- a display/organization change only, never touching any other field, never the linked Family Member or Health profile. */
export async function archiveEducationProfile(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('educationProfiles', id);
  if (!existing) return;
  await db.put('educationProfiles', { ...existing, archivedAt: new Date().toISOString() });
}

/** Clears `archivedAt`, returning the profile to the active list exactly as it was -- never recreates/copies the record. */
export async function unarchiveEducationProfile(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('educationProfiles', id);
  if (!existing) return;
  const { archivedAt: _archivedAt, ...rest } = existing;
  await db.put('educationProfiles', rest);
}

export async function listDocumentsForEducationProfile(educationProfileId: string): Promise<EducationDocument[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('educationDocuments', 'educationProfileId', educationProfileId);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveEducationDocument(document: EducationDocument): Promise<void> {
  const db = await getDB();
  await db.put('educationDocuments', document);
}

export async function deleteEducationDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('educationDocuments', id);
}

/**
 * Direct, permanent delete. Deletes the Education profile and every
 * document that belongs to it in a single IndexedDB transaction spanning
 * both stores, so the operation either fully commits or fully rolls back —
 * never leaving orphaned EducationDocument records. Never touches the
 * linked Family Member or Health profile.
 */
export async function deleteEducationProfileWithDocuments(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['educationProfiles', 'educationDocuments'], 'readwrite');
  const documentsStore = tx.objectStore('educationDocuments');

  const documentIds = await documentsStore.index('educationProfileId').getAllKeys(id);

  await Promise.all([
    tx.objectStore('educationProfiles').delete(id),
    ...documentIds.map((documentId) => documentsStore.delete(documentId)),
  ]);
  await tx.done;
}
