import { Bell, Menu, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCategoryCount } from '../hooks/useCategoryCount';
import { useLanguage } from '../hooks/useLanguage';
import { IconButton } from './IconButton';
import './AppHeader.css';

interface AppHeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function AppHeader({ onMenuClick, onSearchClick }: AppHeaderProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const notificationsCount = useCategoryCount('notifications');

  return (
    <header className="app-header">
      <IconButton icon={<Menu size={22} strokeWidth={1.75} />} label={t('menuOpenLabel')} onClick={onMenuClick} />

      <button type="button" className="app-header__brand" onClick={() => navigate('/')} aria-label={t('homeLabel')}>
        {t('appName')}
      </button>

      <div className="app-header__actions">
        <IconButton
          icon={<Search size={20} strokeWidth={1.75} />}
          label={t('searchLabel')}
          onClick={onSearchClick}
        />
        <IconButton
          icon={<Bell size={20} strokeWidth={1.75} />}
          label={t('notificationsLabel')}
          badge={notificationsCount > 0 ? notificationsCount : undefined}
          onClick={() => navigate('/notifications')}
        />
        <IconButton
          icon={<Settings size={20} strokeWidth={1.75} />}
          label={t('settingsLabel')}
          onClick={() => navigate('/settings')}
        />
      </div>
    </header>
  );
}
