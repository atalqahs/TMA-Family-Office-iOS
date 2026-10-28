import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { VehicleProfilePage } from '../../src/pages/VehicleProfilePage';
import { setSetting } from '../../src/storage/db';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';

const NOW = '2026-01-01T00:00:00.000Z';

/**
 * Permanent Phase 10 regression suite -- the hard UX rule (Section O):
 * an archived card is NEVER opened directly for viewing/editing. Verified
 * end to end (real LanguageProvider + real IndexedDB) on VehicleProfilePage
 * as a representative example -- the exact same `ArchivedNotice` guard is
 * wired identically into all six profile/detail pages (see each page's own
 * `if (entity.archivedAt)` branch), so this one page proves the shared
 * component's contract for all of them.
 */
describe('ArchivedNotice hard UX rule (VehicleProfilePage, representative example)', () => {
  it('an archived vehicle renders the ArchivedNotice guard, NOT the normal editable profile', async () => {
    await setSetting('locale', 'en');
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW, archivedAt: NOW });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/vehicles/v1']}>
          <Routes>
            <Route path="/vehicles/:vehicleId" element={<VehicleProfilePage />} />
            <Route path="/vehicles" element={<div>Vehicles List Page</div>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    await waitFor(() => expect(screen.getByText('This card is archived')).toBeInTheDocument());
    expect(screen.getByText('Unarchive to view and edit the full content.')).toBeInTheDocument();

    // The normal profile's own content/actions must NOT be rendered.
    expect(screen.queryByText('Family SUV')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('tapping Unarchive clears archivedAt and reveals the normal profile in its place -- never a copy, never a silent failure', async () => {
    await setSetting('locale', 'en');
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW, archivedAt: NOW });

    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/vehicles/v1']}>
          <Routes>
            <Route path="/vehicles/:vehicleId" element={<VehicleProfilePage />} />
            <Route path="/vehicles" element={<div>Vehicles List Page</div>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    const unarchiveButton = await screen.findByRole('button', { name: 'Unarchive' });
    unarchiveButton.click();

    await waitFor(() => expect(screen.getByText('Family SUV')).toBeInTheDocument());
    expect(screen.queryByText('This card is archived')).not.toBeInTheDocument();

    const stored = await vehicleRepository.getVehicle('v1');
    expect(stored).not.toHaveProperty('archivedAt');
  });
});
