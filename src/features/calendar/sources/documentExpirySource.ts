import { NON_TASK_EVENT_COLOR } from '../colors';
import type { CalendarCategoryId, CalendarEvent } from '../types';

interface ExpiringDocumentLike {
  id: string;
  title: string;
  expiryDate?: string;
}

/**
 * Shared by every module whose documents may carry their own independent
 * `expiryDate` (Family/Property/Staff/Vehicle -- Contract/Health/
 * Education documents have no such field, so they never call this).
 * These are additional, independent data points from that module's own
 * top-level expiry fields (e.g. a Family Member's own `civilIdExpiryDate`
 * vs. a scanned Civil ID *document*'s own, separately-set `expiryDate`) --
 * both are real, so both are sourced.
 *
 * `rangeStart`/`rangeEnd` bound the result to the displayed month, same
 * as every other source.
 */
export function buildDocumentExpiryEvents<T extends ExpiringDocumentLike>(
  documents: T[],
  category: CalendarCategoryId,
  rangeStart: string,
  rangeEnd: string,
  ownerNameFor: (document: T) => string,
  routeFor: (document: T) => string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const document of documents) {
    const date = document.expiryDate;
    if (!date || date < rangeStart || date > rangeEnd) continue;
    events.push({
      id: `${category}:document:${document.id}`,
      category,
      sourceId: document.id,
      date,
      color: NON_TASK_EVENT_COLOR,
      route: routeFor(document),
      titleKey: 'calendarEventDocumentExpiryTitle',
      titleParams: { title: document.title, name: ownerNameFor(document) },
    });
  }
  return events;
}
