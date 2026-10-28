import { describe, expect, it } from 'vitest';
import { loadNotifications } from '../../src/features/notifications/notificationService';
import { buildContractNotifications } from '../../src/features/notifications/sources/contractNotifications';
import { buildStaffNotifications } from '../../src/features/notifications/sources/staffNotifications';
import { buildVehicleNotifications } from '../../src/features/notifications/sources/vehicleNotifications';
import * as contractRepository from '../../src/features/contracts/contractRepository';
import * as staffRepository from '../../src/features/staff/staffRepository';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';

const NOW = '2026-01-01T00:00:00.000Z';
const now = new Date('2026-06-01T00:00:00.000Z');

/**
 * Permanent Phase 10 regression suite -- Section Z (MANDATORY, 11 items):
 * "Archive is NOT Inactive." An archived entity must continue producing
 * Notifications exactly as if it were active -- there must be no
 * `if (archived) return noNotification` (or equivalent) anywhere in the
 * Notifications path. Verified at two levels: the pure source-function
 * level (an archived entity object in, a Notification out) and the full
 * DB-integrated aggregator level (loadNotifications against a real
 * archived record in IndexedDB).
 */

describe('Source-level: archived entities still produce Notifications (pure functions)', () => {
  it('an archived vehicle with expired registration still produces its Notification', () => {
    const items = buildVehicleNotifications(
      [{ id: 'v1', name: 'Family SUV', registrationExpiry: '2025-01-01', createdAt: NOW, updatedAt: NOW, archivedAt: NOW }],
      [],
      now,
    );
    expect(items.some((item) => item.kind === 'vehicleRegistrationExpired')).toBe(true);
  });

  it('an archived contract with an expired end date still produces its Notification', () => {
    const items = buildContractNotifications(
      [
        {
          id: 'c1',
          title: 'Villa Rental',
          contractType: 'rental',
          partyName: 'ACME',
          startDate: '2025-01-01',
          endDate: '2025-06-01',
          createdAt: NOW,
          updatedAt: NOW,
          archivedAt: NOW,
        },
      ],
      now,
    );
    expect(items.some((item) => item.kind === 'contractExpired')).toBe(true);
  });

  it('an archived staff member with expiring residency still produces its Notification', () => {
    const items = buildStaffNotifications(
      [{ id: 's1', fullName: 'Driver Ali', residencyExpiry: '2026-06-10', createdAt: NOW, updatedAt: NOW, archivedAt: NOW }],
      [],
      [],
      now,
    );
    expect(items.some((item) => item.kind === 'staffResidencyExpiringSoon')).toBe(true);
  });

  it('a Notification for an archived source still routes to the entity\'s normal (unchanged) profile route -- Section K design decision', () => {
    const items = buildVehicleNotifications(
      [{ id: 'v1', name: 'Family SUV', registrationExpiry: '2025-01-01', createdAt: NOW, updatedAt: NOW, archivedAt: NOW }],
      [],
      now,
    );
    expect(items[0].route).toBe('/vehicles/v1');
  });
});

describe('Aggregator-level: loadNotifications reads listX() (archived included), never listActiveX()', () => {
  it('an archived vehicle in the real database still contributes a Notification via loadNotifications', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Family SUV',
      registrationExpiry: '2025-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await vehicleRepository.archiveVehicle('v1');

    const items = await loadNotifications(now);
    expect(items.some((item) => item.sourceId === 'v1' && item.kind === 'vehicleRegistrationExpired')).toBe(true);
  });

  it('an archived contract in the real database still contributes a Notification via loadNotifications', async () => {
    await contractRepository.saveContract({
      id: 'c1',
      title: 'Villa Rental',
      contractType: 'rental',
      partyName: 'ACME',
      startDate: '2025-01-01',
      endDate: '2025-06-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await contractRepository.archiveContract('c1');

    const items = await loadNotifications(now);
    expect(items.some((item) => item.sourceId === 'c1' && item.kind === 'contractExpired')).toBe(true);
  });

  it('an archived staff member in the real database still contributes a Notification via loadNotifications', async () => {
    await staffRepository.saveStaffMember({
      id: 's1',
      fullName: 'Driver Ali',
      residencyExpiry: '2026-06-10',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await staffRepository.archiveStaffMember('s1');

    const items = await loadNotifications(now);
    expect(items.some((item) => item.sourceId === 's1' && item.kind === 'staffResidencyExpiringSoon')).toBe(true);
  });

  it('a PERMANENTLY DELETED entity, unlike an archived one, correctly STOPS producing Notifications (Phase 11: Delete is real, no Trash intermediate state)', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Family SUV',
      registrationExpiry: '2025-01-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await vehicleRepository.archiveVehicle('v1');
    await vehicleRepository.deleteVehicleWithChildren('v1');

    const items = await loadNotifications(now);
    expect(items.some((item) => item.sourceId === 'v1')).toBe(false);
  });

  it('archived AND active entities of the same type BOTH produce Notifications side by side -- archiving one never suppresses the other', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Archived SUV', registrationExpiry: '2025-01-01', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.saveVehicle({ id: 'v2', name: 'Active SUV', registrationExpiry: '2025-02-01', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');

    const items = await loadNotifications(now);
    expect(items.some((item) => item.sourceId === 'v1')).toBe(true);
    expect(items.some((item) => item.sourceId === 'v2')).toBe(true);
  });
});
