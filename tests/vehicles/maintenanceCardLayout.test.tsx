import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MaintenanceSection } from '../../src/features/vehicles/components/MaintenanceSection';
import type { VehicleMaintenanceRecord } from '../../src/features/vehicles/types';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

const NOW = '2026-01-01T00:00:00.000Z';

function maintenanceRecord(overrides: Partial<VehicleMaintenanceRecord> = {}): VehicleMaintenanceRecord {
  return {
    id: 'm1',
    vehicleId: 'v1',
    type: 'oilChange',
    title: 'Oil & Filter',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/**
 * Regression coverage for the maintenance-record card redesign: the old
 * layout put a header line, every service/next-service detail, notes,
 * and the status badge all into one dense text block next to a tall
 * vertical stack of 3 action buttons squeezing it. The new layout splits
 * these into a header row, a service-details block, a labeled
 * next-service block, and a dedicated full-width actions area below the
 * content (Complete Service on its own row, Edit/Delete sharing a second
 * row) -- never beside it.
 */
describe('MaintenanceSection: redesigned card hierarchy', () => {
  beforeEach(async () => {
    await setSetting('locale', 'en');
  });

  it('separates the card into header / service-details / next-service / actions regions', async () => {
    const record = maintenanceRecord({
      serviceDate: '2026-01-01',
      mileageAtService: 100_000,
      serviceIntervalKm: 5_000,
    });
    const { container } = render(
      <LanguageProvider>
        <MaintenanceSection
          records={[record]}
          currentMileage={110_000}
          onAdd={() => {}}
          onEdit={() => {}}
          onComplete={() => {}}
          onRefresh={() => {}}
        />
      </LanguageProvider>,
    );

    await waitFor(() => expect(container.querySelector('.maintenance-row__header')).not.toBeNull());
    expect(container.querySelector('.maintenance-row__details')).not.toBeNull();
    expect(container.querySelector('.maintenance-row__details--next')).not.toBeNull();
    expect(container.querySelector('.maintenance-row__actions')).not.toBeNull();

    // The header holds the title, type, and status badge together.
    const header = container.querySelector('.maintenance-row__header');
    expect(header?.textContent).toContain('Oil & Filter');

    // The emphasized remaining/overdue figure is its own element, not
    // buried inside a plain meta line.
    expect(container.querySelector('.maintenance-row__remaining')).not.toBeNull();
  });

  it('puts Complete Service on its own full-width row, with Edit/Delete sharing a second row -- never a 3-button vertical stack beside the text', async () => {
    const record = maintenanceRecord();
    const { container } = render(
      <LanguageProvider>
        <MaintenanceSection
          records={[record]}
          currentMileage={undefined}
          onAdd={() => {}}
          onEdit={() => {}}
          onComplete={() => {}}
          onRefresh={() => {}}
        />
      </LanguageProvider>,
    );

    const completeButton = await screen.findByRole('button', { name: 'Service Completed' });
    const actions = container.querySelector('.maintenance-row__actions');
    expect(actions).not.toBeNull();
    const secondary = container.querySelector('.maintenance-row__actions-secondary');
    expect(secondary).not.toBeNull();

    // Complete Service is a direct child of the actions area, outside the
    // secondary row (its own full-width row); Edit/Delete are inside the
    // secondary row.
    expect(secondary?.contains(completeButton)).toBe(false);
    expect(actions?.contains(completeButton)).toBe(true);

    const editButton = screen.getByRole('button', { name: 'Edit' });
    const deleteButton = screen.getByRole('button', { name: 'Remove' });
    expect(secondary?.contains(editButton)).toBe(true);
    expect(secondary?.contains(deleteButton)).toBe(true);
  });

  it('shows the status badge in the header, not detached into the dense text block', async () => {
    const record = maintenanceRecord({ mileageAtService: 100_000, serviceIntervalKm: 1_000 });
    render(
      <LanguageProvider>
        <MaintenanceSection
          records={[record]}
          currentMileage={110_000}
          onAdd={() => {}}
          onEdit={() => {}}
          onComplete={() => {}}
          onRefresh={() => {}}
        />
      </LanguageProvider>,
    );
    await screen.findByText('Oil & Filter');
    const header = document.querySelector('.maintenance-row__header');
    expect(header?.querySelector('.status-badge')).not.toBeNull();
  });
});
