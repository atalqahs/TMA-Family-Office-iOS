import { useCallback, useEffect, useRef, useState } from 'react';
import { getProperty, listDocumentsForProperty } from '../propertyRepository';
import type { Property, PropertyDocument } from '../types';

/**
 * `property` is `undefined` while loading, `null` if not found (or deleted).
 *
 * `propertyId` can change (navigating from one property's profile straight
 * to another's) while a fetch for the previous id is still in flight.
 * `requestIdRef` tags each fetch and discards any result that isn't the
 * most recently started one, so a slow stale request can never overwrite
 * a newer one's data (same guard as useFamilyMember).
 */
export function useProperty(propertyId: string | undefined) {
  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!propertyId) {
      if (requestId === requestIdRef.current) setProperty(null);
      return;
    }
    try {
      const [foundProperty, docs] = await Promise.all([
        getProperty(propertyId),
        listDocumentsForProperty(propertyId),
      ]);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setProperty(foundProperty ?? null);
      setDocuments(docs);
      setError(false);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load property', err);
      setError(true);
      setProperty(null);
    }
  }, [propertyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { property, documents, loading: property === undefined, error, refresh };
}
