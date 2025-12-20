/**
 * BaseStorageOperations Tests
 *
 * Unit tests for BaseStorageOperations
 */

import { BaseStorageOperations } from '../BaseStorageOperations';
import { AsyncStorage } from '../../__tests__/mocks/asyncStorage.mock';
import { StorageReadError, StorageWriteError, StorageDeleteError } from '../../../domain/errors/StorageError';

describe('BaseStorageOperations', () => {
  let baseOps: BaseStorageOperations;

  beforeEach(() => {
    baseOps = new BaseStorageOperations();
    (AsyncStorage as any).__clear();
  });

  describe('getItem', () => {
    it('should get item successfully', async () => {
      const key = 'test-key';
      const value = { test: 'value' };
      const defaultValue = { default: true };

      // Setup
      await AsyncStorage.setItem(key, JSON.stringify(value));

      // Test
      const result = await baseOps.getItem(key, defaultValue);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(value);
    });

    it('should return default value for missing key', async () => {
      const key = 'missing-key';
      const defaultValue = { default: true };

      const result = await baseOps.getItem(key, defaultValue);

      expect(result.success).toBe(true);
      expect(result.data).toBe(defaultValue);
    });

    it('should handle deserialization error', async () => {
      const key = 'invalid-json-key';
      const defaultValue = { default: true };

      // Setup invalid JSON
      await AsyncStorage.setItem(key, 'invalid-json');

      const result = await baseOps.getItem(key, defaultValue);

      expect(result.success).toBe(false);
      expect(result.data).toBe(defaultValue);
      expect(result.error).toBeInstanceOf(StorageReadError);
    });

    it('should handle storage read error', async () => {
      const key = 'test-key';
      const defaultValue = { default: true };

      // Mock storage error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await baseOps.getItem(key, defaultValue);

      expect(result.success).toBe(false);
      expect(result.data).toBe(defaultValue);
      expect(result.error).toBeInstanceOf(StorageReadError);
    });
  });

  describe('setItem', () => {
    it('should set item successfully', async () => {
      const key = 'test-key';
      const value = { test: 'value' };

      const result = await baseOps.setItem(key, value);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(value);

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      expect(JSON.parse(stored!)).toEqual(value);
    });

    it('should handle serialization error', async () => {
      const key = 'test-key';
      const value = { circular: {} };
      value.circular = value; // Create circular reference

      const result = await baseOps.setItem(key, value);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(StorageWriteError);
    });

    it('should handle storage write error', async () => {
      const key = 'test-key';
      const value = { test: 'value' };

      // Mock storage error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await baseOps.setItem(key, value);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(StorageWriteError);
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      const key = 'test-key';

      // Setup
      await AsyncStorage.setItem(key, 'test-value');

      const result = await baseOps.removeItem(key);

      expect(result.success).toBe(true);

      // Verify removal
      const stored = await AsyncStorage.getItem(key);
      expect(stored).toBeNull();
    });

    it('should handle storage delete error', async () => {
      const key = 'test-key';

      // Mock storage error
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await baseOps.removeItem(key);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(StorageDeleteError);
    });
  });

  describe('hasItem', () => {
    it('should return true for existing item', async () => {
      const key = 'test-key';

      // Setup
      await AsyncStorage.setItem(key, 'test-value');

      const exists = await baseOps.hasItem(key);

      expect(exists).toBe(true);
    });

    it('should return false for missing item', async () => {
      const key = 'missing-key';

      const exists = await baseOps.hasItem(key);

      expect(exists).toBe(false);
    });

    it('should return false on storage error', async () => {
      const key = 'test-key';

      // Mock storage error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const exists = await baseOps.hasItem(key);

      expect(exists).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all storage successfully', async () => {
      // Setup
      await AsyncStorage.setItem('key1', 'value1');
      await AsyncStorage.setItem('key2', 'value2');

      const result = await baseOps.clearAll();

      expect(result.success).toBe(true);

      // Verify clear
      const keys = await AsyncStorage.getAllKeys();
      expect(keys).toHaveLength(0);
    });

    it('should handle storage clear error', async () => {
      // Mock storage error
      (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await baseOps.clearAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(StorageDeleteError);
    });
  });
});