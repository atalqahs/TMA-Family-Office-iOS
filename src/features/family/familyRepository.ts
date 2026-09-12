import { getDB } from '../../storage/db';
import type { FamilyMember, FamilyMemberDocument } from './types';

/**
 * All IndexedDB access for the Family module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `familyService.ts`, which builds on
 * it) instead.
 */

/** Every family member, ARCHIVED ONES INCLUDED -- the read path for Notifications/Archive, which must see archived records too (see features/archive/, features/notifications/). */
export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const db = await getDB();
  const all = await db.getAll('familyMembers');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Non-archived -- the normal active Family list/count. Centralized here so no component ever filters `archivedAt` itself. */
export async function listActiveFamilyMembers(): Promise<FamilyMember[]> {
  const all = await listFamilyMembers();
  return all.filter((member) => !member.archivedAt);
}

export async function getFamilyMember(id: string): Promise<FamilyMember | undefined> {
  const db = await getDB();
  return db.get('familyMembers', id);
}

export async function saveFamilyMember(member: FamilyMember): Promise<void> {
  const db = await getDB();
  await db.put('familyMembers', member);
}

/**
 * Direct, permanent delete. Deletes the family member and every record it
 * owns -- its own documents, AND (Phase 11) its linked Health/Education
 * profile and THEIR documents, if any -- in a single IndexedDB transaction
 * spanning every affected store, so the operation either fully commits or
 * fully rolls back, never leaving an orphaned Health/Education profile
 * pointing at a Family Member that no longer exists (see this file's
 * module doc comment and Phase 11 Part 5).
 *
 * Deliberately implemented here (rather than by importing anything from
 * features/health or features/education) using only the store names the
 * shared `TmaDB` schema already knows about -- Family has no runtime
 * dependency on either module; the relationship is expressed purely
 * through the `familyMemberId` index on their stores.
 */
export async function deleteFamilyMemberWithChildren(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['familyMembers', 'familyMemberDocuments', 'healthProfiles', 'healthDocuments', 'educationProfiles', 'educationDocuments'],
    'readwrite',
  );
  const familyDocsStore = tx.objectStore('familyMemberDocuments');
  const healthStore = tx.objectStore('healthProfiles');
  const healthDocsStore = tx.objectStore('healthDocuments');
  const educationStore = tx.objectStore('educationProfiles');
  const educationDocsStore = tx.objectStore('educationDocuments');

  const [familyDocIds, healthProfiles, educationProfiles] = await Promise.all([
    familyDocsStore.index('familyMemberId').getAllKeys(id),
    healthStore.index('familyMemberId').getAll(id),
    educationStore.index('familyMemberId').getAll(id),
  ]);

  const healthDocIds = (
    await Promise.all(healthProfiles.map((profile) => healthDocsStore.index('healthProfileId').getAllKeys(profile.id)))
  ).flat();
  const educationDocIds = (
    await Promise.all(
      educationProfiles.map((profile) => educationDocsStore.index('educationProfileId').getAllKeys(profile.id)),
    )
  ).flat();

  await Promise.all([
    tx.objectStore('familyMembers').delete(id),
    ...familyDocIds.map((docId) => familyDocsStore.delete(docId)),
    ...healthProfiles.map((profile) => healthStore.delete(profile.id)),
    ...healthDocIds.map((docId) => healthDocsStore.delete(docId)),
    ...educationProfiles.map((profile) => educationStore.delete(profile.id)),
    ...educationDocIds.map((docId) => educationDocsStore.delete(docId)),
  ]);
  await tx.done;
}

/** Sets `archivedAt` -- a display/organization change only, never touching any other field (see FamilyMember's own doc comment). Never cascades to the linked Health/Education profile, if any -- their archive state is fully independent (Phase 11 Part 5). */
export async function archiveFamilyMember(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('familyMembers', id);
  if (!existing) return;
  await db.put('familyMembers', { ...existing, archivedAt: new Date().toISOString() });
}

/** Clears `archivedAt`, returning the member to the active list exactly as it was -- never recreates/copies the record. */
export async function unarchiveFamilyMember(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('familyMembers', id);
  if (!existing) return;
  const { archivedAt: _archivedAt, ...rest } = existing;
  await db.put('familyMembers', rest);
}

export async function findFamilyMembersByCivilId(civilId: string, excludeId?: string): Promise<FamilyMember[]> {
  const normalized = civilId.trim().toLowerCase();
  if (!normalized) return [];
  const members = await listActiveFamilyMembers();
  return members.filter((member) => member.id !== excludeId && (member.civilId ?? '').trim().toLowerCase() === normalized);
}

export async function getActiveFamilyMemberCount(): Promise<number> {
  const members = await listActiveFamilyMembers();
  return members.length;
}

export async function listDocumentsForMember(familyMemberId: string): Promise<FamilyMemberDocument[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('familyMemberDocuments', 'familyMemberId', familyMemberId);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveFamilyMemberDocument(document: FamilyMemberDocument): Promise<void> {
  const db = await getDB();
  await db.put('familyMemberDocuments', document);
}

export async function deleteFamilyMemberDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('familyMemberDocuments', id);
}
