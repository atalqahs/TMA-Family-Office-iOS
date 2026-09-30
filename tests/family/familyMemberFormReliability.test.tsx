import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FamilyMemberForm } from '../../src/features/family/components/FamilyMemberForm';
import * as familyRepository from '../../src/features/family/familyRepository';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

/**
 * Maintenance hardening regression suite for two confirmed defects in
 * FamilyMemberForm: `TODAY` was computed once at module load (stale after
 * local midnight while the app stays open), and the async Civil ID
 * duplicate check had no guard against being edited again before it
 * resolved (a stale "duplicate" result could land on a now-different
 * value). Both are fixed directly in the component; these tests fail
 * against the original code and pass after the fix.
 */
vi.mock('../../src/features/family/familyRepository', async () => {
  const actual = await vi.importActual<typeof import('../../src/features/family/familyRepository')>(
    '../../src/features/family/familyRepository',
  );
  return { ...actual, findFamilyMembersByCivilId: vi.fn() };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('FamilyMemberForm: "today" is computed at render time, not module load', () => {
  it('a cross-local-midnight re-render updates the Date of Birth max, not the day the module first loaded', async () => {
    await setSetting('locale', 'en');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 15, 23, 59, 0)); // June 15, 23:59 local

    render(
      <LanguageProvider>
        <FamilyMemberForm onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );
    const dobInput = (await screen.findByLabelText('Date of Birth')) as HTMLInputElement;
    expect(dobInput.max).toBe('2026-06-15');

    // Cross local midnight, then re-render via an unrelated edit.
    vi.setSystemTime(new Date(2026, 5, 16, 0, 1, 0));
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Sara' } });

    expect(dobInput.max).toBe('2026-06-16');
  });
});

describe('FamilyMemberForm: the async Civil ID duplicate check cannot apply a stale result', () => {
  it('never shows the duplicate warning for a value that was edited again while the check was still in flight', async () => {
    await setSetting('locale', 'en');
    const check = deferred<Array<{ id: string }>>();
    vi.mocked(familyRepository.findFamilyMembersByCivilId).mockReturnValueOnce(check.promise as Promise<never[]>);

    render(
      <LanguageProvider>
        <FamilyMemberForm onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );

    const civilIdInput = await screen.findByLabelText('Civil ID');
    fireEvent.change(civilIdInput, { target: { value: '111111' } });
    fireEvent.blur(civilIdInput); // kicks off the async check for "111111"

    // Before that check resolves, the user edits the field again.
    fireEvent.change(civilIdInput, { target: { value: '222222' } });

    await act(async () => {
      check.resolve([{ id: 'other' }] as never); // "111111" WAS a duplicate
      await Promise.resolve();
    });

    // The warning must never appear for the now-different "222222" value.
    expect(screen.queryByText('Another family member already has this Civil ID.')).not.toBeInTheDocument();
  });

  it('still shows the duplicate warning when the checked value is still current when the check resolves', async () => {
    await setSetting('locale', 'en');
    vi.mocked(familyRepository.findFamilyMembersByCivilId).mockResolvedValueOnce([{ id: 'other' }] as never);

    render(
      <LanguageProvider>
        <FamilyMemberForm onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );

    const civilIdInput = await screen.findByLabelText('Civil ID');
    fireEvent.change(civilIdInput, { target: { value: '111111' } });
    await act(async () => {
      fireEvent.blur(civilIdInput);
      await Promise.resolve();
    });

    expect(await screen.findByText('Another family member already has this Civil ID.')).toBeInTheDocument();
  });
});
