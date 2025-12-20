/**
 * useStorageState Hook
 *
 * Domain-Driven Design: Presentation layer hook for state + storage sync
 * Combines React state with automatic storage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { storageRepository } from '../../infrastructure/repositories/AsyncStorageRepository';
import { unwrap } from '../../domain/entities/StorageResult';
import type { StorageKey } from '../../domain/value-objects/StorageKey';

/**
 * Storage State Hook
 * Syncs React state with AsyncStorage automatically
 *
 * @example
 * ```typescript
 * const [settings, setSettings] = useStorageState('user_settings', { theme: 'light' });
 * // State is automatically persisted to storage
 * ```
 */
export const useStorageState = <T>(
  key: string | StorageKey,
  defaultValue: T
): [T, (value: T) => Promise<void>, boolean] => {
  const keyString = typeof key === 'string' ? key : String(key);
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial value from storage
  useEffect(() => {
    let isMounted = true;
    
    const loadFromStorage = async () => {
      try {
        const result = await storageRepository.getItem(keyString, defaultValue);
        const value = unwrap(result, defaultValue);
        
        // Memory leak önlemek için component mount kontrolü
        if (isMounted) {
          setState(value);
          setIsLoading(false);
        }
      } catch {
        // Hata durumunda bile cleanup yap
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFromStorage();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [keyString]); // defaultValue'ı dependency array'den çıkar

  // Update state and persist to storage
  const updateState = useCallback(
    async (value: T) => {
      setState(value);
      await storageRepository.setItem(keyString, value);
    },
    [keyString]
  );

  return [state, updateState, isLoading];
};
