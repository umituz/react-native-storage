/**
 * useStore Hook
 * Helper for creating stores in components
 */

import { useMemo } from 'react';
import { createStore } from '../../domain/factories/StoreFactory';
import type { StoreConfig } from '../../domain/types/Store';

export function useStore<T extends object>(config: StoreConfig<T>) {
  // Config objesini stabilize et ki sonsuz re-render olmasın
  const stableConfig = useMemo(() => config, [config.name, JSON.stringify(config)]);
  const store = useMemo(() => createStore(stableConfig), [stableConfig]);
  return store;
}
