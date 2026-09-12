import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EducationPage } from '../../src/pages/EducationPage';
import { EducationProfilePage } from '../../src/pages/EducationProfilePage';
import * as familyRepository from '../../src/features/family/familyRepository';
import * as educationRepository from '../../src/features/education/educationRepository';
import * as educationService from '../../src/features/education/educationService';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

const NOW = '2026-01-01T00:00:00.000Z';

function renderApp(initialPath: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/education" element={<EducationPage />} />
          <Route path="/education/:profileId" element={<EducationProfilePage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

/**
 * Permanent Phase 11 UI regression suite -- Education list/create/profile
 * pages (Part 4.E/F), mirroring healthPageUi.test.tsx's coverage.
 */
describe('EducationPage: create flow', () => {
  it('creating an Education profile for a Family Member with none yet navigates to the new profile', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Sara', createdAt: NOW, updatedAt: NOW });

    renderApp('/education');

    (await screen.findByRole('button', { name: '+ Add Education Record' })).click();
    const select = await screen.findByLabelText('Select Family Member');
    expect(select).toHaveValue('fm1');
    fireEvent.change(screen.getByLabelText('Education Stage'), { target: { value: 'University' } });
    screen.getByRole('button', { name: 'Save' }).click();

    await screen.findByText('Sara');
  });

  it('choosing a Family Member who already has an Education profile guides back to the same existing profile, never a duplicate', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Sara', createdAt: NOW, updatedAt: NOW });

    renderApp('/education');

    // First creation, entirely through the UI.
    (await screen.findByRole('button', { name: '+ Add Education Record' })).click();
    await screen.findByLabelText('Select Family Member');
    fireEvent.change(screen.getByLabelText('Education Stage'), { target: { value: 'University' } });
    screen.getByRole('button', { name: 'Save' }).click();
    await screen.findByText('Sara');

    const afterFirst = await educationRepository.listEducationProfiles();
    expect(afterFirst).toHaveLength(1);
    const firstProfileId = afterFirst[0].id;

    // Attempting to create a SECOND profile for the same member must guide
    // back to the SAME existing profile, never create a duplicate.
    cleanup();
    renderApp('/education');
    (await screen.findByRole('button', { name: '+ Add Education Record' })).click();
    await screen.findByLabelText('Select Family Member');
    fireEvent.change(screen.getByLabelText('Education Stage'), { target: { value: 'Something else' } });
    screen.getByRole('button', { name: 'Save' }).click();
    await screen.findByText('Sara');

    const afterSecond = await educationRepository.listEducationProfiles();
    expect(afterSecond).toHaveLength(1);
    expect(afterSecond[0].id).toBe(firstProfileId);
  });
});

describe('EducationProfilePage: Family identity is read-only', () => {
  it('editing Education-specific fields never shows a Family identity field to edit', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Sara', createdAt: NOW, updatedAt: NOW });
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    renderApp(`/education/${profile.id}`);

    await screen.findByText('Sara');
    screen.getByRole('button', { name: 'Edit' }).click();

    await screen.findByLabelText('Education Stage');
    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Select Family Member')).not.toBeInTheDocument();
  });

  it('the delete confirmation clearly states the deletion is permanent and cannot be undone', async () => {
    await setSetting('locale', 'en');
    await familyRepository.saveFamilyMember({ id: 'fm1', fullName: 'Sara', createdAt: NOW, updatedAt: NOW });
    const profile = await educationService.createEducationProfile('fm1', {
      educationStage: 'University',
      educationStatus: 'currentlyStudying',
    });

    renderApp(`/education/${profile.id}`);

    await screen.findByText('Sara');
    screen.getByRole('button', { name: 'Delete Education Record' }).click();

    expect(await screen.findByText(/permanent/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });
});
