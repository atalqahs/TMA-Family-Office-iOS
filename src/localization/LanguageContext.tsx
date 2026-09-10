import { useEffect, useMemo, type ReactNode } from 'react';
import { usePersistentSetting } from '../hooks/usePersistentSetting';
import { LanguageContext, type LanguageContextValue } from './language-context';
import { DEFAULT_LOCALE, LOCALE_DIR, translations, type Locale, type TranslationKey } from './translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { value: locale, setValue: setLocale } = usePersistentSetting<Locale>(
    'locale',
    DEFAULT_LOCALE,
  );

  const dir = LOCALE_DIR[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      toggleLocale: () => setLocale(locale === 'ar' ? 'en' : 'ar'),
      t: (key: TranslationKey) => translations[locale][key],
    }),
    [locale, dir, setLocale],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}
