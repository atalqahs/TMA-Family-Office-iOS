import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { listActiveProperties } from '../propertyRepository';
import type { Property } from '../types';

export function useProperties() {
  const fetcher = useCallback(() => listActiveProperties(), []);
  const { data: properties, loading, error, refresh } = useAsyncResource<Property[]>(fetcher, []);
  return { properties, loading, error, refresh };
}
