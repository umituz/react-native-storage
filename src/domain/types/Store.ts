/**
 * Store Types
 */

export interface StoreConfig<T> {
  name: string;
  initialState: T;
  persist?: boolean;
  version?: number;
  partialize?: (state: T) => Partial<T>;
  onRehydrate?: (state: T) => void;
  migrate?: (persistedState: unknown, version: number) => T;
}

export interface PersistedState<T> {
  state: T;
  version: number;
}
