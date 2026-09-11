import { listProperties } from '../../properties/propertyRepository';
import type { ArchivedCardItem } from '../types';

/** Reuses `listProperties` (non-deleted, archived included) -- never re-queries IndexedDB itself. */
export async function loadArchivedProperties(): Promise<ArchivedCardItem[]> {
  const all = await listProperties();
  return all
    .filter((property) => property.archivedAt !== undefined)
    .map((property) => ({
      id: property.id,
      sourceType: 'properties' as const,
      title: property.name,
      archivedAt: property.archivedAt as string,
      route: `/properties/${property.id}`,
    }));
}
