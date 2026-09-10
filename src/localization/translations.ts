export type Locale = 'ar' | 'en';

/** A piece of category/domain text pre-translated for both locales. */
export interface LocalizedText {
  ar: string;
  en: string;
}

export type TranslationKey =
  | 'appName'
  | 'appTagline'
  | 'dashboardTitle'
  | 'dashboardSubtitle'
  | 'menuTitle'
  | 'menuOpenLabel'
  | 'menuCloseLabel'
  | 'menuMoreSection'
  | 'homeLabel'
  | 'searchLabel'
  | 'searchPlaceholderMessage'
  | 'notificationsLabel'
  | 'settingsLabel'
  | 'comingSoonNotice'
  | 'settingsTitle'
  | 'settingsLanguageSectionTitle'
  | 'settingsLanguageSectionHint'
  | 'languageNameArabic'
  | 'languageNameEnglish'
  | 'settingsAboutSectionTitle'
  | 'settingsVersionValue'
  | 'settingsDisclaimer'
  | 'trashTitle'
  | 'trashEmptyMessage';

type Dictionary = Record<TranslationKey, string>;

export const translations: Record<Locale, Dictionary> = {
  ar: {
    appName: 'TMA FAMILY OFFICE',
    appTagline: 'المكتب العائلي',
    dashboardTitle: 'لوحة التحكم',
    dashboardSubtitle: 'نظرة عامة على فئات مكتب العائلة.',
    menuTitle: 'الفئات',
    menuOpenLabel: 'فتح القائمة',
    menuCloseLabel: 'إغلاق',
    menuMoreSection: 'المزيد',
    homeLabel: 'الانتقال إلى الصفحة الرئيسية',
    searchLabel: 'بحث',
    searchPlaceholderMessage: 'سيتم تفعيل البحث في مرحلة لاحقة.',
    notificationsLabel: 'الإشعارات',
    settingsLabel: 'الإعدادات',
    comingSoonNotice: 'ستتوفر هذه الميزة في مرحلة لاحقة.',
    settingsTitle: 'الإعدادات',
    settingsLanguageSectionTitle: 'اللغة',
    settingsLanguageSectionHint: 'اختر لغة عرض التطبيق.',
    languageNameArabic: 'العربية',
    languageNameEnglish: 'English',
    settingsAboutSectionTitle: 'معلومات التطبيق',
    settingsVersionValue: 'نسخة تجريبية — المرحلة 2',
    settingsDisclaimer:
      'هذه نسخة تجريبية لتجربة الفكرة والتصميم على آيفون. النسخة النهائية ستكون تطبيق ويندوز مستقل.',
    trashTitle: 'سلة المحذوفات',
    trashEmptyMessage: 'لا توجد عناصر محذوفة.',
  },
  en: {
    appName: 'TMA FAMILY OFFICE',
    appTagline: 'Family Office',
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'An overview of your family office categories.',
    menuTitle: 'Categories',
    menuOpenLabel: 'Open menu',
    menuCloseLabel: 'Close',
    menuMoreSection: 'More',
    homeLabel: 'Go to Home',
    searchLabel: 'Search',
    searchPlaceholderMessage: 'Search will be available in a later phase.',
    notificationsLabel: 'Notifications',
    settingsLabel: 'Settings',
    comingSoonNotice: 'This feature will be available in a later phase.',
    settingsTitle: 'Settings',
    settingsLanguageSectionTitle: 'Language',
    settingsLanguageSectionHint: 'Choose the app display language.',
    languageNameArabic: 'العربية',
    languageNameEnglish: 'English',
    settingsAboutSectionTitle: 'App Information',
    settingsVersionValue: 'Prototype — Phase 2',
    settingsDisclaimer:
      'This is an experimental prototype for testing the idea and design on iPhone. The final version will be a standalone Windows application.',
    trashTitle: 'Trash',
    trashEmptyMessage: 'No deleted items.',
  },
};

export const LOCALE_DIR: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

export const DEFAULT_LOCALE: Locale = 'ar';
