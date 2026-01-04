/**
 * Store Factory
 * Create Zustand stores with AsyncStorage persistence and actions
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { StoreConfig } from '../types/Store';
import { storageService } from '../../infrastructure/adapters/StorageService';

/**
 * Create a Zustand store with optional persistence and actions
 */
export function createStore<
  TState extends object,
  TActions extends object = object
>(config: StoreConfig<TState, TActions>) {
  type Store = TState & TActions;
  type SetState = StoreApi<Store>['setState'];
  type GetState = StoreApi<Store>['getState'];

  const stateCreator = (set: SetState, get: GetState): Store => {
    const state = config.initialState as TState;
    const actions = config.actions
      ? config.actions(set, get)
      : ({} as TActions);
    return { ...state, ...actions } as Store;
  };

  if (!config.persist) {
    return create<Store>(stateCreator);
  }

  return create<Store>()(
    persist(stateCreator, {
      name: config.name,
      storage: createJSONStorage(() => storageService),
      version: config.version || 1,
      partialize: config.partialize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (state: Store) => config.partialize!(state as any) as any
        : (state: Store) => {
            const persisted: Record<string, unknown> = {};
            for (const key of Object.keys(state)) {
              if (typeof state[key as keyof Store] !== 'function') {
                persisted[key] = state[key as keyof Store];
              }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return persisted as any;
          },
      onRehydrateStorage: () => (state: Store | undefined) => {
        if (state && config.onRehydrate) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config.onRehydrate(state as any);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: config.migrate as any,
    }) as any
  );
}
