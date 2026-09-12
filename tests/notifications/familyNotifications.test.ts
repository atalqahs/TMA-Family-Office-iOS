import { describe, expect, it } from 'vitest';
import { buildFamilyNotifications } from '../../src/features/notifications/sources/familyNotifications';
import type { FamilyMember } from '../../src/features/family/types';

const NOW = new Date(2026, 5, 15); // local June 15, 2026

function member(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'm1',
    fullName: 'Sara',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Family notifications -- Civil ID (3 calendar-month warning)', () => {
  it('no notification more than 3 months before expiry', () => {
    const items = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-09-16' })], NOW);
    expect(items).toEqual([]);
  });

  it('notification exactly at the 3-month threshold (2026-09-15 - 3 months = 2026-06-15 = today)', () => {
    const items = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-09-15' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:civil-id-expiring', kind: 'familyCivilIdExpiringSoon', severity: 'warning' });
  });

  it('warning inside the 3-month window', () => {
    const items = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-08-01' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:civil-id-expiring', severity: 'warning' });
  });

  it('expired on the exact expiry date', () => {
    const items = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-06-15' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:civil-id-expired', kind: 'familyCivilIdExpired', severity: 'critical' });
  });

  it('expired and remains overdue after the expiry date', () => {
    const items = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-01-01' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:civil-id-expired', severity: 'critical' });
  });

  it('renewing to a future date removes the old expired notification', () => {
    const expired = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-01-01' })], NOW);
    expect(expired.some((item) => item.kind === 'familyCivilIdExpired')).toBe(true);

    const renewed = buildFamilyNotifications([member({ civilIdExpiryDate: '2028-01-01' })], NOW);
    expect(renewed).toEqual([]);
  });
});

describe('Family notifications -- Passport (6 calendar-month warning)', () => {
  it('no notification more than 6 months before expiry', () => {
    const items = buildFamilyNotifications([member({ passportExpiryDate: '2026-12-16' })], NOW);
    expect(items).toEqual([]);
  });

  it('notification exactly at the 6-month threshold (2026-12-15 - 6 months = 2026-06-15 = today)', () => {
    const items = buildFamilyNotifications([member({ passportExpiryDate: '2026-12-15' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:passport-expiring', kind: 'familyPassportExpiringSoon', severity: 'warning' });
  });

  it('warning inside the 6-month window', () => {
    const items = buildFamilyNotifications([member({ passportExpiryDate: '2026-09-01' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:passport-expiring', severity: 'warning' });
  });

  it('expired on the exact expiry date', () => {
    const items = buildFamilyNotifications([member({ passportExpiryDate: '2026-06-15' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:passport-expired', kind: 'familyPassportExpired', severity: 'critical' });
  });

  it('expired and remains overdue after the expiry date', () => {
    const items = buildFamilyNotifications([member({ passportExpiryDate: '2026-01-01' })], NOW);
    expect(items[0]).toMatchObject({ id: 'family:m1:passport-expired', severity: 'critical' });
  });

  it('renewing to a future date removes the old expired notification', () => {
    const expired = buildFamilyNotifications([member({ passportExpiryDate: '2026-01-01' })], NOW);
    expect(expired.some((item) => item.kind === 'familyPassportExpired')).toBe(true);

    const renewed = buildFamilyNotifications([member({ passportExpiryDate: '2028-01-01' })], NOW);
    expect(renewed).toEqual([]);
  });
});

describe('Family notifications -- shared rules', () => {
  it('a member with neither expiry date set produces no notification', () => {
    expect(buildFamilyNotifications([member()], NOW)).toEqual([]);
  });

  it('an archived family member still produces notifications (Archive is a visibility state only, never a suppression rule)', () => {
    const items = buildFamilyNotifications(
      [member({ civilIdExpiryDate: '2026-01-01', archivedAt: '2026-02-01T00:00:00.000Z' })],
      NOW,
    );
    expect(items[0]).toMatchObject({ id: 'family:m1:civil-id-expired', severity: 'critical' });
  });

  it('deterministic ids: the same input always produces the exact same id, never duplicated', () => {
    const first = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-01-01', passportExpiryDate: '2026-01-01' })], NOW);
    const second = buildFamilyNotifications([member({ civilIdExpiryDate: '2026-01-01', passportExpiryDate: '2026-01-01' })], NOW);
    expect(first.map((item) => item.id).sort()).toEqual(second.map((item) => item.id).sort());
    expect(new Set(first.map((item) => item.id)).size).toBe(first.length);
  });

  it('routes to the real Family Member profile, never a separate document page', () => {
    const items = buildFamilyNotifications([member({ id: 'm42', civilIdExpiryDate: '2026-01-01' })], NOW);
    expect(items[0].route).toBe('/family/m42');
  });

  it('civil ID and passport conditions on the same member both surface, as two distinct notifications', () => {
    const items = buildFamilyNotifications(
      [member({ civilIdExpiryDate: '2026-01-01', passportExpiryDate: '2026-01-01' })],
      NOW,
    );
    expect(items.map((item) => item.id).sort()).toEqual(['family:m1:civil-id-expired', 'family:m1:passport-expired']);
  });
});
