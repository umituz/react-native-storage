/**
 * Base Storage Operations
 *
 * Core storage operations following Single Responsibility Principle
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageResult } from '../../domain/entities/StorageResult';
import { success, failure } from '../../domain/entities/StorageResult';
import {
  StorageReadError,
  StorageWriteError,
  StorageDeleteError,
  StorageSerializationError,
  StorageDeserializationError,
} from '../../domain/errors/StorageError';
import { devWarn } from '../../domain/utils/devUtils';

/**
 * Base storage operations implementation
 */
export class BaseStorageOperations {
  /**
   * Get item from AsyncStorage with type safety
   */
  async getItem<T>(key: string, defaultValue: T): Promise<StorageResult<T>> {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
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
    } catch (error) {
      devWarn(`BaseStorageOperations: Failed to check if key "${key}" exists`, error);
      return false;
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  async clearAll(): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.clear();
      return success(undefined);
    } catch (error) {
      return failure(new StorageDeleteError('ALL_KEYS', error));
    }
  }
}