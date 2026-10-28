import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach } from 'vitest';
import { __resetDbConnectionForTests } from '../src/storage/db';

/**
 * jsdom has no real layout/viewport, so window.scrollTo() is a documented
 * no-op that otherwise logs a "Not implemented" console warning on every
 * call -- Sheet.tsx calls it on close to restore the page's scroll
 * position, which every test that opens/closes a sheet now does. A silent
 * stub is all jsdom needs here; it changes no test's behavior.
 */
window.scrollTo = () => {};

/**
 * Permanent, global test isolation (Phase 9A, Section P): every test gets a
 * brand-new, empty IndexedDB factory and a freshly-reset `storage/db.ts`
 * connection cache, so no test can observe data left behind by another —
 * regardless of execution order, and without any test having to remember
 * to clean up after itself. `cleanup()` (Phase 9B) unmounts any component
 * rendered by a previous test — without it, `globals: false` means
 * Testing Library's own automatic afterEach cleanup never registers, and
 * DOM nodes/queries leak across tests in the same file.
 */
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  __resetDbConnectionForTests();
});

afterEach(() => {
  cleanup();
  __resetDbConnectionForTests();
});
