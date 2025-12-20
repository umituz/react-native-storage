/**
 * Store Factory
 * Create Zustand stores with AsyncStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreConfig } from '../types/Store';
import { storageService } from '../../infrastructure/adapters/StorageService';

export function createStore<T extends object>(config: StoreConfig<T>) {
  if (!config.persist) {
    return create<T>(() => config.initialState);
  }

  return create<T>()(
    persist(
      () => config.initialState,
      {
        name: config.name,
        storage: createJSONStorage(() => storageService),
        version: config.version || 1,
        partialize: config.partialize,
        onRehydrateStorage: () => (state) => {
          if (state && config.onRehydrate) {
            config.onRehydrate(state);
          }
        },
        migrate: config.migrate as any,
      }
    )
  );
}
