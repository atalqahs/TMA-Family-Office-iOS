import { describe, expect, it } from 'vitest';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as educationRepository from '../../src/features/education/educationRepository';
import * as educationService from '../../src/features/education/educationService';

const NOW = '2026-01-01T00:00:00.000Z';

async function createFamilyMember(id: string, fullName: string) {
  await familyRepository.saveFamilyMember({ id, fullName, createdAt: NOW, updatedAt: NOW });
}

/**
 * Permanent Phase 11 regression suite -- Education data layer (Part 4 and
 * Part 10's EDUCATION section). Mirrors healthProfile.test.ts's coverage
 * for the same relationship/duplicate/archive/document/delete rules,
 * plus Education's own free-text `educationStage` requirement.
 */
describe('Education: relationship to Family', () => {
  it('creates an Education profile for a valid, existing Family Member', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'High School',
      educationStatus: 'currentlyStudying',
    });
    expect(profile).toMatchObject({ familyMemberId: 'fm1', educationStage: 'High School' });
  });

  it('rejects creation for a nonexistent Family Member', async () => {
    await expect(
      educationService.createEducationProfile('does-not-exist', {
        educationStage: 'High School',
        educationStatus: 'currentlyStudying',
      }),
    ).rejects.toThrow(educationService.FamilyMemberNotFoundError);
  });

  it('prevents a duplicate Education profile for the same Family Member -- throws DuplicateEducationProfileError naming the existing profile', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const first = await educationService.createEducationProfile('fm1', {
      educationStage: 'High School',
      educationStatus: 'currentlyStudying',
    });

    try {
      await educationService.createEducationProfile('fm1', {
        educationStage: 'University',
        educationStatus: 'currentlyStudying',
      });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(educationService.DuplicateEducationProfileError);
      expect((err as educationService.DuplicateEducationProfileError).existingProfileId).toBe(first.id);
    }

    // The unique familyMemberId index is the atomic backstop.
    await expect(
      educationRepository.saveEducationProfile({
        id: 'other-profile',
        familyMemberId: 'fm1',
        educationStage: 'University',
        educationStatus: 'currentlyStudying',
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ).rejects.toThrow();
  });

  it('educationStage is free text -- no rigid hard-coded taxonomy is enforced', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'Whatever the user types here',
      educationStatus: 'graduated',
    });
    expect(profile.educationStage).toBe('Whatever the user types here');
  });
});

describe('Education: Family is the source of truth for identity', () => {
  it('Family identity changes are reflected without any change to the Education profile itself', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad Al-Sabah', createdAt: NOW, updatedAt: NOW });

    const resolvedMember = await familyRepository.getFamilyMember(profile.familyMemberId);
    expect(resolvedMember?.fullName).toBe('Ahmad Al-Sabah');
    expect(profile).not.toHaveProperty('fullName');
  });

  it('editing Education-specific fields never touches the linked Family Member record', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });
    const memberBefore = await familyRepository.getFamilyMember('fm1');

    await educationService.updateEducationProfile(profile.id, {
      educationStage: 'University',
      institution: 'Kuwait University',
      gradeOrYear: 'Year 3',
      specialization: 'Computer Science',
      educationStatus: 'graduated',
      notes: 'Graduated with honors',
    });

    const memberAfter = await familyRepository.getFamilyMember('fm1');
    expect(memberAfter).toEqual(memberBefore);
    const updated = await educationRepository.getEducationProfile(profile.id);
    expect(updated).toMatchObject({ institution: 'Kuwait University', educationStatus: 'graduated' });
    expect(updated?.familyMemberId).toBe('fm1');
  });
});

describe('Education: archive independence', () => {
  it('archiving an Education profile excludes it from the active list/count but keeps it readable', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    await educationService.archiveEducationProfile(profile.id);

    expect((await educationRepository.listActiveEducationProfiles()).map((p) => p.id)).not.toContain(profile.id);
    expect((await educationRepository.listEducationProfiles()).map((p) => p.id)).toContain(profile.id);
    expect(await educationRepository.getActiveEducationProfileCount()).toBe(0);
  });

  it('unarchiving restores the Education profile to the active list, never duplicated', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });
    await educationService.archiveEducationProfile(profile.id);

    await educationService.unarchiveEducationProfile(profile.id);

    const active = await educationRepository.listActiveEducationProfiles();
    expect(active.map((p) => p.id)).toEqual([profile.id]);
  });

  it('archiving Education does NOT archive the Family Member', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    await educationService.archiveEducationProfile(profile.id);

    const member = await familyRepository.getFamilyMember('fm1');
    expect(member?.archivedAt).toBeUndefined();
  });
});

describe('Education documents (shared infrastructure)', () => {
  it('saves, lists, and deletes an Education document through the shared document infrastructure', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    const doc = await educationService.addEducationDocument(profile.id, {
      type: 'certificate',
      title: 'Diploma',
      file: new File(['x'], 'diploma.pdf', { type: 'application/pdf' }),
    });

    let docs = await educationRepository.listDocumentsForEducationProfile(profile.id);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ title: 'Diploma', fileName: 'diploma.pdf', mimeType: 'application/pdf' });

    await educationService.removeEducationDocument(doc.id);
    docs = await educationRepository.listDocumentsForEducationProfile(profile.id);
    expect(docs).toHaveLength(0);
  });
});

describe('Education: permanent deletion', () => {
  it('permanently deleting an Education profile cascades its documents in one transaction, and never touches the Family Member', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });
    await educationService.addEducationDocument(profile.id, {
      type: 'certificate',
      title: 'Diploma',
      file: new File(['x'], 'diploma.pdf', { type: 'application/pdf' }),
    });

    await educationService.removeEducationProfile(profile.id);

    expect(await educationRepository.getEducationProfile(profile.id)).toBeUndefined();
    expect(await educationRepository.listDocumentsForEducationProfile(profile.id)).toEqual([]);
    expect(await familyRepository.getFamilyMember('fm1')).toBeDefined();
  });
});
