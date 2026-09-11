import { getDB } from '../../storage/db';
import type { FamilyMember, FamilyMemberDocument } from './types';

/**
 * All IndexedDB access for the Family module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `familyService.ts`, which builds on
 * it) instead.
 */

/** Every non-deleted member, ARCHIVED ONES INCLUDED -- the read path for Notifications/Archive, which must see archived records too (see features/archive/, features/notifications/). */
export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const db = await getDB();
  const all = await db.getAll('familyMembers');
  return all.filter((member) => !member.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Non-deleted AND non-archived -- the normal active Family list/count. Centralized here so no component ever filters `archivedAt`/`deletedAt` itself. */
export async function listActiveFamilyMembers(): Promise<FamilyMember[]> {
  const all = await listFamilyMembers();
  return all.filter((member) => !member.archivedAt);
}

export async function getFamilyMember(id: string): Promise<FamilyMember | undefined> {
  const db = await getDB();
  const member = await db.get('familyMembers', id);
  return member && !member.deletedAt ? member : undefined;
}

export async function saveFamilyMember(member: FamilyMember): Promise<void> {
  const db = await getDB();
  await db.put('familyMembers', member);
}

export async function softDeleteFamilyMember(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('familyMembers', id);
  if (!existing) return;
  await db.put('familyMembers', { ...existing, deletedAt: new Date().toISOString() });
}

/** Sets `archivedAt` -- a display/organization change only, never touching any other field (see FamilyMember's own doc comment). */
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
