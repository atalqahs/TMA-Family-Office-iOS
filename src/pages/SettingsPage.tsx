import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { useLanguage } from '../hooks/useLanguage';
import type { Locale } from '../localization/translations';
import './SettingsPage.css';

const LOCALE_OPTIONS: Locale[] = ['ar', 'en'];

export function SettingsPage() {
  const { t, locale, setLocale, localeSaveError } = useLanguage();

  return (
    <div className="settings-page">
      <PageHeader title={t('settingsTitle')} />

      <SectionCard title={t('settingsLanguageSectionTitle')} hint={t('settingsLanguageSectionHint')}>
        <div className="settings-page__language-options">
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={
                'settings-page__language-option' +
                (locale === option ? ' settings-page__language-option--active' : '')
              }
              onClick={() => void setLocale(option)}
              aria-pressed={locale === option}
            >
              {t(option === 'ar' ? 'languageNameArabic' : 'languageNameEnglish')}
            </button>
          ))}
        </div>
        {localeSaveError && <p className="settings-page__language-error">{t('formSaveError')}</p>}
      </SectionCard>

      <SectionCard title={t('settingsAboutSectionTitle')}>
        <p className="settings-page__about-line">{t('appName')}</p>
        <p className="settings-page__about-line settings-page__about-line--muted">{t('appTagline')}</p>
        <p className="settings-page__about-line settings-page__about-line--muted">{t('settingsVersionValue')}</p>
        <p className="settings-page__disclaimer">{t('settingsDisclaimer')}</p>
      </SectionCard>
    </div>
  );
}
