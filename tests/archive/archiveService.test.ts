import { describe, expect, it } from 'vitest';
import {
  getArchivedCardsForSource,
  getArchiveCategorySummaries,
  getTotalArchivedCardCount,
} from '../../src/features/archive/archiveService';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as staffRepository from '../../src/features/staff/staffRepository';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import * as taskRepository from '../../src/features/tasks/taskRepository';

const NOW = '2026-01-01T00:00:00.000Z';

/**
 * Permanent Phase 10 regression suite -- Section "Archive Page" (#17-24):
 * the main Archive page must be fully dynamic, showing ONLY categories
 * that currently contain at least one archived card, with no empty
 * placeholders, and the total count must be the number of archived CARDS
 * (never the number of categories).
 */
describe('Archive aggregator: dynamic category discovery', () => {
  it('returns zero categories when nothing anywhere is archived', async () => {
    await familyRepository.saveFamilyMember({ id: 'f1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    expect(await getArchiveCategorySummaries()).toEqual([]);
  });

  it('a category APPEARS the moment its first card is archived, with count 1', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    expect(await getArchiveCategorySummaries()).toEqual([]);

    await vehicleRepository.archiveVehicle('v1');
    expect(await getArchiveCategorySummaries()).toEqual([{ sourceType: 'vehicles', count: 1 }]);
  });

  it('a category DISAPPEARS the moment its last archived card is unarchived (or soft-deleted) -- never an empty placeholder', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');
    expect(await getArchiveCategorySummaries()).toHaveLength(1);

    await vehicleRepository.unarchiveVehicle('v1');
    expect(await getArchiveCategorySummaries()).toEqual([]);
  });

  it('multiple categories with archived cards all appear at once, each with its own correct count', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'SUV 1', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.saveVehicle({ id: 'v2', name: 'SUV 2', createdAt: NOW, updatedAt: NOW });
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Driver Ali', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');
    await vehicleRepository.archiveVehicle('v2');
    await staffRepository.archiveStaffMember('s1');

    const summaries = await getArchiveCategorySummaries();
    expect(summaries.sort((a, b) => a.sourceType.localeCompare(b.sourceType))).toEqual([
      { sourceType: 'staff', count: 1 },
      { sourceType: 'vehicles', count: 2 },
    ]);
  });

  it('getTotalArchivedCardCount sums CARDS across all sources, never the number of categories', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'SUV 1', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.saveVehicle({ id: 'v2', name: 'SUV 2', createdAt: NOW, updatedAt: NOW });
    await staffRepository.saveStaffMember({ id: 's1', fullName: 'Driver Ali', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');
    await vehicleRepository.archiveVehicle('v2');
    await staffRepository.archiveStaffMember('s1');

    // 3 archived cards across only 2 categories -- the count must be 3, not 2.
    expect(await getTotalArchivedCardCount()).toBe(3);
  });

  it('getArchivedCardsForSource returns only that source\'s archived items, each with id/sourceType/title/archivedAt/route', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');

    const cards = await getArchivedCardsForSource('vehicles');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ id: 'v1', sourceType: 'vehicles', title: 'Family SUV', route: '/vehicles/v1' });
    expect(cards[0].archivedAt).toBeDefined();
  });

  it('a soft-deleted ("Delete Card") entity never appears in Archive at all -- hidden from both the active list AND Archive', async () => {
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');
    await vehicleRepository.softDeleteVehicle('v1');

    expect(await getArchiveCategorySummaries()).toEqual([]);
    expect(await getArchivedCardsForSource('vehicles')).toEqual([]);
    expect(await getTotalArchivedCardCount()).toBe(0);
  });

  it('TaskGroup archiving is reflected through the same aggregator as every other source', async () => {
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });
    await taskRepository.archiveTaskGroup('g1');

    expect(await getArchiveCategorySummaries()).toEqual([{ sourceType: 'tasks', count: 1 }]);
    const cards = await getArchivedCardsForSource('tasks');
    expect(cards[0]).toMatchObject({ id: 'g1', sourceType: 'tasks', title: 'Vehicle Reminders', route: '/tasks/group/g1' });
  });
});
