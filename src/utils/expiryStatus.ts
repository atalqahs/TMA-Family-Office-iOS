export type ExpiryStatusLevel = 'green' | 'orange' | 'red';

/** Shared across every "does this date need attention soon" check (Vehicles, Staff, ...). */
export const DEFAULT_EXPIRY_WARNING_DAYS = 30;

function daysUntil(dateStr: string, now: Date): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * RED when today or past, ORANGE within `warningDays`, GREEN otherwise.
 * Undefined when there's no date to judge — callers must never turn a
 * missing date into a fabricated warning.
 */
export function computeDateExpiryStatus(
  dateStr: string | undefined,
  now: Date = new Date(),
  warningDays: number = DEFAULT_EXPIRY_WARNING_DAYS,
): ExpiryStatusLevel | undefined {
  if (!dateStr) return undefined;
  const days = daysUntil(dateStr, now);
  if (days <= 0) return 'red';
  if (days <= warningDays) return 'orange';
  return 'green';
}
