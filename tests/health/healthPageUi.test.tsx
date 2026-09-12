import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HealthPage } from '../../src/pages/HealthPage';
import { HealthProfilePage } from '../../src/pages/HealthProfilePage';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as healthRepository from '../../src/features/health/healthRepository';
import * as healthService from '../../src/features/health/healthService';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

const NOW = '2026-01-01T00:00:00.000Z';

function renderApp(initialPath: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/health" element={<HealthPage />} />
          <Route path="/health/:profileId" element={<HealthProfilePage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

/**
 * Permanent Phase 11 UI regression suite -- Health list/create/profile
 * pages (Part 3.E/F). Covers the family-member picker creation flow, the
 * duplicate-profile guard (guides to the existing profile instead of
 * creating a second one), and read-only Family identity display.
 */
describe('HealthPage: create flow', () => {
  it('creating a Health profile for a Family Member with none yet navigates to the new profile', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });

    renderApp('/health');

    (await screen.findByRole('button', { name: '+ Add Health Record' })).click();
    const select = await screen.findByLabelText('Select Family Member');
    expect(select).toHaveValue('fm1');
    screen.getByRole('button', { name: 'Save' }).click();

    await screen.findByText('Ahmad');
  });

  it('choosing a Family Member who already has a Health profile guides the user to the existing profile instead of creating a duplicate', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });

    renderApp('/health');

    // First creation, entirely through the UI.
    (await screen.findByRole('button', { name: '+ Add Health Record' })).click();
    await screen.findByLabelText('Select Family Member');
    screen.getByRole('button', { name: 'Save' }).click();
    await screen.findByText('Ahmad');

    const afterFirst = await healthRepository.listHealthProfiles();
    expect(afterFirst).toHaveLength(1);
    const firstProfileId = afterFirst[0].id;

    // Attempting to create a SECOND profile for the same member (e.g. the
    // user navigates back to Health and adds one again) must guide back to
    // the SAME existing profile, never create a duplicate.
    cleanup();
    renderApp('/health');
    (await screen.findByRole('button', { name: '+ Add Health Record' })).click();
    await screen.findByLabelText('Select Family Member');
    screen.getByRole('button', { name: 'Save' }).click();
    await screen.findByText('Ahmad');

    const afterSecond = await healthRepository.listHealthProfiles();
    expect(afterSecond).toHaveLength(1);
    expect(afterSecond[0].id).toBe(firstProfileId);
  });
});

describe('HealthProfilePage: Family identity is read-only, resolved live', () => {
  it('displays the Family Member\'s current identity fields, never a stale copy', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({
      id: 'fm1',
      fullName: 'Ahmad',
      nationality: 'Kuwaiti',
      civilId: '123456789',
      createdAt: NOW,
      updatedAt: NOW,
    });
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    renderApp(`/health/${profile.id}`);

    await screen.findByText('Ahmad');
    expect(screen.getByText('Kuwaiti')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
  });

  it('editing Health-specific fields via the Edit sheet never shows a Family identity field to edit', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    renderApp(`/health/${profile.id}`);

    await screen.findByText('Ahmad');
    screen.getByRole('button', { name: 'Edit' }).click();

    await screen.findByLabelText('Health Status');
    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Select Family Member')).not.toBeInTheDocument();
  });

  it('the delete confirmation clearly states the deletion is permanent and cannot be undone', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Ahmad', createdAt: NOW, updatedAt: NOW });
    const profile = await healthService.createHealthProfile('fm1', { healthStatus: 'healthy' });

    renderApp(`/health/${profile.id}`);

    await screen.findByText('Ahmad');
    screen.getByRole('button', { name: 'Delete Health Record' }).click();

    expect(await screen.findByText(/permanent/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });
});
