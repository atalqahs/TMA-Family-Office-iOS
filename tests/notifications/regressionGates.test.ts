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
 * DB_VERSION bump) is asserted directly here.
 */
describe('Phase 9B regression gates', () => {
  it('47. DB_VERSION remains unchanged at 10 -- Notifications introduced no schema change', () => {
    expect(DB_VERSION).toBe(10);
  });
});
