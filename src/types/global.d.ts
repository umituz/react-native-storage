/// <reference types="jest" />
/// <reference types="node" />

declare module '@react-native-async-storage/async-storage' {
  export interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<readonly string[]>;
    multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  }

  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export function useRef<T>(initialValue?: T): { current: T | undefined };
  export function useRef<T>(initialValue: T): { current: T };
}

declare module 'react-native' {
  // Add React Native specific types if needed
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidStorageKey(): R;
      toBeExpired(): R;
      toHaveValidCache(): R;
    }
  }

  var __DEV__: boolean | undefined;
  var global: any;
}