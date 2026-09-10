import { getDB } from '../../storage/db';
import type { FamilyMember, FamilyMemberDocument } from './types';

/**
 * All IndexedDB access for the Family module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `familyService.ts`, which builds on
 * it) instead.
 */

export async function listActiveFamilyMembers(): Promise<FamilyMember[]> {
  const db = await getDB();
  const all = await db.getAll('familyMembers');
  return all.filter((member) => !member.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
