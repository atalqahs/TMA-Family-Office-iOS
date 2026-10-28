import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CategoryMenu } from '../../src/components/CategoryMenu';
import { CATEGORIES, SECONDARY_NAV_ITEMS } from '../../src/features/categories/categories';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

/**
 * Permanent Phase 11 regression suite -- Part 2.A (Remove Trash UI) and
 * Part 10's TRASH REMOVAL section: no Trash category, nav item, or route
 * anywhere in the app; the lifecycle is ACTIVE <-> ARCHIVED -> PERMANENT
 * DELETE, with no Trash state in between.
 */
describe('Trash is completely removed from the app', () => {
  it('CATEGORIES contains no "trash" entry', () => {
    expect(CATEGORIES.some((category) => category.id === 'trash')).toBe(false);
  });

  it('SECONDARY_NAV_ITEMS (Settings/Trash menu section) contains no "trash" entry -- only Settings remains', () => {
    expect(SECONDARY_NAV_ITEMS.map((item) => item.id)).toEqual(['settings']);
  });

  it('the category menu never renders a "Trash" link (English)', async () => {
    await setSetting('locale', 'en');
    render(
      <LanguageProvider>
        <MemoryRouter>
          <CategoryMenu open onClose={() => {}} />
        </MemoryRouter>
      </LanguageProvider>,
    );

    await screen.findByRole('link', { name: /settings/i });
    expect(screen.queryByText(/trash/i)).not.toBeInTheDocument();
  });

  it('the category menu never renders a "Trash" link (Arabic)', async () => {
    await setSetting('locale', 'ar');
    render(
      <LanguageProvider>
        <MemoryRouter>
          <CategoryMenu open onClose={() => {}} />
        </MemoryRouter>
      </LanguageProvider>,
    );

    await screen.findByRole('link', { name: /الإعدادات/ });
    expect(screen.queryByText(/سلة المحذوفات/)).not.toBeInTheDocument();
  });

  it('no translation key related to Trash exists (trashTitle/trashEmptyMessage removed)', async () => {
    const { translations } = await import('../../src/localization/translations');
    expect(translations.en).not.toHaveProperty('trashTitle');
    expect(translations.en).not.toHaveProperty('trashEmptyMessage');
    expect(translations.ar).not.toHaveProperty('trashTitle');
    expect(translations.ar).not.toHaveProperty('trashEmptyMessage');
  });
});
