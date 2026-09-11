import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach } from 'vitest';
import { __resetDbConnectionForTests } from '../src/storage/db';

/**
 * Permanent, global test isolation (Phase 9A, Section P): every test gets a
 * brand-new, empty IndexedDB factory and a freshly-reset `storage/db.ts`
 * connection cache, so no test can observe data left behind by another —
 * regardless of execution order, and without any test having to remember
 * to clean up after itself.
 */
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  __resetDbConnectionForTests();
});

afterEach(() => {
  __resetDbConnectionForTests();
});
