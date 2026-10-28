import type { Locale, TranslationKey } from '../../localization/translations';
import { renderTemplateText } from '../../utils/templateText';
import type { CalendarEvent } from './types';

/**
 * An event's displayed title: either a raw, already-real string taken
 * directly from the source record (a Task's own `title`, a document's
 * own `title`) -- never routed through a TranslationKey, since it is user
 * data, not app copy -- or a translated template (`titleKey`+
 * `titleParams`), rendered via the same shared substitution rules
 * Notifications uses (`renderTemplateText`).
 */
export function renderCalendarEventTitle(event: CalendarEvent, t: (key: TranslationKey) => string, locale: Locale): string {
  if (event.rawTitle !== undefined) return event.rawTitle;
  if (event.titleKey) return renderTemplateText(event.titleKey, event.titleParams, t, locale);
  return '';
}
