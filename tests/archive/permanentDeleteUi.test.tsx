import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ArchiveCategoryPage } from '../../src/pages/ArchiveCategoryPage';
import * as taskRepository from '../../src/features/tasks/taskRepository';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

const NOW = '2026-01-01T00:00:00.000Z';

function renderCategory(categoryId: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[`/archive/${categoryId}`]}>
        <Routes>
          <Route path="/archive/:categoryId" element={<ArchiveCategoryPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

/**
 * Permanent Phase 11 UI regression suite -- Part 2.C/E (Archive delete is
 * now REAL permanent deletion) and Part 10's TRASH REMOVAL section.
 */
describe('Archive delete is real permanent deletion (Phase 11: no Trash intermediate state)', () => {
  it('the delete confirmation on an archived card clearly states the deletion is permanent and cannot be undone', async () => {
    await setSetting('locale', 'en');
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');

    renderCategory('vehicles');

    (await screen.findByRole('button', { name: 'Delete Card' })).click();

    expect(await screen.findByText(/permanent/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('confirming delete on an archived vehicle really removes it -- it no longer exists anywhere, not even in Archive', async () => {
    await setSetting('locale', 'en');
    await vehicleRepository.saveVehicle({ id: 'v1', name: 'Family SUV', createdAt: NOW, updatedAt: NOW });
    await vehicleRepository.archiveVehicle('v1');

    renderCategory('vehicles');

    (await screen.findByRole('button', { name: 'Delete Card' })).click();
    (await screen.findByRole('button', { name: 'Delete Card' })).click();

    await screen.findByText(/no archived cards/i);
    expect(await vehicleRepository.getVehicle('v1')).toBeUndefined();
  });

  it('attempting to permanently delete a non-empty TaskGroup from Archive surfaces the specific "group not empty" message rather than crashing', async () => {
    await setSetting('locale', 'en');
    await taskRepository.saveTaskGroup({ id: 'g1', name: 'Vehicle Reminders', createdAt: NOW, updatedAt: NOW });
    await taskRepository.saveTaskWithGroupGuard({
      id: 't1',
      groupId: 'g1',
      title: 'Renew registration',
      priority: 'normal',
      recurrenceUnit: 'none',
      dueDate: '2026-06-01',
      createdAt: NOW,
      updatedAt: NOW,
    });
    await taskRepository.archiveTaskGroup('g1');

    renderCategory('tasks');

    (await screen.findByRole('button', { name: 'Delete Card' })).click();
    (await screen.findByRole('button', { name: 'Delete Card' })).click();

    expect(await screen.findByText('Cannot delete a non-empty group. Move or delete its tasks first.')).toBeInTheDocument();
    // The group is still there -- never destructively removed alongside its Tasks.
    expect(await taskRepository.getTaskGroup('g1')).toBeDefined();
  });
});
