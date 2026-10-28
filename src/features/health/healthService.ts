import { getFamilyMember } from '../family/familyRepository';
import { generateId } from '../../utils/id';
import * as healthRepository from './healthRepository';
import type { HealthDocument, HealthDocumentFormValues, HealthProfile, HealthProfileFormValues } from './types';

/** Thrown when `familyMemberId` does not resolve to a real, existing Family Member -- a Health profile can never be created for a member that doesn't exist. */
export class FamilyMemberNotFoundError extends Error {
  constructor() {
    super('Family member not found');
    this.name = 'FamilyMemberNotFoundError';
  }
}

/** Thrown when the chosen Family Member already has a Health profile -- at most one Health profile per Family Member (Phase 11 Part 3.A). Callers should guide the user to the existing profile rather than showing a generic error. */
export class DuplicateHealthProfileError extends Error {
  existingProfileId: string;

  constructor(existingProfileId: string) {
    super('This family member already has a Health profile');
    this.name = 'DuplicateHealthProfileError';
    this.existingProfileId = existingProfileId;
  }
}

/**
 * Creates a Health profile for an existing Family Member. Verifies the
 * relationship both ways: the Family Member must exist (never a dangling
 * `familyMemberId`), and the member must not already have a profile
 * (never a silent duplicate) -- the unique `familyMemberId` index on
 * `healthProfiles` (see storage/db.ts) is the final, atomic backstop
 * against a race between two concurrent creations for the same member.
 */
export async function createHealthProfile(
  familyMemberId: string,
  values: HealthProfileFormValues,
): Promise<HealthProfile> {
  const familyMember = await getFamilyMember(familyMemberId);
  if (!familyMember) {
    throw new FamilyMemberNotFoundError();
  }
  const existing = await healthRepository.getHealthProfileForFamilyMember(familyMemberId);
  if (existing) {
    throw new DuplicateHealthProfileError(existing.id);
  }

  const now = new Date().toISOString();
  const profile: HealthProfile = {
    id: generateId(),
    familyMemberId,
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await healthRepository.saveHealthProfile(profile);
  return profile;
}

/** Edits Health-specific fields only -- `familyMemberId` never changes here (see HealthProfile's own doc comment: Family identity data is never duplicated/edited from Health). */
export async function updateHealthProfile(id: string, values: HealthProfileFormValues): Promise<HealthProfile> {
  const existing = await healthRepository.getHealthProfile(id);
  if (!existing) {
    throw new Error(`Health profile ${id} not found`);
  }
  const updated: HealthProfile = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await healthRepository.saveHealthProfile(updated);
  return updated;
}

/** Direct, permanent delete of the Health profile and all of its documents (see healthRepository for the transactional cascade). Never touches the linked Family Member. */
export async function removeHealthProfile(id: string): Promise<void> {
  await healthRepository.deleteHealthProfileWithDocuments(id);
}

/** Archives the Health profile (its OWN independent archive state -- see features/archive/): never archives the linked Family Member or Education profile. */
export async function archiveHealthProfile(id: string): Promise<void> {
  await healthRepository.archiveHealthProfile(id);
}

export async function unarchiveHealthProfile(id: string): Promise<void> {
  await healthRepository.unarchiveHealthProfile(id);
}

export async function addHealthDocument(
  healthProfileId: string,
  values: HealthDocumentFormValues,
): Promise<HealthDocument> {
  const now = new Date().toISOString();
  const document: HealthDocument = {
    id: generateId(),
    healthProfileId,
    type: values.type,
    title: values.title,
    file: values.file,
    fileName: values.file.name,
    mimeType: values.file.type || 'application/octet-stream',
    fileSize: values.file.size,
    createdAt: now,
    updatedAt: now,
  };
  await healthRepository.saveHealthDocument(document);
  return document;
}

export async function removeHealthDocument(id: string): Promise<void> {
  await healthRepository.deleteHealthDocument(id);
}
