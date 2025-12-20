/**
 * Integration Tests
 *
 * End-to-end tests for the storage system
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useStorage, useStorageState, usePersistentCache } from '../../index';
import { StorageKey } from '../../domain/value-objects/StorageKey';
import { AsyncStorage } from '../mocks/asyncStorage.mock';

describe('Integration Tests', () => {
  beforeEach(() => {
    (AsyncStorage as any).__clear();
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Storage Operations Integration', () => {
    it('should work with complex data types', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      // Test with complex object
      const complexData = {
        user: {
          id: 1,
          name: 'John Doe',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        metadata: {
          version: '1.0.0',
          timestamp: Date.now(),
        },
      };

      // Set complex data
      const setSuccess = await storageHook.current.setItem('complex-data', complexData);
      expect(setSuccess).toBe(true);

      // Get complex data
      const retrievedData = await storageHook.current.getItem('complex-data', {});
      expect(retrievedData).toEqual(complexData);
    });

    it('should work with arrays', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      // Set array
      const setSuccess = await storageHook.current.setItem('array-data', arrayData);
      expect(setSuccess).toBe(true);

      // Get array
      const retrievedData = await storageHook.current.getItem('array-data', []);
      expect(retrievedData).toEqual(arrayData);
    });

    it('should work with StorageKey enum', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      const preferences = {
        theme: 'light',
        language: 'en',
      };

      // Set with enum key
      const setSuccess = await storageHook.current.setItem(
        StorageKey.USER_PREFERENCES, 
        preferences
      );
      expect(setSuccess).toBe(true);

      // Get with enum key
      const retrievedData = await storageHook.current.getItem(
        StorageKey.USER_PREFERENCES, 
        {}
      );
      expect(retrievedData).toEqual(preferences);
    });
  });

  describe('State Management Integration', () => {
    it('should sync state with storage', async () => {
      const key = 'sync-test';
      const initialValue = 'initial';
      const updatedValue = 'updated';

      // Set initial value in storage
      await AsyncStorage.setItem(key, JSON.stringify(initialValue));

      const { result: stateHook, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, initialValue)
      );

      // Wait for initial load
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(stateHook.current[0]).toBe(initialValue);

      // Update state
      await act(async () => {
        await stateHook.current[1](updatedValue);
      });

      expect(stateHook.current[0]).toBe(updatedValue);

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      expect(JSON.parse(stored!)).toBe(updatedValue);
    });

    it('should handle multiple state hooks', async () => {
      const { result: hook1, waitForNextUpdate: waitFor1 } = renderHook(() => 
        useStorageState('key1', 'value1')
      );

      const { result: hook2, waitForNextUpdate: waitFor2 } = renderHook(() => 
        useStorageState('key2', 'value2')
      );

      // Wait for both to load
      await act(async () => {
        await Promise.all([waitFor1(), waitFor2()]);
      });

      expect(hook1.current[0]).toBe('value1');
      expect(hook2.current[0]).toBe('value2');

      // Update first hook
      await act(async () => {
        await hook1.current[1]('updated1');
      });

      expect(hook1.current[0]).toBe('updated1');
      expect(hook2.current[0]).toBe('value2'); // Should not affect second hook
    });
  });

  describe('Cache Integration', () => {
    it('should cache and retrieve data with TTL', async () => {
      const key = 'cache-integration';
      const data = { posts: [{ id: 1, title: 'Test Post' }] };
      const ttl = 60000; // 1 minute

      const { result: cacheHook, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key, { ttl })
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // Should be empty initially
      expect(cacheHook.current.data).toBeNull();
      expect(cacheHook.current.isExpired).toBe(true);

      // Set data
      await act(async () => {
        await cacheHook.current.setData(data);
      });

      expect(cacheHook.current.data).toEqual(data);
      expect(cacheHook.current.isExpired).toBe(false);

      // Create new hook instance to test persistence
      const { result: newCacheHook, waitForNextUpdate: waitForNew } = renderHook(() => 
        usePersistentCache(key, { ttl })
      );

      await act(async () => {
        await waitForNew();
      });

      expect(newCacheHook.current.data).toEqual(data);
      expect(newCacheHook.current.isExpired).toBe(false);
    });

    it('should handle cache expiration', async () => {
      const key = 'cache-expiration';
      const data = { test: 'value' };
      const ttl = 1000; // 1 second

      const { result: cacheHook, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key, { ttl })
      );

      // Set data
      await act(async () => {
        await waitForNextUpdate();
        await cacheHook.current.setData(data);
      });

      expect(cacheHook.current.isExpired).toBe(false);

      // Simulate time passage
      jest.spyOn(Date, 'now').mockReturnValue(1000000 + 2000); // 2 seconds later

      // Create new hook to test expiration
      const { result: newCacheHook, waitForNextUpdate: waitForNew } = renderHook(() => 
        usePersistentCache(key, { ttl })
      );

      await act(async () => {
        await waitForNew();
      });

      expect(newCacheHook.current.data).toEqual(data);
      expect(newCacheHook.current.isExpired).toBe(true);
    });

    it('should handle cache versioning', async () => {
      const key = 'cache-versioning';
      const dataV1 = { version: 1, data: 'old' };
      const dataV2 = { version: 2, data: 'new' };

      // Set cache with version 1
      await AsyncStorage.setItem(key, JSON.stringify({
        value: dataV1,
        timestamp: 1000000 - 10000,
        ttl: 60000,
        version: 1,
      }));

      // Load with version 1
      const { result: cacheHook1, waitForNextUpdate: waitFor1 } = renderHook(() => 
        usePersistentCache(key, { version: 1 })
      );

      await act(async () => {
        await waitFor1();
      });

      expect(cacheHook1.current.data).toEqual(dataV1);
      expect(cacheHook1.current.isExpired).toBe(false);

      // Load with version 2 (should be expired)
      const { result: cacheHook2, waitForNextUpdate: waitFor2 } = renderHook(() => 
        usePersistentCache(key, { version: 2 })
      );

      await act(async () => {
        await waitFor2();
      });

      expect(cacheHook2.current.data).toEqual(dataV1);
      expect(cacheHook2.current.isExpired).toBe(true);

      // Update with version 2
      await act(async () => {
        await cacheHook2.current.setData(dataV2);
      });

      expect(cacheHook2.current.data).toEqual(dataV2);
      expect(cacheHook2.current.isExpired).toBe(false);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from storage errors', async () => {
      const key = 'error-recovery';
      const defaultValue = 'default';

      // Mock storage error for first call
      let callCount = 0;
      (AsyncStorage.getItem as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Storage error'));
        }
        return Promise.resolve(JSON.stringify('recovered-value'));
      });

      const { result: stateHook, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // Should use default value on error
      expect(stateHook.current[0]).toBe(defaultValue);

      // Retry should work
      await act(async () => {
        await stateHook.current[1]('retry-value');
      });

      expect(stateHook.current[0]).toBe('retry-value');
    });

    it('should handle corrupted data gracefully', async () => {
      const key = 'corrupted-data';
      const defaultValue = { safe: 'default' };

      // Set corrupted JSON
      await AsyncStorage.setItem(key, '{"invalid": json}');

      const { result: stateHook, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // Should use default value
      expect(stateHook.current[0]).toEqual(defaultValue);

      // Should be able to set new data
      const validData = { valid: 'data' };
      await act(async () => {
        await stateHook.current[1](validData);
      });

      expect(stateHook.current[0]).toEqual(validData);
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid state changes', async () => {
      const key = 'rapid-changes';
      const { result: stateHook, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, 'initial')
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // Rapid changes
      const changes = ['change1', 'change2', 'change3'];
      
      for (const change of changes) {
        await act(async () => {
          await stateHook.current[1](change);
        });
        expect(stateHook.current[0]).toBe(change);
      }

      // Verify final state in storage
      const stored = await AsyncStorage.getItem(key);
      expect(JSON.parse(stored!)).toBe('change3');
    });

    it('should not interfere with different keys', async () => {
      const { result: hook1, waitForNextUpdate: waitFor1 } = renderHook(() => 
        useStorageState('key1', 'value1')
      );

      const { result: hook2, waitForNextUpdate: waitFor2 } = renderHook(() => 
        useStorageState('key2', 'value2')
      );

      await act(async () => {
        await Promise.all([waitFor1(), waitFor2()]);
      });

      // Update both hooks rapidly
      await act(async () => {
        await Promise.all([
          hook1.current[1]('updated1'),
          hook2.current[1]('updated2'),
        ]);
      });

      expect(hook1.current[0]).toBe('updated1');
      expect(hook2.current[0]).toBe('updated2');

      // Verify storage
      const stored1 = await AsyncStorage.getItem('key1');
      const stored2 = await AsyncStorage.getItem('key2');
      expect(JSON.parse(stored1!)).toBe('updated1');
      expect(JSON.parse(stored2!)).toBe('updated2');
    });
  });
});