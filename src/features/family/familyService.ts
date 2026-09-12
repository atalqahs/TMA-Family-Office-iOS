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

/**
 * Direct, permanent delete of the family member and everything it owns:
 * its own documents, and (Phase 11) its linked Health/Education profile
 * and their documents, if any (see familyRepository for the transactional
 * cascade). The same function is used whether Delete is invoked from the
 * normal profile page or from within Archive -- there is no separate
 * soft-delete entry point anymore (Trash was cancelled as a product
 * decision; see Phase 11).
 */
export async function removeFamilyMember(id: string): Promise<void> {
  await familyRepository.deleteFamilyMemberWithChildren(id);
}

/** Archives the member (Phase 10): a display/organization change only -- see features/archive/. Never archives the linked Health/Education profile, if any. */
export async function archiveFamilyMember(id: string): Promise<void> {
  await familyRepository.archiveFamilyMember(id);
}

export async function unarchiveFamilyMember(id: string): Promise<void> {
  await familyRepository.unarchiveFamilyMember(id);
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
