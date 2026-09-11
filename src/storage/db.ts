import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Contract, ContractDocument } from '../features/contracts/types';
import type { FamilyMember, FamilyMemberDocument } from '../features/family/types';
import type { Property, PropertyDocument } from '../features/properties/types';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment, StaffSalarySchedule } from '../features/staff/types';
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
 * Phase 5, all of that survives the v4 -> v5 upgrade that added the staff
 * stores in Phase 6, all of that survives the v5 -> v6 upgrade that added
 * recurring salary schedules, and all of that survives the v6 -> v7
 * upgrade that added the Contracts stores in Phase 7).
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
  staffSalarySchedules: {
    key: string;
    value: StaffSalarySchedule;
    indexes: { staffId: string };
  };
  staffSalaryPayments: {
    key: string;
    value: StaffSalaryPayment;
    indexes: { staffId: string; scheduleId_dueDate: [string, string] };
  };
  contracts: {
    key: string;
    value: Contract;
  };
  contractDocuments: {
    key: string;
    value: ContractDocument;
    indexes: { contractId: string };
  };
}

const DB_NAME = 'tma-family-office';
const DB_VERSION = 7;

let dbPromise: Promise<IDBPDatabase<TmaDB>> | null = null;

/**
 * IndexedDB connection lifecycle state, for the rare cases where opening
 * the database can't just quietly succeed:
 *
 * - 'blocked': this tab's open/upgrade request is stuck behind another
 *   tab/window/app-instance that still holds an older-version connection
 *   open. We NEVER delete/reset the database to force past this — the
 *   only safe fix is for that other instance to close, so we surface a
 *   clear message asking the user to close other instances, with a Retry
 *   (a plain reload, which is safe and re-attempts the open).
 * - 'terminated': the browser abnormally killed our connection (a rare
 *   engine-level event, not something app code triggers). The poisoned
 *   cached connection/promise is dropped so the next `getDB()` call
 *   attempts a fresh, real reopen; we surface a recoverable message with
 *   the same Retry action rather than silently failing later operations.
 *
 * This state (and all handling of `blocked`/`blocking`/`terminated`) lives
 * entirely here in the storage layer — UI only ever reads it via
 * `subscribeDbLifecycle`, never re-implements any of this logic itself.
 */
export type DbLifecycleState = { status: 'ok' } | { status: 'blocked' } | { status: 'terminated' };

let lifecycleState: DbLifecycleState = { status: 'ok' };
const lifecycleListeners = new Set<(state: DbLifecycleState) => void>();

function setLifecycleState(next: DbLifecycleState): void {
  lifecycleState = next;
  for (const listener of lifecycleListeners) listener(next);
}

export function getDbLifecycleState(): DbLifecycleState {
  return lifecycleState;
}

/** Subscribes to lifecycle changes; call the returned function to unsubscribe. Immediately invokes `listener` with the current state. */
export function subscribeDbLifecycle(listener: (state: DbLifecycleState) => void): () => void {
  lifecycleListeners.add(listener);
  listener(lifecycleState);
  return () => {
    lifecycleListeners.delete(listener);
  };
}

export function getDB(): Promise<IDBPDatabase<TmaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TmaDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
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
        if (!db.objectStoreNames.contains('staffSalarySchedules')) {
          const store = db.createObjectStore('staffSalarySchedules', { keyPath: 'id' });
          store.createIndex('staffId', 'staffId');
        }

        // staffSalaryPayments existed since Phase 6 with a unique
        // (staffId, salaryMonth) index enforcing "one payment per staff per
        // calendar month". The redesigned recurring-schedule model
        // intentionally allows multiple schedules due the same day, so that
        // rule no longer holds — replaced with uniqueness on
        // (salaryScheduleId, dueDate) instead. Existing records and all
        // their fields (including `salaryMonth`) are left completely
        // untouched; only the index structure changes.
        const paymentsStore = db.objectStoreNames.contains('staffSalaryPayments')
          ? transaction.objectStore('staffSalaryPayments')
          : (() => {
              const store = db.createObjectStore('staffSalaryPayments', { keyPath: 'id' });
              store.createIndex('staffId', 'staffId');
              return store;
            })();
        // `idb`'s typed `deleteIndex` only accepts index names from the
        // CURRENT schema, but this index only ever existed under the
        // pre-redesign schema — cast to the underlying native
        // IDBObjectStore for this one legacy-cleanup call.
        const legacyPaymentsStore = paymentsStore as unknown as IDBObjectStore;
        if (legacyPaymentsStore.indexNames.contains('staffId_salaryMonth')) {
          legacyPaymentsStore.deleteIndex('staffId_salaryMonth');
        }
        if (!paymentsStore.indexNames.contains('scheduleId_dueDate')) {
          paymentsStore.createIndex('scheduleId_dueDate', ['salaryScheduleId', 'dueDate'], { unique: true });
        }

        if (!db.objectStoreNames.contains('contracts')) {
          db.createObjectStore('contracts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('contractDocuments')) {
          const store = db.createObjectStore('contractDocuments', { keyPath: 'id' });
          store.createIndex('contractId', 'contractId');
        }
      },
      blocked() {
        // Another tab/window/app-instance still holds an older-version
        // connection open — never force past this by deleting/recreating
        // the database. Just surface it; the request resolves on its own
        // once that other instance closes.
        setLifecycleState({ status: 'blocked' });
      },
      blocking() {
        // This tab's own (now-stale) connection is blocking a newer
        // version from opening elsewhere (e.g. another tab loaded a
        // newer deployment). Close it so that upgrade can proceed without
        // any data loss — IndexedDB upgrades are additive by construction
        // here, so releasing the old connection is always safe.
        void dbPromise?.then((db) => db.close());
      },
      terminated() {
        // The browser killed our connection unexpectedly. Drop the cached
        // promise so the next getDB() call performs a genuine fresh
        // reopen instead of reusing a dead connection, and surface a
        // recoverable (not destructive) error state.
        dbPromise = null;
        setLifecycleState({ status: 'terminated' });
      },
    })
      .then((db) => {
        if (lifecycleState.status === 'blocked') {
          setLifecycleState({ status: 'ok' });
        }
        return db;
      })
      .catch((error) => {
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
