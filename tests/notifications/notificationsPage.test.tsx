import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotificationCard } from '../../src/features/notifications/components/NotificationCard';
import type { NotificationItem } from '../../src/features/notifications/types';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { LanguageContext } from '../../src/localization/language-context';
import { LOCALE_DIR, translations, type Locale } from '../../src/localization/translations';
import { NotificationsPage } from '../../src/pages/NotificationsPage';
import { setSetting } from '../../src/storage/db';

function renderWithLocale(ui: ReactElement, locale: Locale) {
  const value = {
    locale,
    dir: LOCALE_DIR[locale],
    setLocale: async () => true,
    toggleLocale: () => {},
    localeSaveError: false,
    t: (key: keyof (typeof translations)['ar']) => translations[locale][key],
  };
  return render(<LanguageContext.Provider value={value}>{ui}</LanguageContext.Provider>);
}

function vehicleItem(): NotificationItem {
  return {
    id: 'vehicle:v1:insurance-expired',
    sourceType: 'vehicle',
    sourceId: 'v1',
    kind: 'vehicleInsuranceExpired',
    severity: 'critical',
    titleKey: 'notificationTitleVehicleInsuranceExpired',
    titleParams: { name: 'Land Cruiser' },
    messageKey: 'notificationMsgExpiredOn',
    messageParams: { date: '2026-01-01' },
    route: '/vehicles/v1',
  };
}

describe('NotificationsPage: empty state', () => {
  it('38. shows the exact Arabic empty-state copy when there are no notifications', async () => {
    renderWithLocale(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
      'ar',
    );
    await waitFor(() => expect(screen.getByText('لا توجد تنبيهات حالياً')).toBeInTheDocument());
  });

  it('39. shows the exact English empty-state copy when there are no notifications', async () => {
    renderWithLocale(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
      'en',
    );
    await waitFor(() => expect(screen.getByText('No notifications right now')).toBeInTheDocument());
  });
});

describe('NotificationCard', () => {
  it('40. renders the source/category label', () => {
    renderWithLocale(
      <MemoryRouter>
        <NotificationCard item={vehicleItem()} />
      </MemoryRouter>,
      'en',
    );
    expect(screen.getByText('Vehicles')).toBeInTheDocument();
  });

  it('41. severity is conveyed as visible text, not color alone', () => {
    renderWithLocale(
      <MemoryRouter>
        <NotificationCard item={vehicleItem()} />
      </MemoryRouter>,
      'en',
    );
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('42. tapping a notification navigates to the true source route', async () => {
    renderWithLocale(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<NotificationCard item={vehicleItem()} />} />
          <Route path="/vehicles/:vehicleId" element={<div>Vehicle Profile Page</div>} />
        </Routes>
      </MemoryRouter>,
      'en',
    );
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Vehicle Profile Page')).toBeInTheDocument();
  });

  it('renders the title and message with real entity context, in Arabic', () => {
    renderWithLocale(
      <MemoryRouter>
        <NotificationCard item={vehicleItem()} />
      </MemoryRouter>,
      'ar',
    );
    expect(screen.getByText('تأمين Land Cruiser منتهي')).toBeInTheDocument();
  });
});

describe('RTL/LTR (end-to-end via the real LanguageProvider)', () => {
  it('43. defaults to RTL for the default Arabic locale', async () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </LanguageProvider>,
    );
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
  });

  it('44. switches to LTR when the persisted locale is English', async () => {
    await setSetting('locale', 'en');
    render(
      <LanguageProvider>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </LanguageProvider>,
    );
    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
  });
});
