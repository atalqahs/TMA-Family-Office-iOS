import { useLanguage } from '../hooks/useLanguage';
import './Header.css';

export function Header() {
  const { t, toggleLocale } = useLanguage();

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__name">{t('appName')}</span>
        <span className="app-header__tagline">{t('appTagline')}</span>
      </div>
      <button
        type="button"
        className="app-header__lang-toggle"
        onClick={toggleLocale}
        aria-label={t('languageSwitchLabel')}
      >
        {t('languageSwitchLabel')}
      </button>
    </header>
  );
}
