import { describe, expect, it } from 'vitest';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as familyService from '../../src/features/family/familyService';
import * as healthRepository from '../../src/features/health/healthRepository';
import * as healthService from '../../src/features/health/healthService';
import * as educationRepository from '../../src/features/education/educationRepository';
import * as educationService from '../../src/features/education/educationService';

const NOW = '2026-01-01T00:00:00.000Z';

/**
 * Permanent Phase 11 regression suite -- Part 5 (Family delete
 * relationship rule) and Part 10's FAMILY RELATIONSHIPS section: Family
 * permanent delete must never leave an orphaned Health/Education profile
 * or their documents, and Family archive must never cascade to either.
 */
describe('Family permanent delete cascades to Health/Education', () => {
  it('deleting a Family Member with both a Health and an Education profile removes the member, both profiles, and all of their documents in one operation', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    await familyService.addFamilyMemberDocument('fm1', {
      type: 'civilId',
      title: 'Civil ID',
      file: new File(['x'], 'civilid.pdf', { type: 'application/pdf' }),
    });
    const health = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    await healthService.addHealthDocument(health.id, {
      type: 'medicalReport',
      title: 'Report',
      file: new File(['x'], 'report.pdf', { type: 'application/pdf' }),
    });
    const education = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });
    await educationService.addEducationDocument(education.id, {
      type: 'certificate',
      title: 'Diploma',
      file: new File(['x'], 'diploma.pdf', { type: 'application/pdf' }),
    });

    await familyService.removeFamilyMember('fm1');

    expect(await familyRepository.getFamilyMember('fm1')).toBeUndefined();
    expect(await familyRepository.listDocumentsForMember('fm1')).toEqual([]);
    expect(await healthRepository.getHealthProfile(health.id)).toBeUndefined();
    expect(await healthRepository.listDocumentsForHealthProfile(health.id)).toEqual([]);
    expect(await educationRepository.getEducationProfile(education.id)).toBeUndefined();
    expect(await educationRepository.listDocumentsForEducationProfile(education.id)).toEqual([]);
  });

  it('deleting a Family Member with NO Health/Education profile leaves nothing behind and does not error', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });

    await expect(familyService.removeFamilyMember('fm1')).resolves.toBeUndefined();
    expect(await familyRepository.getFamilyMember('fm1')).toBeUndefined();
  });

  it("deleting one Family Member never touches an unrelated Family Member's own Health/Education profile", async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    await familyRepository.saveFamilyMember({ id: 'fm2', fullName: 'Sara', createdAt: NOW, updatedAt: NOW });
    const health2 = await healthService.createHealthProfile('fm2', { healthStatus: 'healthy' });

    await familyService.removeFamilyMember('fm1');

    expect(await familyRepository.getFamilyMember('fm2')).toBeDefined();
    expect(await healthRepository.getHealthProfile(health2.id)).toBeDefined();
  });

  it('the cascade leaves no orphan Health/Education record for the deleted member, even across archived states', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const health = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    await healthService.archiveHealthProfile(health.id);
    await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    await familyService.removeFamilyMember('fm1');

    expect(await healthRepository.listHealthProfiles()).toEqual([]); // archived included -- still gone
    expect(await educationRepository.listEducationProfiles()).toEqual([]);
  });
});

describe('Family archive does NOT cascade to Health/Education', () => {
  it('archiving a Family Member never archives their Health profile', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const health = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    await familyService.archiveFamilyMember('fm1');

    const profile = await healthRepository.getHealthProfile(health.id);
    expect(profile?.archivedAt).toBeUndefined();
    expect((await healthRepository.listActiveHealthProfiles()).map((p) => p.id)).toContain(health.id);
  });

  it('archiving a Family Member never archives their Education profile', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const education = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    await familyService.archiveFamilyMember('fm1');

    const profile = await educationRepository.getEducationProfile(education.id);
    expect(profile?.archivedAt).toBeUndefined();
  });

  it('unarchiving the Family Member has no effect on Health/Education either, since neither was ever archived by it', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const health = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    await familyService.archiveFamilyMember('fm1');
    await familyService.unarchiveFamilyMember('fm1');

    expect((await healthRepository.listActiveHealthProfiles()).map((p) => p.id)).toContain(health.id);
  });
});

describe('Archiving/deleting Health or Education never touches Family', () => {
  it('archiving a Health profile never archives or modifies the Family Member', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const health = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    const before = await familyRepository.getFamilyMember('fm1');

    await healthService.archiveHealthProfile(health.id);

    expect(await familyRepository.getFamilyMember('fm1')).toEqual(before);
  });

  it('permanently deleting a Health profile never removes the Family Member', async () => {
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const health = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    await healthService.removeHealthProfile(health.id);

    expect(await familyRepository.getFamilyMember('fm1')).toBeDefined();
  });
});
