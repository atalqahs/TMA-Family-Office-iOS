import { DB_NAME } from '../../src/storage/db';

/**
 * Opens the app's real database name at an OLDER version, running
 * `onUpgrade` to hand-build a realistic historical schema/seed data — the
 * same raw `indexedDB.open` API the browser (and `idb`) itself uses, so
 * these tests exercise the app's REAL upgrade path (via `getDB()`
 * afterwards) rather than a simulated one. The connection is closed again
 * immediately so a subsequent `getDB()` call can freely upgrade it.
 */
export function seedRawVersionedDb(version: number, onUpgrade: (db: IDBDatabase, tx: IDBTransaction) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, version);
    request.onupgradeneeded = () => {
      onUpgrade(request.result, request.transaction as IDBTransaction);
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('seedRawVersionedDb: open request blocked'));
  });
}
