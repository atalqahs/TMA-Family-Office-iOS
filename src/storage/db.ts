import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { FamilyMember, FamilyMemberDocument } from '../features/family/types';

/**
 * Central IndexedDB schema for the prototype.
 *
 * Feature modules add their own object stores here, bumping DB_VERSION and
 * extending `upgrade` — existing stores are left untouched by the
 * `objectStoreNames.contains` guards, so upgrading never drops previously
 * persisted data (e.g. Phase 1/2 settings survive the v1 -> v2 upgrade that
 * added the family stores in Phase 3).
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
}

const DB_NAME = 'tma-family-office';
const DB_VERSION = 2;

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
