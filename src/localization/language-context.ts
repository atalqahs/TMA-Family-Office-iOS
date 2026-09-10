import { createContext } from 'react';
import type { Locale, TranslationKey } from './translations';

export interface LanguageContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (locale: Locale) => Promise<boolean>;
  toggleLocale: () => void;
  /** True when the most recent language switch failed to persist. */
  localeSaveError: boolean;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
