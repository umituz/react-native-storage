/**
 * Storage Repository Interface (Port)
 *
 * Domain-Driven Design: Application port for storage operations
 * Infrastructure layer implements this interface
 */

import type { StorageResult } from '../../domain/entities/StorageResult';

/**
 * Storage Repository Interface
 * Defines contract for storage operations
 */
export interface IStorageRepository {
  /**
   * Get item from storage with JSON parsing
   */
  getItem<T>(key: string, defaultValue: T): Promise<StorageResult<T>>;

  /**
   * Set item in storage with JSON serialization
   */
  setItem<T>(key: string, value: T): Promise<StorageResult<T>>;

  /**
   * Get string value (no JSON parsing)
   */
  getString(key: string, defaultValue: string): Promise<StorageResult<string>>;

  /**
   * Set string value (no JSON serialization)
   */
  setString(key: string, value: string): Promise<StorageResult<string>>;

  /**
   * Remove item from storage
   */
  removeItem(key: string): Promise<StorageResult<void>>;

  /**
   * Check if key exists in storage
   */
  hasItem(key: string): Promise<boolean>;

  /**
   * Clear all storage data
   */
  clearAll(): Promise<StorageResult<void>>;

  /**
   * Get multiple items at once
   */
  getMultiple(keys: string[]): Promise<StorageResult<Record<string, string | null>>>;

  /**
   * Get all keys from storage
   */
  getAllKeys(): Promise<StorageResult<string[]>>;


}
