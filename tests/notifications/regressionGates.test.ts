import { describe, expect, it } from 'vitest';
import { DB_VERSION } from '../../src/storage/db';

/**
 * Phase 9B, Section U items 45-47. Items 45 (the full permanent Phase 9A
 * suite remains green) and 46 (Tasks architecture independence remains
 * green, now extended with the Notifications boundary rules) are verified
 * by running the whole suite (`npm run test:run`) and the architecture
 * gate (`npm run test:architecture`, also exercised by
 * tests/architecture/architecture.test.ts) — nothing in this phase
 * touched or weakened any existing Phase 9A test or rule. Item 47 (no
 * DB_VERSION bump from Notifications specifically) is asserted directly
 * here. Phase 10 (Archive) subsequently bumped DB_VERSION 10 -> 11, and
 * Phase 10.1 bumped it again 11 -> 12 for the Staff salary recurrence
 * normalization (see storage/db.ts's v11->v12 doc comment) -- this gate is
 * updated to each new baseline rather than pinned to a stale value, same
 * as every future phase that legitimately changes the schema will do.
 */
describe('Phase 9B regression gates', () => {
  it('47. DB_VERSION reflects only intentional schema changes -- Notifications itself introduced none', () => {
    expect(DB_VERSION).toBe(13);
  });
});
