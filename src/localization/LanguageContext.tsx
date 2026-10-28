import { useEffect, useMemo, type ReactNode } from 'react';
import { usePersistentSetting } from '../hooks/usePersistentSetting';
import { LanguageContext, type LanguageContextValue } from './language-context';
import { DEFAULT_LOCALE, LOCALE_DIR, translations, type Locale, type TranslationKey } from './translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const {
    value: locale,
    setValue: setLocale,
    ready,
    saveError: localeSaveError,
  } = usePersistentSetting<Locale>('locale', DEFAULT_LOCALE);

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
      toggleLocale: () => void setLocale(locale === 'ar' ? 'en' : 'ar'),
      localeSaveError,
      t: (key: TranslationKey) => translations[locale][key],
    }),
    [locale, dir, setLocale, localeSaveError],
  );

  // Wait for the persisted locale to load from IndexedDB before mounting
  // children, so a saved English preference can't flash as Arabic (the
  // default) first. `index.html` already renders lang="ar" dir="rtl" as a
  // static default, so this brief gap stays a plain dark screen, not a
  // wrong-direction flash of content.
  if (!ready) {
    return null;
  }

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}
