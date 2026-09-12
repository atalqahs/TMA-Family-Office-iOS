import { describe, expect, it } from 'vitest';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as healthRepository from '../../src/features/health/healthRepository';
import * as healthService from '../../src/features/health/healthService';
import { DB_VERSION } from '../../src/storage/db';

const NOW = '2026-01-01T00:00:00.000Z';

async function createFamilyMember(id: string, fullName: string) {
  await familyRepository.saveFamilyMember({ id, fullName, createdAt: NOW, updatedAt: NOW });
}

/**
 * Permanent Phase 11 regression suite -- Health data layer (Part 3 and
 * Part 10's HEALTH section). Covers the Family relationship rules,
 * duplicate prevention, Family-as-source-of-truth for identity, archive
 * independence, document CRUD, and permanent cascade delete.
 */
describe('Health: relationship to Family', () => {
  it('creates a Health profile for a valid, existing Family Member', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    expect(profile).toMatchObject({ familyMemberId: 'fm1', healthStatus: 'healthy' });
    expect(await healthRepository.getHealthProfile(profile.id)).toBeDefined();
  });

  it('rejects creation for a nonexistent Family Member', async () => {
    await expect(healthService.createHealthProfile('does-not-exist', { healthStatus: 'healthy' })).rejects.toThrow(
      healthService.FamilyMemberNotFoundError,
    );
  });

  it('prevents a duplicate Health profile for the same Family Member -- throws DuplicateHealthProfileError naming the existing profile', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const first = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    await expect(healthService.createHealthProfile('fm1', { healthStatus: 'critical' })).rejects.toThrow(
      healthService.DuplicateHealthProfileError,
    );
    try {
      await healthService.createHealthProfile('fm1', { healthStatus: 'critical' });
    } catch (err) {
      expect(err).toBeInstanceOf(healthService.DuplicateHealthProfileError);
      expect((err as healthService.DuplicateHealthProfileError).existingProfileId).toBe(first.id);
    }

    // The unique familyMemberId index also stops a duplicate at the raw
    // repository level (a race-condition backstop, not just the service
    // pre-check).
    await expect(
      healthRepository.saveHealthProfile({
        id: 'other-profile',
        familyMemberId: 'fm1',
        healthStatus: 'healthy',
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ).rejects.toThrow();
  });

  it('a second, different Family Member can have their own Health profile without conflict', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    await createFamilyMember('fm2', 'Sara');
    await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    const second = await healthService.createHealthProfile('fm2', { healthStatus: 'needsFollowUp' });
    expect(second.familyMemberId).toBe('fm2');
  });
});

describe('Health: Family is the source of truth for identity', () => {
  it('Family identity changes (e.g. a renamed member) are reflected without any change to the Health profile itself', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad Al-Sabah', createdAt: NOW, updatedAt: NOW });

    const resolvedMember = await familyRepository.getFamilyMember(profile.familyMemberId);
    expect(resolvedMember?.fullName).toBe('Ahmad Al-Sabah');
    // The Health profile's own record never duplicated/cached the name.
    expect(profile).not.toHaveProperty('fullName');
  });

  it('editing Health-specific fields never touches the linked Family Member record', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    const memberBefore = await familyRepository.getFamilyMember('fm1');

    await healthService.updateHealthProfile(profile.id, {
      healthStatus: 'critical',
      height: 180,
      weight: 75,
      allergies: 'Peanuts',
      healthNotes: 'Follow-up scheduled',
    });

    const memberAfter = await familyRepository.getFamilyMember('fm1');
    expect(memberAfter).toEqual(memberBefore);
    const updated = await healthRepository.getHealthProfile(profile.id);
    expect(updated).toMatchObject({ healthStatus: 'critical', height: 180, weight: 75, allergies: 'Peanuts' });
    expect(updated?.familyMemberId).toBe('fm1'); // never changes on edit
  });
});

describe('Health: archive independence', () => {
  it('archiving a Health profile excludes it from the active list/count but keeps it readable', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    await healthService.archiveHealthProfile(profile.id);

    expect((await healthRepository.listActiveHealthProfiles()).map((p) => p.id)).not.toContain(profile.id);
    expect((await healthRepository.listHealthProfiles()).map((p) => p.id)).toContain(profile.id);
    expect(await healthRepository.getActiveHealthProfileCount()).toBe(0);
  });

  it('unarchiving restores the Health profile to the active list, never duplicated', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    await healthService.archiveHealthProfile(profile.id);

    await healthService.unarchiveHealthProfile(profile.id);

    const active = await healthRepository.listActiveHealthProfiles();
    expect(active.map((p) => p.id)).toEqual([profile.id]);
  });

  it('archiving Health does NOT archive the Family Member', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    await healthService.archiveHealthProfile(profile.id);

    const member = await familyRepository.getFamilyMember('fm1');
    expect(member?.archivedAt).toBeUndefined();
  });
});

describe('Health documents (shared infrastructure)', () => {
  it('saves, lists, and deletes a Health document through the shared document infrastructure', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    const doc = await healthService.addHealthDocument(profile.id, {
      type: 'medicalReport',
      title: 'Annual Checkup',
      file: new File(['x'], 'checkup.pdf', { type: 'application/pdf' }),
    });

    let docs = await healthRepository.listDocumentsForHealthProfile(profile.id);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ title: 'Annual Checkup', fileName: 'checkup.pdf', mimeType: 'application/pdf' });

    await healthService.removeHealthDocument(doc.id);
    docs = await healthRepository.listDocumentsForHealthProfile(profile.id);
    expect(docs).toHaveLength(0);
  });
});

describe('Health: permanent deletion', () => {
  it('permanently deleting a Health profile cascades its documents in one transaction, and never touches the Family Member', async () => {
    await createFamilyMember('fm1', 'Ahmad');
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });
    await healthService.addHealthDocument(profile.id, {
      type: 'medicalReport',
      title: 'Report',
      file: new File(['x'], 'report.pdf', { type: 'application/pdf' }),
    });

    await healthService.removeHealthProfile(profile.id);

    expect(await healthRepository.getHealthProfile(profile.id)).toBeUndefined();
    expect(await healthRepository.listDocumentsForHealthProfile(profile.id)).toEqual([]);
    expect(await familyRepository.getFamilyMember('fm1')).toBeDefined();
  });

  it('DB_VERSION is 13 -- the Health/Education stores were added under this version', () => {
    expect(DB_VERSION).toBe(13);
  });
});
