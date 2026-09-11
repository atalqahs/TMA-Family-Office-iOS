import { computeContractStatus } from '../../contracts/contractStatus';
import type { Contract } from '../../contracts/types';
import type { NotificationItem } from '../types';

/**
 * Reuses `computeContractStatus` verbatim -- the same derivation
 * ContractCard/ContractProfilePage already use, including the confirmed
 * rule that the end date itself is already expired (red), and that a
 * contract with no `endDate` is always green (so it correctly never
 * reaches this function's red/orange branches at all).
 */
export function buildContractNotifications(contracts: Contract[], now: Date = new Date()): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const contract of contracts) {
    const endDate = contract.endDate;
    if (!endDate) continue;

    const status = computeContractStatus(contract, now);
    if (status !== 'red' && status !== 'orange') continue;

    const expired = status === 'red';
    items.push({
      id: `contract:${contract.id}:${expired ? 'expired' : 'expiring-soon'}`,
      sourceType: 'contract',
      sourceId: contract.id,
      kind: expired ? 'contractExpired' : 'contractExpiringSoon',
      severity: expired ? 'critical' : 'warning',
      titleKey: expired ? 'notificationTitleContractExpired' : 'notificationTitleContractExpiringSoon',
      titleParams: { title: contract.title },
      messageKey: expired ? 'notificationMsgExpiredOn' : 'notificationMsgExpiringOn',
      messageParams: { date: endDate },
      effectiveDate: endDate,
      sortDate: endDate,
      route: `/contracts/${contract.id}`,
    });
  }

  return items;
}
