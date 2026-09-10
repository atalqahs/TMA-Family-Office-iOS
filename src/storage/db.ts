import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { FamilyMember, FamilyMemberDocument } from '../features/family/types';
import type { Property, PropertyDocument } from '../features/properties/types';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment } from '../features/staff/types';
import type { Vehicle, VehicleDocument, VehicleMaintenanceRecord } from '../features/vehicles/types';

/**
 * Central IndexedDB schema for the prototype.
 *
 * Feature modules add their own object stores here, bumping DB_VERSION and
 * extending `upgrade` — existing stores are left untouched by the
 * `objectStoreNames.contains` guards, so upgrading never drops previously
 * persisted data (e.g. Phase 1/2 settings and Phase 3 Family data survive
 * the v2 -> v3 upgrade that added the property stores in Phase 4, all of
 * that survives the v3 -> v4 upgrade that added the vehicle stores in
 * Phase 5, and all of that survives the v4 -> v5 upgrade that added the
 * staff stores in Phase 6).
 */
interface TmaDB extends DBSchema {
  settings: {
    key: string;
    value: unknown;
  };
  familyMembers: {
    key: string;
    value: FamilyMember;
  };
  familyMemberDocuments: {
    key: string;
    value: FamilyMemberDocument;
    indexes: { familyMemberId: string };
  };
  properties: {
    key: string;
    value: Property;
  };
  propertyDocuments: {
    key: string;
    value: PropertyDocument;
    indexes: { propertyId: string };
  };
  vehicles: {
    key: string;
    value: Vehicle;
  };
  vehicleDocuments: {
    key: string;
    value: VehicleDocument;
    indexes: { vehicleId: string };
  };
  vehicleMaintenanceRecords: {
    key: string;
    value: VehicleMaintenanceRecord;
    indexes: { vehicleId: string };
  };
  householdStaff: {
    key: string;
    value: HouseholdStaff;
  };
  staffDocuments: {
    key: string;
    value: StaffDocument;
    indexes: { staffId: string };
  };
  staffSalaryPayments: {
    key: string;
    value: StaffSalaryPayment;
    indexes: { staffId: string; staffId_salaryMonth: [string, string] };
  };
}

const DB_NAME = 'tma-family-office';
const DB_VERSION = 5;

let dbPromise: Promise<IDBPDatabase<TmaDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<TmaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TmaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('familyMembers')) {
          db.createObjectStore('familyMembers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('familyMemberDocuments')) {
          const store = db.createObjectStore('familyMemberDocuments', { keyPath: 'id' });
          store.createIndex('familyMemberId', 'familyMemberId');
        }
        if (!db.objectStoreNames.contains('properties')) {
          db.createObjectStore('properties', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('propertyDocuments')) {
          const store = db.createObjectStore('propertyDocuments', { keyPath: 'id' });
          store.createIndex('propertyId', 'propertyId');
        }
        if (!db.objectStoreNames.contains('vehicles')) {
          db.createObjectStore('vehicles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('vehicleDocuments')) {
          const store = db.createObjectStore('vehicleDocuments', { keyPath: 'id' });
          store.createIndex('vehicleId', 'vehicleId');
        }
        if (!db.objectStoreNames.contains('vehicleMaintenanceRecords')) {
          const store = db.createObjectStore('vehicleMaintenanceRecords', { keyPath: 'id' });
          store.createIndex('vehicleId', 'vehicleId');
        }
        if (!db.objectStoreNames.contains('householdStaff')) {
          db.createObjectStore('householdStaff', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('staffDocuments')) {
          const store = db.createObjectStore('staffDocuments', { keyPath: 'id' });
          store.createIndex('staffId', 'staffId');
        }
        if (!db.objectStoreNames.contains('staffSalaryPayments')) {
          const store = db.createObjectStore('staffSalaryPayments', { keyPath: 'id' });
          store.createIndex('staffId', 'staffId');
          // Unique so a duplicate (staffId, salaryMonth) pair can never be
          // created even if the app-level pre-check in staffService is
          // somehow bypassed — defense in depth for "one payment per staff
          // per month".
          store.createIndex('staffId_salaryMonth', ['staffId', 'salaryMonth'], { unique: true });
        }
      },
    }).catch((error) => {
      // Don't cache a broken connection forever — let the next call retry.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDB();
  const value = await db.get('settings', key);
  return value === undefined ? fallback : (value as T);
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}
