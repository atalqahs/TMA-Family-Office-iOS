import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { AppHeader } from './AppHeader';
import { CategoryMenu } from './CategoryMenu';
import { Sheet } from './Sheet';
import './AppShell.css';

export function AppShell() {
  const { t } = useLanguage();
  const location = useLocation();
  const menu = useDisclosure();
  const search = useDisclosure();

  useEffect(() => {
    menu.close();
    search.close();
    // Only the route should trigger this — menu/search identities are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <AppHeader onMenuClick={menu.open} onSearchClick={search.open} />

      <main className="app-shell__content">
        <Outlet />
      </main>

      <CategoryMenu open={menu.isOpen} onClose={menu.close} />

      <Sheet open={search.isOpen} onClose={search.close} title={t('searchLabel')} closeLabel={t('menuCloseLabel')}>
        <p className="app-shell__search-placeholder">{t('searchPlaceholderMessage')}</p>
      </Sheet>
    </div>
  );
}
