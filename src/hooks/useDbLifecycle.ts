import { useEffect, useState } from 'react';
import { getDbLifecycleState, subscribeDbLifecycle, type DbLifecycleState } from '../storage/db';

export function useDbLifecycle(): DbLifecycleState {
  const [state, setState] = useState<DbLifecycleState>(getDbLifecycleState);
  useEffect(() => subscribeDbLifecycle(setState), []);
  return state;
}
