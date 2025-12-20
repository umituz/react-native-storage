/**
 * String Storage Operations
 *
 * Specialized string operations following Single Responsibility Principle
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageResult } from '../../domain/entities/StorageResult';
import { success, failure } from '../../domain/entities/StorageResult';
import { StorageReadError, StorageWriteError } from '../../domain/errors/StorageError';

/**
 * String-specific storage operations
 */
export class StringStorageOperations {
  /**
   * Get string value (no JSON parsing)
   */
  async getString(key: string, defaultValue: string): Promise<StorageResult<string>> {
    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
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
}