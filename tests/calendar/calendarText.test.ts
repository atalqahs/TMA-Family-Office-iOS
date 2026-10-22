import { describe, expect, it } from 'vitest';
import { renderCalendarEventTitle } from '../../src/features/calendar/calendarText';
import { translations, type Locale, type TranslationKey } from '../../src/localization/translations';
import type { CalendarEvent } from '../../src/features/calendar/types';

function t(locale: Locale) {
  return (key: TranslationKey) => translations[locale][key];
}

const BASE: CalendarEvent = {
  id: 'e1',
  category: 'family',
  sourceId: 'f1',
  date: '2026-06-15',
  color: 'gray',
  route: '/family/f1',
};

describe('renderCalendarEventTitle', () => {
  it('a rawTitle (free-text user data) is returned verbatim, never routed through translations', () => {
    const event: CalendarEvent = { ...BASE, rawTitle: 'Pay school fees' };
    expect(renderCalendarEventTitle(event, t('en'), 'en')).toBe('Pay school fees');
    expect(renderCalendarEventTitle(event, t('ar'), 'ar')).toBe('Pay school fees');
  });

  it('a titleKey + titleParams renders the translated template with substitutions, in English', () => {
    const event: CalendarEvent = { ...BASE, titleKey: 'calendarEventCivilIdTitle', titleParams: { name: 'Sara' } };
    expect(renderCalendarEventTitle(event, t('en'), 'en')).toBe("Sara's Civil ID");
  });

  it('a titleKey + titleParams renders the translated template with substitutions, in Arabic', () => {
    const event: CalendarEvent = { ...BASE, titleKey: 'calendarEventCivilIdTitle', titleParams: { name: 'سارة' } };
    expect(renderCalendarEventTitle(event, t('ar'), 'ar')).toBe('البطاقة المدنية لـ سارة');
  });

  it('a document-expiry template substitutes both {title} and {name}', () => {
    const event: CalendarEvent = {
      ...BASE,
      titleKey: 'calendarEventDocumentExpiryTitle',
      titleParams: { title: 'Lease Agreement', name: 'Chalet' },
    };
    expect(renderCalendarEventTitle(event, t('en'), 'en')).toBe('Lease Agreement — Chalet');
  });

  it('neither rawTitle nor titleKey set renders an empty string rather than throwing', () => {
    expect(renderCalendarEventTitle(BASE, t('en'), 'en')).toBe('');
  });
});
