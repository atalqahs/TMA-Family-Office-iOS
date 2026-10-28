import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../../src/components/AppShell';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

function renderShell() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<div>Dashboard content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

/**
 * Permanent Phase 11 regression suite -- Part 1 (Global Search removal)
 * and Part 10's GLOBAL SEARCH REMOVAL section: no Search icon/UI anywhere
 * in the global header/shell, while TMA FAMILY OFFICE branding, Menu,
 * Notifications, and Settings all remain exactly as before.
 */
describe('Global Search is completely removed from the app shell', () => {
  it('no button with a search-related accessible name exists anywhere in the header (English)', async () => {
    await setSetting('locale', 'en');
    renderShell();

    await screen.findByText('Dashboard content');
    expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/search will be available/i)).not.toBeInTheDocument();
  });

  it('no button with a search-related accessible name exists anywhere in the header (Arabic)', async () => {
    await setSetting('locale', 'ar');
    renderShell();

    await screen.findByText('Dashboard content');
    expect(screen.queryByRole('button', { name: /بحث/ })).not.toBeInTheDocument();
  });

  it('TMA FAMILY OFFICE branding remains in the header', async () => {
    await setSetting('locale', 'en');
    renderShell();

    await screen.findByText('Dashboard content');
    expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument();
  });

  it('Menu remains reachable from the header', async () => {
    await setSetting('locale', 'en');
    renderShell();

    await screen.findByText('Dashboard content');
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('Notifications remains reachable from the header', async () => {
    await setSetting('locale', 'en');
    renderShell();

    await screen.findByText('Dashboard content');
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('Settings remains reachable from the header', async () => {
    await setSetting('locale', 'en');
    renderShell();

    await screen.findByText('Dashboard content');
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('the header renders exactly three action buttons (Notifications, Settings) plus Menu -- no fourth Search button ever appears', async () => {
    await setSetting('locale', 'en');
    const { container } = renderShell();

    await screen.findByText('Dashboard content');
    const header = container.querySelector('.app-header');
    const buttons = header?.querySelectorAll('button') ?? [];
    // Menu + brand-as-button + Notifications + Settings = 4, never 5 (no Search).
    expect(buttons).toHaveLength(4);
  });
});
