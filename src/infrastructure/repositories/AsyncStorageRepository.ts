/**
 * AsyncStorage Repository
 *
 * Domain-Driven Design: Infrastructure implementation of IStorageRepository
 * Adapts React Native AsyncStorage to domain interface using composition
 */

import type { IStorageRepository } from '../../application/ports/IStorageRepository';
import type { StorageResult } from '../../domain/entities/StorageResult';
import { BaseStorageOperations } from './BaseStorageOperations';
import { StringStorageOperations } from './StringStorageOperations';
import { BatchStorageOperations } from './BatchStorageOperations';

/**
 * AsyncStorage Repository Implementation
 * Uses composition to follow Single Responsibility Principle
 */
export class AsyncStorageRepository implements IStorageRepository {
  private baseOps: BaseStorageOperations;
  private stringOps: StringStorageOperations;
  private batchOps: BatchStorageOperations;

  constructor() {
    this.baseOps = new BaseStorageOperations();
    this.stringOps = new StringStorageOperations();
    this.batchOps = new BatchStorageOperations();
  }

  /**
   * Get item from AsyncStorage with type safety
   */
  async getItem<T>(key: string, defaultValue: T): Promise<StorageResult<T>> {
    return this.baseOps.getItem(key, defaultValue);
  }

  /**
   * Set item in AsyncStorage with automatic JSON serialization
   */
  async setItem<T>(key: string, value: T): Promise<StorageResult<T>> {
    return this.baseOps.setItem(key, value);
  }

  /**
   * Get string value (no JSON parsing)
   */
  async getString(key: string, defaultValue: string): Promise<StorageResult<string>> {
    return this.stringOps.getString(key, defaultValue);
  }

  /**
   * Set string value (no JSON serialization)
   */
  async setString(key: string, value: string): Promise<StorageResult<string>> {
    return this.stringOps.setString(key, value);
  }

  /**
   * Remove item from AsyncStorage
   */
  async removeItem(key: string): Promise<StorageResult<void>> {
    return this.baseOps.removeItem(key);
  }

  /**
   * Check if key exists in storage
   */
  async hasItem(key: string): Promise<boolean> {
    return this.baseOps.hasItem(key);
  }

  /**
   * Clear all AsyncStorage data
   */
  async clearAll(): Promise<StorageResult<void>> {
    return this.baseOps.clearAll();
  }

  /**
   * Get multiple items at once
   */
  async getMultiple(
    keys: string[]
  ): Promise<StorageResult<Record<string, string | null>>> {
    return this.batchOps.getMultiple(keys);
  }

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<StorageResult<string[]>> {
    return this.batchOps.getAllKeys();
  }
}

/**
 * Singleton instance
 */
export const storageRepository = new AsyncStorageRepository();