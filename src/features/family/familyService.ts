import { generateId } from '../../utils/id';
import * as familyRepository from './familyRepository';
import type { FamilyMember, FamilyMemberDocument, FamilyMemberDocumentFormValues, FamilyMemberFormValues } from './types';

export async function createFamilyMember(values: FamilyMemberFormValues): Promise<FamilyMember> {
  const now = new Date().toISOString();
  const member: FamilyMember = {
    id: generateId(),
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await familyRepository.saveFamilyMember(member);
  return member;
}

export async function updateFamilyMember(id: string, values: FamilyMemberFormValues): Promise<FamilyMember> {
  const existing = await familyRepository.getFamilyMember(id);
  if (!existing) {
    throw new Error(`Family member ${id} not found`);
  }
  const updated: FamilyMember = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await familyRepository.saveFamilyMember(updated);
  return updated;
}

/** Soft-delete only: hides the member from every list without destroying
 * the record, so the future Trash phase can build restore/purge on top of
 * this instead of a separate, incompatible deletion model. */
export async function removeFamilyMember(id: string): Promise<void> {
  await familyRepository.softDeleteFamilyMember(id);
}

/** Archives the member (Phase 10): a display/organization change only -- see features/archive/. */
export async function archiveFamilyMember(id: string): Promise<void> {
  await familyRepository.archiveFamilyMember(id);
}

export async function unarchiveFamilyMember(id: string): Promise<void> {
  await familyRepository.unarchiveFamilyMember(id);
}

/** "Delete Card" from within Archive -- the same forward-compatible soft-delete as `removeFamilyMember`, exposed under its own name for that specific entry point. */
export async function deleteFamilyMemberCard(id: string): Promise<void> {
  await familyRepository.softDeleteFamilyMember(id);
}

export async function addFamilyMemberDocument(
  familyMemberId: string,
  values: FamilyMemberDocumentFormValues,
): Promise<FamilyMemberDocument> {
  const now = new Date().toISOString();
  const document: FamilyMemberDocument = {
    id: generateId(),
    familyMemberId,
    type: values.type,
    title: values.title,
    file: values.file,
    fileName: values.file.name,
    mimeType: values.file.type || 'application/octet-stream',
    fileSize: values.file.size,
    expiryDate: values.expiryDate,
    createdAt: now,
    updatedAt: now,
  };
  await familyRepository.saveFamilyMemberDocument(document);
  return document;
}

export async function removeFamilyMemberDocument(id: string): Promise<void> {
  await familyRepository.deleteFamilyMemberDocument(id);
}
