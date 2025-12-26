/**
 * Store Factory
 * Create Zustand stores with AsyncStorage persistence and actions
 *
 * @example
 * ```typescript
 * const useCounterStore = createStore({
 *   name: 'counter',
 *   initialState: { count: 0 },
 *   actions: (set, get) => ({
 *     increment: () => set({ count: get().count + 1 }),
 *     reset: () => set({ count: 0 }),
 *   }),
 *   persist: true,
 * });
 * ```
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

  const stateCreator = (
    set: (partial: Partial<Store>) => void,
    get: () => Store
  ): Store => {
    const state = config.initialState as Store;
    const actions = config.actions ? config.actions(set as any, get as any) : ({} as TActions);
    return { ...state, ...actions };
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
        ? (state) => config.partialize!(state) as Store
        : (state) => {
            // By default, exclude functions (actions) from persistence
            const persisted: Record<string, unknown> = {};
            for (const key of Object.keys(state)) {
              if (typeof state[key as keyof Store] !== 'function') {
                persisted[key] = state[key as keyof Store];
              }
            }
            return persisted as Store;
          },
      onRehydrateStorage: () => (state) => {
        if (state && config.onRehydrate) {
          config.onRehydrate(state);
        }
      },
      migrate: config.migrate as any,
    })
  );
}
