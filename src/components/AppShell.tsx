import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDisclosure } from '../hooks/useDisclosure';
import { AppHeader } from './AppHeader';
import { CategoryMenu } from './CategoryMenu';
import './AppShell.css';

export function AppShell() {
  const location = useLocation();
  const menu = useDisclosure();

  useEffect(() => {
    menu.close();
    // Only the route should trigger this — menu identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <AppHeader onMenuClick={menu.open} />

      <main className="app-shell__content">
        <Outlet />
      </main>

      <CategoryMenu open={menu.isOpen} onClose={menu.close} />
    </div>
  );
}
