/**
 * AsyncStorageRepository Tests
 *
 * Unit tests for AsyncStorageRepository
 */

import { AsyncStorageRepository } from '../AsyncStorageRepository';
import { AsyncStorage } from '../../__tests__/mocks/asyncStorage.mock';

describe('AsyncStorageRepository', () => {
  let repository: AsyncStorageRepository;

  beforeEach(() => {
    repository = new AsyncStorageRepository();
    (AsyncStorage as any).__clear();
  });

  describe('Composition', () => {
    it('should use composition pattern', () => {
      expect(repository).toBeInstanceOf(AsyncStorageRepository);
      
      // Test that all methods are available
      expect(typeof repository.getItem).toBe('function');
      expect(typeof repository.setItem).toBe('function');
      expect(typeof repository.getString).toBe('function');
      expect(typeof repository.setString).toBe('function');
      expect(typeof repository.removeItem).toBe('function');
      expect(typeof repository.hasItem).toBe('function');
      expect(typeof repository.clearAll).toBe('function');
      expect(typeof repository.getMultiple).toBe('function');
      expect(typeof repository.getAllKeys).toBe('function');
    });
  });

  describe('Delegation', () => {
    it('should delegate getItem to BaseStorageOperations', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const expectedValue = 'test-value';

      await AsyncStorage.setItem(key, JSON.stringify(expectedValue));

      const result = await repository.getItem(key, defaultValue);

      expect(result.success).toBe(true);
      expect(result.data).toBe(expectedValue);
    });

    it('should delegate setItem to BaseStorageOperations', async () => {
      const key = 'test-key';
      const value = 'test-value';

      const result = await repository.setItem(key, value);

      expect(result.success).toBe(true);
      expect(result.data).toBe(value);
    });

    it('should delegate getString to StringStorageOperations', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const expectedValue = 'test-string';

      await AsyncStorage.setItem(key, expectedValue);

      const result = await repository.getString(key, defaultValue);

      expect(result.success).toBe(true);
      expect(result.data).toBe(expectedValue);
    });

    it('should delegate setString to StringStorageOperations', async () => {
      const key = 'test-key';
      const value = 'test-string';

      const result = await repository.setString(key, value);

      expect(result.success).toBe(true);
      expect(result.data).toBe(value);
    });

    it('should delegate removeItem to BaseStorageOperations', async () => {
      const key = 'test-key';

      await AsyncStorage.setItem(key, 'test-value');

      const result = await repository.removeItem(key);

      expect(result.success).toBe(true);
    });

    it('should delegate hasItem to BaseStorageOperations', async () => {
      const key = 'test-key';

      await AsyncStorage.setItem(key, 'test-value');

      const exists = await repository.hasItem(key);

      expect(exists).toBe(true);
    });

    it('should delegate clearAll to BaseStorageOperations', async () => {
      await AsyncStorage.setItem('key1', 'value1');
      await AsyncStorage.setItem('key2', 'value2');

      const result = await repository.clearAll();

      expect(result.success).toBe(true);
    });

    it('should delegate getMultiple to BatchStorageOperations', async () => {
      const keys = ['key1', 'key2'];
      
      await AsyncStorage.setItem('key1', 'value1');
      await AsyncStorage.setItem('key2', 'value2');

      const result = await repository.getMultiple(keys);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should delegate getAllKeys to BatchStorageOperations', async () => {
      await AsyncStorage.setItem('key1', 'value1');
      await AsyncStorage.setItem('key2', 'value2');

      const result = await repository.getAllKeys();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.arrayContaining(['key1', 'key2']));
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from delegated operations', async () => {
      const key = 'test-key';
      
      // Mock error in AsyncStorage
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.getItem(key, 'default');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for generic methods', async () => {
      interface TestData {
        id: number;
        name: string;
      }

      const key = 'typed-key';
      const data: TestData = { id: 1, name: 'test' };

      const setResult = await repository.setItem<TestData>(key, data);
      const getResult = await repository.getItem<TestData>(key, { id: 0, name: '' });

      expect(setResult.success).toBe(true);
      expect(getResult.success).toBe(true);
      expect(getResult.data).toEqual(data);
    });
  });
});