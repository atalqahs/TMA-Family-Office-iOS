import { describe, expect, it } from 'vitest';
import { buildContractNotifications } from '../../src/features/notifications/sources/contractNotifications';
import type { Contract } from '../../src/features/contracts/types';

const NOW = new Date(2026, 5, 15); // local June 15, 2026

function contract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'c1',
    title: 'Maintenance Contract',
    contractType: 'maintenance',
    partyName: 'ACME',
    startDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Contract notifications', () => {
  it('11. a future, healthy contract produces no notification', () => {
    expect(buildContractNotifications([contract({ endDate: '2027-01-01' })], NOW)).toEqual([]);
  });

  it('12. flags a contract expiring soon as warning', () => {
    const items = buildContractNotifications([contract({ endDate: '2026-06-30' })], NOW);
    expect(items[0]).toMatchObject({ id: 'contract:c1:expiring-soon', severity: 'warning' });
  });

  it('13. the end date itself counts as already expired (confirmed rule)', () => {
    const items = buildContractNotifications([contract({ endDate: '2026-06-15' })], NOW);
    expect(items[0]).toMatchObject({ id: 'contract:c1:expired', severity: 'critical' });
  });

  it('14. a past end date is expired', () => {
    const items = buildContractNotifications([contract({ endDate: '2026-01-01' })], NOW);
    expect(items[0]).toMatchObject({ id: 'contract:c1:expired', severity: 'critical' });
  });

  it('15. a contract with no endDate at all produces no notification', () => {
    expect(buildContractNotifications([contract({ endDate: undefined })], NOW)).toEqual([]);
  });
});
