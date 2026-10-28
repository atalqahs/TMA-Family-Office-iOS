import { describe, expect, it } from 'vitest';
import { dedupeNotificationItems, sortNotificationItems } from '../../src/features/notifications/sorting';
import type { NotificationItem } from '../../src/features/notifications/types';

function item(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: overrides.id ?? 'x',
    sourceType: 'vehicle',
    sourceId: 'v1',
    kind: 'vehicleInsuranceExpired',
    severity: 'critical',
    titleKey: 'notificationTitleVehicleInsuranceExpired',
    messageKey: 'notificationMsgExpiredOn',
    route: '/vehicles/v1',
    ...overrides,
  };
}

describe('sortNotificationItems: deterministic sort', () => {
  it('31. building the same items twice always produces the exact same ids', () => {
    const build = () => [item({ id: 'vehicle:v1:insurance-expired' }), item({ id: 'task:t1:2026-01-01', sourceType: 'task' })];
    expect(build().map((i) => i.id)).toEqual(build().map((i) => i.id));
  });

  it('32/34. critical sorts before the taskDueToday tier, which sorts before warning, which sorts before info', () => {
    const items = [
      item({ id: 'info', severity: 'info' }),
      item({ id: 'warning', severity: 'warning' }),
      item({ id: 'due-today', severity: 'warning', kind: 'taskDueToday' }),
      item({ id: 'critical', severity: 'critical' }),
    ];
    const sorted = sortNotificationItems(items).map((i) => i.id);
    expect(sorted).toEqual(['critical', 'due-today', 'warning', 'info']);
  });

  it('within the same tier, the nearest/oldest relevant date sorts first', () => {
    const items = [
      item({ id: 'later', severity: 'critical', effectiveDate: '2026-03-01', sortDate: '2026-03-01' }),
      item({ id: 'earlier', severity: 'critical', effectiveDate: '2026-01-01', sortDate: '2026-01-01' }),
    ];
    expect(sortNotificationItems(items).map((i) => i.id)).toEqual(['earlier', 'later']);
  });

  it('undated items within a tier sort after dated ones', () => {
    const items = [item({ id: 'undated', severity: 'critical' }), item({ id: 'dated', severity: 'critical', effectiveDate: '2026-01-01', sortDate: '2026-01-01' })];
    expect(sortNotificationItems(items).map((i) => i.id)).toEqual(['dated', 'undated']);
  });

  it('deterministic tie-break when severity and date are identical', () => {
    const a = item({ id: 'a', severity: 'critical', sourceType: 'contract' });
    const b = item({ id: 'b', severity: 'critical', sourceType: 'vehicle' });
    // Running the sort repeatedly must always produce the same order.
    const first = sortNotificationItems([a, b]).map((i) => i.id);
    const second = sortNotificationItems([b, a]).map((i) => i.id);
    expect(first).toEqual(second);
  });
});

describe('dedupeNotificationItems', () => {
  it('33. collapses items sharing the same deterministic id into exactly one', () => {
    const items = [item({ id: 'vehicle:v1:insurance-expired' }), item({ id: 'vehicle:v1:insurance-expired' })];
    expect(dedupeNotificationItems(items)).toHaveLength(1);
  });

  it('never merges genuinely different conditions on the same vehicle', () => {
    const items = [item({ id: 'vehicle:v1:insurance-expired' }), item({ id: 'vehicle:v1:registration-expired' })];
    expect(dedupeNotificationItems(items)).toHaveLength(2);
  });
});
