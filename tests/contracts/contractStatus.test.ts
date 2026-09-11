import { describe, expect, it } from 'vitest';
import { computeContractStatus } from '../../src/features/contracts/contractStatus';

const NOW = new Date(2026, 5, 15); // local June 15, 2026

describe('contractStatus: end-date-derived states', () => {
  it('is green when endDate is well in the future', () => {
    expect(computeContractStatus({ endDate: '2026-12-01' }, NOW)).toBe('green');
  });

  it('is orange ("Expiring Soon") within the 30-day warning window', () => {
    expect(computeContractStatus({ endDate: '2026-06-30' }, NOW)).toBe('orange');
  });

  it('is red exactly on the end date itself', () => {
    expect(computeContractStatus({ endDate: '2026-06-15' }, NOW)).toBe('red');
  });

  it('is red once the end date has passed', () => {
    expect(computeContractStatus({ endDate: '2026-01-01' }, NOW)).toBe('red');
  });

  it('an open-ended contract (no endDate) is always green', () => {
    expect(computeContractStatus({ endDate: undefined }, NOW)).toBe('green');
  });
});
