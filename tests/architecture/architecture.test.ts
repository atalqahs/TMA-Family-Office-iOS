import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Runs the permanent architecture gate (scripts/check-architecture.mjs,
 * also wired into `npm run test:architecture` / `npm run quality`) as part
 * of the regular test suite too, so a single `npm test` surfaces an
 * architecture regression without anyone needing to remember the separate
 * script exists.
 */
describe('Architecture quality gate', () => {
  it('the codebase has zero architecture violations (circular imports, Tasks cross-module imports, direct IndexedDB access from UI, getDB() leakage, destructive DB ops, ts-ignore, network calls, unreachable files)', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'check-architecture.mjs');
    expect(() => execFileSync('node', [scriptPath], { stdio: 'pipe' })).not.toThrow();
  });
});
