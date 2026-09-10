import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * Central IndexedDB schema for the prototype.
 *
 * Feature modules (family, vehicles, staff, properties, ...) will add their
 * own object stores here later, bumping DB_VERSION and handling migration
 * inside `upgrade`. For this skeleton only a generic `settings` store
 * exists, used to persist app preferences (e.g. language).
 */
interface TmaDB extends DBSchema {
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'tma-family-office';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TmaDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<TmaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TmaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
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
