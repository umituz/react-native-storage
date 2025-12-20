/**
 * usePersistentCache Hook Tests
 *
 * Unit tests for usePersistentCache hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { usePersistentCache } from '../usePersistentCache';
import { AsyncStorage } from '../../__tests__/mocks/asyncStorage.mock';
import { DEFAULT_TTL } from '../../../domain/constants/CacheDefaults';

describe('usePersistentCache Hook', () => {
  beforeEach(() => {
    (AsyncStorage as any).__clear();
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Load', () => {
    it('should load cached data', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };
      const cachedValue = {
        value: data,
        cachedAt: 1000000 - 10000, // 10 seconds ago
        expiresAt: 1000000 + 50000, // 50 seconds from now
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedValue));

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toEqual(data);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });

    it('should handle missing cache', async () => {
      const key = 'missing-cache';

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });

    it('should handle expired cache', async () => {
      const key = 'expired-cache';
      const data = { test: 'value' };
      const cachedValue = {
        value: data,
        cachedAt: 1000000 - 120000, // 2 minutes ago
        expiresAt: 1000000 - 60000, // 1 minute ago (expired)
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedValue));

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toEqual(data);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });
  });

  describe('setData', () => {
    it('should set data to cache', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // Set data
      await act(async () => {
        await result.current.setData(data);
      });

      expect(result.current.data).toEqual(data);
      expect(result.current.isExpired).toBe(false);

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      const parsed = JSON.parse(stored!);
      expect(parsed.value).toEqual(data);
    });

    it('should use custom TTL', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };
      const ttl = 120000; // 2 minutes

      const { result } = renderHook(() => 
        usePersistentCache(key, { ttl })
      );

      await act(async () => {
        await result.current.setData(data);
      });

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      const parsed = JSON.parse(stored!);
      expect(parsed.expiresAt - parsed.cachedAt).toBe(ttl);
    });

    it('should use version', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };
      const version = 2;

      const { result } = renderHook(() => 
        usePersistentCache(key, { version })
      );

      await act(async () => {
        await result.current.setData(data);
      });

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(version);
    });

    it('should not set data when disabled', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };

      const { result } = renderHook(() => 
        usePersistentCache(key, { enabled: false })
      );

      await act(async () => {
        await result.current.setData(data);
      });

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      expect(stored).toBeNull();
    });
  });

  describe('clearData', () => {
    it('should clear cached data', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };
      const cachedValue = {
        value: data,
        cachedAt: 1000000 - 10000,
        expiresAt: 1000000 + 50000,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedValue));

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // Clear data
      await act(async () => {
        await result.current.clearData();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isExpired).toBe(true);

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      expect(stored).toBeNull();
    });

    it('should not clear when disabled', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };
      const cachedValue = {
        value: data,
        cachedAt: 1000000 - 10000,
        expiresAt: 1000000 + 50000,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedValue));

      const { result } = renderHook(() => 
        usePersistentCache(key, { enabled: false })
      );

      await act(async () => {
        await result.current.clearData();
      });

      // Storage should not be cleared
      const stored = await AsyncStorage.getItem(key);
      expect(stored).toBe(JSON.stringify(cachedValue));
    });
  });

  describe('refresh', () => {
    it('should refresh cache from storage', async () => {
      const key = 'test-cache';
      const data1 = { test: 'value1' };
      const data2 = { test: 'value2' };

      // Set initial cache
      const cachedValue1 = {
        value: data1,
        timestamp: 1000000 - 10000,
        ttl: 60000,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedValue1));

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toEqual(data1);

      // Update storage directly
      const cachedValue2 = {
        value: data2,
        timestamp: 1000000 - 5000,
        ttl: 60000,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedValue2));

      // Refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toEqual(data2);
    });
  });

  describe('Performance', () => {
    it('should use singleton CacheStorageOperations', () => {
      const { result: result1 } = renderHook(() => 
        usePersistentCache('key1')
      );

      const { result: result2 } = renderHook(() => 
        usePersistentCache('key2')
      );

      // Both hooks should use the same instance
      expect(result1.current.setData).toBe(result2.current.setData);
    });

    it('should not re-run effect when options change', async () => {
      const key = 'test-cache';
      const data = { test: 'value' };
      const cachedValue = {
        value: data,
        cachedAt: 1000000 - 10000,
        expiresAt: 1000000 + 50000,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedValue));

      const { result, rerender, waitForNextUpdate } = renderHook(
        ({ options }) => usePersistentCache(key, options),
        { 
          initialProps: { 
            options: { ttl: 60000, version: 1, enabled: true } 
          } 
        }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const getItemCalls = (AsyncStorage.getItem as jest.Mock).mock.calls.length;

      // Rerender with different options
      rerender({ 
        options: { ttl: 120000, version: 2, enabled: true } 
      });

      // Should not trigger another storage read
      expect((AsyncStorage.getItem as jest.Mock).mock.calls.length).toBe(getItemCalls);
    });

    it('should re-run effect when key changes', async () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const data1 = { test: 'value1' };
      const data2 = { test: 'value2' };

      const cachedValue1 = {
        value: data1,
        timestamp: 1000000 - 10000,
        ttl: 60000,
      };

      const cachedValue2 = {
        value: data2,
        timestamp: 1000000 - 10000,
        ttl: 60000,
      };

      await AsyncStorage.setItem(key1, JSON.stringify(cachedValue1));
      await AsyncStorage.setItem(key2, JSON.stringify(cachedValue2));

      const { result, rerender, waitForNextUpdate } = renderHook(
        ({ key }) => usePersistentCache(key),
        { initialProps: { key: key1 } }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toEqual(data1);

      // Change key
      rerender({ key: key2 });

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toEqual(data2);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage read error', async () => {
      const key = 'test-cache';

      // Mock storage error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });

    it('should handle invalid cache data', async () => {
      const key = 'test-cache';

      // Set invalid JSON
      await AsyncStorage.setItem(key, 'invalid-json');

      const { result, waitForNextUpdate } = renderHook(() => 
        usePersistentCache(key)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });
  });
});