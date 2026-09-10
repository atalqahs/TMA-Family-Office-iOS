export type Locale = 'ar' | 'en';

export type TranslationKey =
  | 'appName'
  | 'appTagline'
  | 'dashboardTitle'
  | 'dashboardEmptyTitle'
  | 'dashboardEmptyHint'
  | 'languageSwitchLabel';

type Dictionary = Record<TranslationKey, string>;

export const translations: Record<Locale, Dictionary> = {
  ar: {
    appName: 'TMA FAMILY OFFICE',
    appTagline: 'المكتب العائلي',
    dashboardTitle: 'لوحة التحكم',
    dashboardEmptyTitle: 'لا توجد بيانات بعد',
    dashboardEmptyHint: 'ستظهر بيانات العائلة والأصول هنا لاحقاً.',
    languageSwitchLabel: 'English',
  },
  en: {
    appName: 'TMA FAMILY OFFICE',
    appTagline: 'Family Office',
    dashboardTitle: 'Dashboard',
    dashboardEmptyTitle: 'No data yet',
    dashboardEmptyHint: 'Family and asset data will appear here later.',
    languageSwitchLabel: 'العربية',
  },
};

export const LOCALE_DIR: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

export const DEFAULT_LOCALE: Locale = 'ar';
