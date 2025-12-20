/**
 * useStorage Hook
 *
 * Domain-Driven Design: Presentation layer hook for storage operations
 * Provides clean API for components to interact with storage domain
 */

import { useCallback, useMemo } from 'react';
import { storageRepository } from '../../infrastructure/repositories/AsyncStorageRepository';
import type { StorageResult } from '../../domain/entities/StorageResult';
import { unwrap } from '../../domain/entities/StorageResult';
import type { StorageKey } from '../../domain/value-objects/StorageKey';

/**
 * Storage Hook
 * Provides type-safe storage operations
 */
export const useStorage = () => {
  /**
   * Get item from storage
   */
  const getItem = useCallback(async <T>(key: string | StorageKey, defaultValue: T): Promise<T> => {
    const keyString = typeof key === 'string' ? key : String(key);
    const result = await storageRepository.getItem(keyString, defaultValue);
    return unwrap(result, defaultValue);
  }, []);

  /**
   * Set item in storage
   */
  const setItem = useCallback(async <T>(key: string | StorageKey, value: T): Promise<boolean> => {
    const keyString = typeof key === 'string' ? key : String(key);
    const result = await storageRepository.setItem(keyString, value);
    return result.success;
  }, []);

  /**
   * Get string from storage
   */
  const getString = useCallback(async (key: string | StorageKey, defaultValue: string): Promise<string> => {
    const keyString = typeof key === 'string' ? key : String(key);
    const result = await storageRepository.getString(keyString, defaultValue);
    return unwrap(result, defaultValue);
  }, []);

  /**
   * Set string in storage
   */
  const setString = useCallback(async (key: string | StorageKey, value: string): Promise<boolean> => {
    const keyString = typeof key === 'string' ? key : String(key);
    const result = await storageRepository.setString(keyString, value);
    return result.success;
  }, []);

  /**
   * Remove item from storage
   */
  const removeItem = useCallback(async (key: string | StorageKey): Promise<boolean> => {
    const keyString = typeof key === 'string' ? key : String(key);
    const result = await storageRepository.removeItem(keyString);
    return result.success;
  }, []);

  /**
   * Check if item exists
   */
  const hasItem = useCallback(async (key: string | StorageKey): Promise<boolean> => {
    const keyString = typeof key === 'string' ? key : String(key);
    return storageRepository.hasItem(keyString);
  }, []);

  /**
   * Clear all storage
   */
  const clearAll = useCallback(async (): Promise<boolean> => {
    const result = await storageRepository.clearAll();
    return result.success;
  }, []);

  /**
   * Get item with full result (success/error)
   */
  const getItemWithResult = useCallback(async <T>(
    key: string | StorageKey,
    defaultValue: T
  ): Promise<StorageResult<T>> => {
    const keyString = typeof key === 'string' ? key : String(key);
    return storageRepository.getItem(keyString, defaultValue);
  }, []);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    getItem,
    setItem,
    getString,
    setString,
    removeItem,
    hasItem,
    clearAll,
    getItemWithResult,
  }), [getItem, setItem, getString, setString, removeItem, hasItem, clearAll, getItemWithResult]);
};
