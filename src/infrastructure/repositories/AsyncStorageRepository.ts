/**
 * AsyncStorage Repository
 *
 * Domain-Driven Design: Infrastructure implementation of IStorageRepository
 * Adapts React Native AsyncStorage to domain interface
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IStorageRepository } from '../../application/ports/IStorageRepository';
import type { StorageResult } from '../../domain/entities/StorageResult';
import { success, failure } from '../../domain/entities/StorageResult';
import {
  StorageReadError,
  StorageWriteError,
  StorageDeleteError,
  StorageSerializationError,
  StorageDeserializationError,
} from '../../domain/errors/StorageError';

/**
 * AsyncStorage Repository Implementation
 */
export class AsyncStorageRepository implements IStorageRepository {
  /**
   * Get item from AsyncStorage with type safety
   */
  async getItem<T>(key: string, defaultValue: T): Promise<StorageResult<T>> {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
        // Missing keys on first app launch are NORMAL, not errors
        return success(defaultValue);
      }

      try {
        const parsed = JSON.parse(value) as T;
        return success(parsed);
      } catch (parseError) {
        return failure(new StorageDeserializationError(key, parseError), defaultValue);
      }
    } catch (error) {
      return failure(new StorageReadError(key, error), defaultValue);
    }
  }

  /**
   * Set item in AsyncStorage with automatic JSON serialization
   */
  async setItem<T>(key: string, value: T): Promise<StorageResult<T>> {
    try {
      let serialized: string;
      try {
        serialized = JSON.stringify(value);
      } catch (serializeError) {
        return failure(new StorageSerializationError(key, serializeError));
      }

      await AsyncStorage.setItem(key, serialized);
      return success(value);
    } catch (error) {
      return failure(new StorageWriteError(key, error));
    }
  }

  /**
   * Get string value (no JSON parsing)
   */
  async getString(key: string, defaultValue: string): Promise<StorageResult<string>> {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
        // Missing keys on first app launch are NORMAL, not errors
        return success(defaultValue);
      }

      return success(value);
    } catch (error) {
      return failure(new StorageReadError(key, error), defaultValue);
    }
  }

  /**
   * Set string value (no JSON serialization)
   */
  async setString(key: string, value: string): Promise<StorageResult<string>> {
    try {
      await AsyncStorage.setItem(key, value);
      return success(value);
    } catch (error) {
      return failure(new StorageWriteError(key, error));
    }
  }

  /**
   * Remove item from AsyncStorage
   */
  async removeItem(key: string): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.removeItem(key);
      return success(undefined);
    } catch (error) {
      return failure(new StorageDeleteError(key, error));
    }
  }

  /**
   * Check if key exists in storage
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear all AsyncStorage data (use with caution!)
   */
  async clearAll(): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.clear();
      return success(undefined);
    } catch (error) {
      return failure(new StorageDeleteError('ALL_KEYS', error));
    }
  }

  /**
   * Get multiple items at once (more efficient than multiple getItem calls)
   */
  async getMultiple(
    keys: string[]
  ): Promise<StorageResult<Record<string, string | null>>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result = Object.fromEntries(pairs);
      return success(result);
    } catch (error) {
      return failure(new StorageReadError('MULTIPLE_KEYS', error));
    }
  }

  /**
   * Get object from storage (alias for getItem for backward compatibility)
   * @deprecated Use getItem instead
   */
  async getObject<T>(key: string, defaultValue: T): Promise<StorageResult<T>> {
    return this.getItem(key, defaultValue);
  }

  /**
   * Set object in storage (alias for setItem for backward compatibility)
   * @deprecated Use setItem instead
   */
  async setObject<T>(key: string, value: T): Promise<StorageResult<T>> {
    return this.setItem(key, value);
  }
}

/**
 * Singleton instance
 */
export const storageRepository = new AsyncStorageRepository();
