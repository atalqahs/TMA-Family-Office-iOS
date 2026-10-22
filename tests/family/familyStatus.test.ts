import { describe, expect, it } from 'vitest';
import { computeFamilyStatus } from '../../src/features/family/familyStatus';

// Civil ID warns 3 calendar months before expiry, Passport 6 -- same
// thresholds as the existing Family Notifications source.
const NOW = new Date(2026, 5, 15); // local June 15, 2026

describe('familyStatus: Civil ID / passport expiry', () => {
  it('is green with no expiry dates at all', () => {
    const { level, reasons } = computeFamilyStatus({}, NOW);
    expect(level).toBe('green');
    expect(reasons).toEqual([]);
  });

  it('is green when both dates are well outside their warning windows', () => {
    const { level, reasons } = computeFamilyStatus(
      { civilIdExpiryDate: '2027-06-15', passportExpiryDate: '2027-06-15' },
      NOW,
    );
    expect(level).toBe('green');
    expect(reasons).toEqual([]);
  });

  it('lists both an expired Civil ID and an expiring-soon passport as independent reasons', () => {
    const { level, reasons } = computeFamilyStatus(
      { civilIdExpiryDate: '2026-01-01', passportExpiryDate: '2026-08-01' },
      NOW,
    );
    expect(level).toBe('red'); // worst of the two
    expect(reasons).toHaveLength(2);
    expect(reasons).toContainEqual(
      expect.objectContaining({ level: 'red', textKey: 'familyReasonCivilIdExpired', params: { date: '2026-01-01' } }),
    );
    expect(reasons).toContainEqual(
      expect.objectContaining({
        level: 'orange',
        textKey: 'familyReasonPassportExpiringSoon',
        params: { date: '2026-08-01' },
      }),
    );
  });

  it('renewing the expired Civil ID leaves the still-expiring passport reason untouched', () => {
    const { level, reasons } = computeFamilyStatus(
      { civilIdExpiryDate: '2028-01-01', passportExpiryDate: '2026-08-01' },
      NOW,
    );
    expect(level).toBe('orange');
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatchObject({ textKey: 'familyReasonPassportExpiringSoon' });
  });

  it('resolving the final reason clears the badge back to green', () => {
    const { level, reasons } = computeFamilyStatus(
      { civilIdExpiryDate: '2028-01-01', passportExpiryDate: '2028-01-01' },
      NOW,
    );
    expect(level).toBe('green');
    expect(reasons).toEqual([]);
  });
});
