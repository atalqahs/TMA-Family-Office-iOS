import { describe, expect, it } from 'vitest';
import { computeContractStatus } from '../../src/features/contracts/contractStatus';

const NOW = new Date(2026, 5, 15); // local June 15, 2026

describe('contractStatus: end-date-derived states', () => {
  it('is green when endDate is well in the future', () => {
    expect(computeContractStatus({ endDate: '2026-12-01' }, NOW).level).toBe('green');
  });

  it('is orange ("Expiring Soon") within the 30-day warning window', () => {
    expect(computeContractStatus({ endDate: '2026-06-30' }, NOW).level).toBe('orange');
  });

  it('is red exactly on the end date itself', () => {
    expect(computeContractStatus({ endDate: '2026-06-15' }, NOW).level).toBe('red');
  });

  it('is red once the end date has passed', () => {
    expect(computeContractStatus({ endDate: '2026-01-01' }, NOW).level).toBe('red');
  });

  it('an open-ended contract (no endDate) is always green', () => {
    expect(computeContractStatus({ endDate: undefined }, NOW).level).toBe('green');
  });
});

describe('contractStatus: reasons', () => {
  it('has no reasons when green', () => {
    expect(computeContractStatus({ endDate: '2026-12-01' }, NOW).reasons).toEqual([]);
  });

  it('gives exactly one orange reason with the end date when expiring soon', () => {
    const { reasons } = computeContractStatus({ endDate: '2026-06-30' }, NOW);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatchObject({ level: 'orange', textKey: 'contractReasonExpiringSoon', params: { date: '2026-06-30' } });
  });

  it('gives exactly one red reason with the end date when expired', () => {
    const { reasons } = computeContractStatus({ endDate: '2026-01-01' }, NOW);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatchObject({ level: 'red', textKey: 'contractReasonExpired', params: { date: '2026-01-01' } });
  });
});
