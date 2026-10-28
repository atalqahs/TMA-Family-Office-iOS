import { getFamilyMember } from '../family/familyRepository';
import { generateId } from '../../utils/id';
import * as educationRepository from './educationRepository';
import type {
  EducationDocument,
  EducationDocumentFormValues,
  EducationProfile,
  EducationProfileFormValues,
} from './types';

/** Thrown when `familyMemberId` does not resolve to a real, existing Family Member -- an Education profile can never be created for a member that doesn't exist. */
export class FamilyMemberNotFoundError extends Error {
  constructor() {
    super('Family member not found');
    this.name = 'FamilyMemberNotFoundError';
  }
}

/** Thrown when the chosen Family Member already has an Education profile -- at most one Education profile per Family Member (Phase 11 Part 4.A). Callers should guide the user to the existing profile rather than showing a generic error. */
export class DuplicateEducationProfileError extends Error {
  existingProfileId: string;

  constructor(existingProfileId: string) {
    super('This family member already has an Education profile');
    this.name = 'DuplicateEducationProfileError';
    this.existingProfileId = existingProfileId;
  }
}

/**
 * Creates an Education profile for an existing Family Member. Verifies
 * the relationship both ways: the Family Member must exist (never a
 * dangling `familyMemberId`), and the member must not already have a
 * profile (never a silent duplicate) -- the unique `familyMemberId` index
 * on `educationProfiles` (see storage/db.ts) is the final, atomic backstop
 * against a race between two concurrent creations for the same member.
 */
export async function createEducationProfile(
  familyMemberId: string,
  values: EducationProfileFormValues,
): Promise<EducationProfile> {
  const familyMember = await getFamilyMember(familyMemberId);
  if (!familyMember) {
    throw new FamilyMemberNotFoundError();
  }
  const existing = await educationRepository.getEducationProfileForFamilyMember(familyMemberId);
  if (existing) {
    throw new DuplicateEducationProfileError(existing.id);
  }

  const now = new Date().toISOString();
  const profile: EducationProfile = {
    id: generateId(),
    familyMemberId,
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await educationRepository.saveEducationProfile(profile);
  return profile;
}

/** Edits Education-specific fields only -- `familyMemberId` never changes here (see EducationProfile's own doc comment: Family identity data is never duplicated/edited from Education). */
export async function updateEducationProfile(
  id: string,
  values: EducationProfileFormValues,
): Promise<EducationProfile> {
  const existing = await educationRepository.getEducationProfile(id);
  if (!existing) {
    throw new Error(`Education profile ${id} not found`);
  }
  const updated: EducationProfile = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await educationRepository.saveEducationProfile(updated);
  return updated;
}

/** Direct, permanent delete of the Education profile and all of its documents (see educationRepository for the transactional cascade). Never touches the linked Family Member. */
export async function removeEducationProfile(id: string): Promise<void> {
  await educationRepository.deleteEducationProfileWithDocuments(id);
}

/** Archives the Education profile (its OWN independent archive state -- see features/archive/): never archives the linked Family Member or Health profile. */
export async function archiveEducationProfile(id: string): Promise<void> {
  await educationRepository.archiveEducationProfile(id);
}

export async function unarchiveEducationProfile(id: string): Promise<void> {
  await educationRepository.unarchiveEducationProfile(id);
}

export async function addEducationDocument(
  educationProfileId: string,
  values: EducationDocumentFormValues,
): Promise<EducationDocument> {
  const now = new Date().toISOString();
  const document: EducationDocument = {
    id: generateId(),
    educationProfileId,
    type: values.type,
    title: values.title,
    file: values.file,
    fileName: values.file.name,
    mimeType: values.file.type || 'application/octet-stream',
    fileSize: values.file.size,
    createdAt: now,
    updatedAt: now,
  };
  await educationRepository.saveEducationDocument(document);
  return document;
}

export async function removeEducationDocument(id: string): Promise<void> {
  await educationRepository.deleteEducationDocument(id);
}
