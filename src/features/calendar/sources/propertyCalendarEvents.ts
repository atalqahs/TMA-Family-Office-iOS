import type { CalendarEvent } from '../types';
import { buildDocumentExpiryEvents } from './documentExpirySource';
import type { Property, PropertyDocument } from '../../properties/types';

/**
 * Properties has no top-level date field of its own (no lease/ownership
 * expiry on the Property record itself) -- its only real, stored dates
 * live on its documents' own `expiryDate` (e.g. a lease or permit
 * document). This is the entirety of this module's honest contribution;
 * inventing a Property-level date field would be fabricating data that
 * doesn't exist.
 */
export function buildPropertyCalendarEvents(
  properties: Property[],
  documents: PropertyDocument[],
  rangeStart: string,
  rangeEnd: string,
): CalendarEvent[] {
  const nameById = new Map(properties.map((property) => [property.id, property.name]));
  return buildDocumentExpiryEvents(
    documents,
    'properties',
    rangeStart,
    rangeEnd,
    (document) => nameById.get(document.propertyId) ?? '',
    (document) => `/properties/${document.propertyId}`,
  );
}
