/**
 * useStorageState Hook
 *
 * Domain-Driven Design: Presentation layer hook for state + storage sync
 * Combines React state with automatic storage persistence
 *
 * Theme: {{THEME_NAME}} ({{CATEGORY}} category)
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
 * const [theme, setTheme] = useStorageState(StorageKey.THEME_MODE, 'light');
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
    const loadFromStorage = async () => {
      const result = await storageRepository.getItem(keyString, defaultValue);
      const value = unwrap(result, defaultValue);
      setState(value);
      setIsLoading(false);
    };

    loadFromStorage();
  }, [keyString, defaultValue]);

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
