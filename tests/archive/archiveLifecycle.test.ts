import { describe, expect, it } from 'vitest';
import * as familyRepository from '../../src/features/family/familyRepository';
import type { FamilyMember } from '../../src/features/family/types';
import * as staffRepository from '../../src/features/staff/staffRepository';
import type { HouseholdStaff } from '../../src/features/staff/types';
import * as propertyRepository from '../../src/features/properties/propertyRepository';
import type { Property } from '../../src/features/properties/types';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import type { Vehicle } from '../../src/features/vehicles/types';
import * as contractRepository from '../../src/features/contracts/contractRepository';
import type { Contract } from '../../src/features/contracts/types';

/**
 * Permanent Phase 10 regression suite -- Section Y (General), Active Lists
 * (#10-16), and Data Preservation (#25-33). Every archive-capable
 * top-level card type (Family, Staff, Properties, Vehicles, Contracts --
 * TaskGroup is covered separately in taskGroupArchiveLifecycle.test.ts,
 * since its API/shape differs) shares the exact same three-tier
 * repository contract, so it's verified once per module via a small
 * config table rather than five near-identical hand-written test files.
 */

interface Lifecycle<T extends { id: string; archivedAt?: string; createdAt: string; updatedAt: string }> {
  name: string;
  /** The underlying IndexedDB object store name, for reads that must bypass each module's own get() conventions. */
  storeName: string;
  build: (overrides: Partial<T>) => T;
  save: (record: T) => Promise<void>;
  get: (id: string) => Promise<T | undefined>;
  /** listX(): archived INCLUDED -- the Notifications/Archive read path. */
  listAll: () => Promise<T[]>;
  /** listActiveX(): excludes archived -- the normal category list/count. */
  listActive: () => Promise<T[]>;
  archive: (id: string) => Promise<void>;
  unarchive: (id: string) => Promise<void>;
}

const NOW = '2026-01-01T00:00:00.000Z';

interface ArchivableRecord {
  id: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Five genuinely different concrete record shapes share one erased shape
// here purely so `describe.each` can drive the same test bodies against
// all five -- each entry below is still built and consumed with its real,
// specific type; only the array's element type is erased in one place.
const modules = [
  {
    name: 'Family',
    storeName: 'familyMembers',
    build: (overrides: Partial<FamilyMember>) => ({ id: 'e1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW, ...overrides }),
    save: familyRepository.saveFamilyMember,
    get: familyRepository.getFamilyMember,
    listAll: familyRepository.listFamilyMembers,
    listActive: familyRepository.listActiveFamilyMembers,
    archive: familyRepository.archiveFamilyMember,
    unarchive: familyRepository.unarchiveFamilyMember,
  },
  {
    name: 'Staff',
    storeName: 'householdStaff',
    build: (overrides: Partial<HouseholdStaff>) => ({ id: 'e1', fullName: 'Driver Ali', createdAt: NOW, updatedAt: NOW, ...overrides }),
    save: staffRepository.saveStaffMember,
    get: staffRepository.getStaffMember,
    listAll: staffRepository.listStaff,
    listActive: staffRepository.listActiveStaff,
    archive: staffRepository.archiveStaffMember,
    unarchive: staffRepository.unarchiveStaffMember,
  },
  {
    name: 'Properties',
    storeName: 'properties',
    build: (overrides: Partial<Property>) => ({
      id: 'e1',
      name: 'Villa 1',
      type: 'house',
      status: 'owned',
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    }),
    save: propertyRepository.saveProperty,
    get: propertyRepository.getProperty,
    listAll: propertyRepository.listProperties,
    listActive: propertyRepository.listActiveProperties,
    archive: propertyRepository.archiveProperty,
    unarchive: propertyRepository.unarchiveProperty,
  },
  {
    name: 'Vehicles',
    storeName: 'vehicles',
    build: (overrides: Partial<Vehicle>) => ({ id: 'e1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW, ...overrides }),
    save: vehicleRepository.saveVehicle,
    get: vehicleRepository.getVehicle,
    listAll: vehicleRepository.listVehicles,
    listActive: vehicleRepository.listActiveVehicles,
    archive: vehicleRepository.archiveVehicle,
    unarchive: vehicleRepository.unarchiveVehicle,
  },
  {
    name: 'Contracts',
    storeName: 'contracts',
    build: (overrides: Partial<Contract>) => ({
      id: 'e1',
      title: 'Villa Rental',
      contractType: 'rental',
      partyName: 'ACME Properties',
      startDate: '2026-01-01',
      createdAt: NOW,
      updatedAt: NOW,
      ...overrides,
    }),
    save: contractRepository.saveContract,
    get: contractRepository.getContract,
    listAll: contractRepository.listContracts,
    listActive: contractRepository.listActiveContracts,
    archive: contractRepository.archiveContract,
    unarchive: contractRepository.unarchiveContract,
  },
] as unknown as Array<Lifecycle<ArchivableRecord>>;

describe.each(modules)('$name: archive/unarchive lifecycle', (mod) => {
  it('archiving sets ONLY archivedAt -- every other field is left byte-for-byte untouched', async () => {
    const record = mod.build({});
    await mod.save(record);
    await mod.archive(record.id);

    const archived = await mod.get(record.id);
    expect(archived?.archivedAt).toBeDefined();
    expect({ ...archived, archivedAt: undefined }).toEqual({ ...record, archivedAt: undefined });
  });

  it('an archived card is EXCLUDED from the active list/count', async () => {
    const record = mod.build({});
    await mod.save(record);
    await mod.archive(record.id);

    const active = await mod.listActive();
    expect(active.map((r) => r.id)).not.toContain(record.id);
  });

  it('an archived card is STILL INCLUDED in listX() -- the read path Notifications/Archive both use', async () => {
    const record = mod.build({});
    await mod.save(record);
    await mod.archive(record.id);

    const all = await mod.listAll();
    expect(all.map((r) => r.id)).toContain(record.id);
  });

  it('unarchiving fully REMOVES the archivedAt key (never leaves it set to undefined) and restores nothing else', async () => {
    const record = mod.build({});
    await mod.save(record);
    await mod.archive(record.id);
    await mod.unarchive(record.id);

    const restored = await mod.get(record.id);
    expect(restored).not.toHaveProperty('archivedAt');
    expect(restored).toEqual(record);
  });

  it('unarchiving returns the card to the active list, and archiving it again removes it again (round-trip, never a copy)', async () => {
    const record = mod.build({});
    await mod.save(record);

    await mod.archive(record.id);
    expect((await mod.listActive()).map((r) => r.id)).not.toContain(record.id);

    await mod.unarchive(record.id);
    expect((await mod.listActive()).map((r) => r.id)).toContain(record.id);
    expect(await mod.listActive()).toHaveLength(1); // never duplicated

    await mod.archive(record.id);
    expect((await mod.listActive()).map((r) => r.id)).not.toContain(record.id);
  });

  it('archiving one card never affects an unrelated active card of the same type', async () => {
    const a = mod.build({ id: 'a' });
    const b = mod.build({ id: 'b' });
    await mod.save(a);
    await mod.save(b);
    await mod.archive(a.id);

    const active = await mod.listActive();
    expect(active.map((r) => r.id)).toEqual(['b']);
    const all = await mod.listAll();
    expect(all.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });
});
