/**
 * Batch Storage Operations
 *
 * Batch operations following Single Responsibility Principle
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageResult } from '../../domain/entities/StorageResult';
import { success, failure } from '../../domain/entities/StorageResult';
import { StorageReadError } from '../../domain/errors/StorageError';

/**
 * Batch storage operations for efficiency
 */
export class BatchStorageOperations {
  /**
   * Get multiple items at once
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
   * Get all keys from storage
   */
  async getAllKeys(): Promise<StorageResult<string[]>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return success([...keys]);
    } catch (error) {
      return failure(new StorageReadError('ALL_KEYS', error));
    }
  }
}