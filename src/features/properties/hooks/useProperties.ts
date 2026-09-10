import { useCallback, useEffect, useState } from 'react';
import { listProperties } from '../propertyRepository';
import type { Property } from '../types';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await listProperties();
      setProperties(result);
    } catch (err) {
      console.error('Failed to load properties', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { properties, loading, error, refresh };
}
