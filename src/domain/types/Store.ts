/**
 * Store Types
 * Zustand store configuration with actions support
 */

import type { StoreApi } from 'zustand';

/** Set function type for Zustand */
export type SetState<T> = StoreApi<T>['setState'];

/** Get function type for Zustand */
export type GetState<T> = StoreApi<T>['getState'];

/** Actions creator function */
export type ActionsCreator<TState, TActions> = (
  set: SetState<TState & TActions>,
  get: GetState<TState & TActions>
) => TActions;

/** Store configuration */
export interface StoreConfig<TState extends object, TActions extends object = object> {
  /** Unique store name (used as storage key) */
  name: string;
  /** Initial state */
  initialState: TState;
  /** Actions creator function */
  actions?: ActionsCreator<TState, TActions>;
  /** Enable AsyncStorage persistence */
  persist?: boolean;
  /** State version for migrations */
  version?: number;
  /** Select which state to persist */
  partialize?: (state: TState & TActions) => Partial<TState>;
  /** Callback after rehydration */
  onRehydrate?: (state: TState & TActions) => void;
  /** Migration function for version changes */
  migrate?: (persistedState: unknown, version: number) => TState;
}

/** Persisted state wrapper */
export interface PersistedState<T> {
  state: T;
  version: number;
}
