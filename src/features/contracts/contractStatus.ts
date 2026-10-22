import type { TranslationKey } from '../../localization/translations';
import { computeDateExpiryStatus, type ExpiryStatusLevel } from '../../utils/expiryStatus';
import type { StatusReason } from '../../utils/statusReasons';
import type { Contract } from './types';

export type ContractStatusLevel = ExpiryStatusLevel;

/** Shared status -> StatusBadge variant / label-key mappings, matching the same green/orange/red visual language used across Vehicles and Staff. */
export const CONTRACT_STATUS_VARIANT: Record<ContractStatusLevel, 'success' | 'warning' | 'danger'> = {
  green: 'success',
  orange: 'warning',
  red: 'danger',
};

export const CONTRACT_STATUS_LABEL_KEY: Record<ContractStatusLevel, TranslationKey> = {
  green: 'contractStatusActive',
  orange: 'contractStatusExpiringSoon',
  red: 'contractStatusExpired',
};

export type ContractStatusReason = StatusReason;

export interface ContractStatusResult {
  level: ContractStatusLevel;
  reasons: ContractStatusReason[];
}

/**
 * Contract status is always DERIVED from `endDate`, never manually
 * selected — the single source of truth for this is the same
 * `computeDateExpiryStatus` utility already used for registration/
 * insurance/document expiry elsewhere (local-calendar-safe, never UTC
 * `toISOString()`), so the Active/Expiring Soon/Expired thresholds can
 * never drift out of sync with the rest of the app:
 *
 * - RED ("Expired") once today has reached or passed `endDate`.
 * - ORANGE ("Expiring Soon") within the next 30 calendar days.
 * - GREEN ("Active") otherwise, and always when there's no `endDate` at
 *   all (an open-ended contract is simply active).
 *
 * Used identically by ContractCard and ContractProfilePage so the
 * calculation exists in exactly one place. Also returns the (single,
 * since a contract only ever has one expiry signal) reason behind a
 * non-green level, in the same `{level, reasons}` shape every other
 * module's status uses, so the same shared presentation components work
 * here too.
 */
export function computeContractStatus(contract: Pick<Contract, 'endDate'>, now: Date = new Date()): ContractStatusResult {
  const level = computeDateExpiryStatus(contract.endDate, now) ?? 'green';
  if (level === 'green' || !contract.endDate) return { level, reasons: [] };
  const textKey: TranslationKey = level === 'red' ? 'contractReasonExpired' : 'contractReasonExpiringSoon';
  return { level, reasons: [{ level, textKey, params: { date: contract.endDate } }] };
}
