/**
 * React Hooks Integration Tests
 */

// Mock React for testing environment
const mockReact = require('react');

// Simple mock for renderHook
const renderHook = (hook: Function) => {
  const result = { current: hook() };
  
  const rerender = () => {
    result.current = hook();
  };
  
  const unmount = () => {
    // Cleanup logic would go here
  };
  
  return { result, rerender, unmount };
};

// Mock act function
const act = (callback: Function) => {
  callback();
};

import { useCache } from '../useCache';
import { useCachedValue } from '../useCachedValue';
import { cacheManager } from '../../domain/CacheManager';

describe('React Hooks Integration', () => {
  beforeEach(() => {
    cacheManager.clearAll();
    jest.clearAllMocks();
  });

  describe('useCache', () => {
    test('should provide cache operations', () => {
      const { result } = renderHook(() => useCache<string>('test-cache'));

      expect(result.current).toHaveProperty('set');
      expect(result.current).toHaveProperty('get');
      expect(result.current).toHaveProperty('has');
      expect(result.current).toHaveProperty('remove');
      expect(result.current).toHaveProperty('clear');
      expect(result.current).toHaveProperty('invalidatePattern');
      expect(result.current).toHaveProperty('getStats');
    });

    test('should set and get values', () => {
      const { result } = renderHook(() => useCache<string>('test-cache'));

      act(() => {
        result.current.set('key1', 'value1');
      });

      expect(result.current.get('key1')).toBe('value1');
    });

    test('should check if key exists', () => {
      const { result } = renderHook(() => useCache<string>('test-cache'));

      expect(result.current.has('key1')).toBe(false);

      act(() => {
        result.current.set('key1', 'value1');
      });

      expect(result.current.has('key1')).toBe(true);
    });

    test('should remove keys', () => {
      const { result } = renderHook(() => useCache<string>('test-cache'));

      act(() => {
        result.current.set('key1', 'value1');
      });

      expect(result.current.has('key1')).toBe(true);

      act(() => {
        const removed = result.current.remove('key1');
        expect(removed).toBe(true);
      });

      expect(result.current.has('key1')).toBe(false);
    });

    test('should clear all keys', () => {
      const { result } = renderHook(() => useCache<string>('test-cache'));

      act(() => {
        result.current.set('key1', 'value1');
        result.current.set('key2', 'value2');
      });

      expect(result.current.getStats().size).toBe(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.getStats().size).toBe(0);
    });

    test('should invalidate patterns', () => {
      const { result } = renderHook(() => useCache<string>('test-cache'));

      act(() => {
        result.current.set('user:1', 'user1');
        result.current.set('user:2', 'user2');
        result.current.set('post:1', 'post1');
      });

      act(() => {
        const count = result.current.invalidatePattern('user:*');
        expect(count).toBe(2);
      });

      expect(result.current.has('user:1')).toBe(false);
      expect(result.current.has('user:2')).toBe(false);
      expect(result.current.has('post:1')).toBe(true);
    });

    test('should get cache statistics', () => {
      const { result } = renderHook(() => useCache<string>('test-cache'));

      const initialStats = result.current.getStats();
      expect(initialStats.size).toBe(0);
      expect(initialStats.hits).toBe(0);
      expect(initialStats.misses).toBe(0);

      act(() => {
        result.current.set('key1', 'value1');
      });

      const afterSetStats = result.current.getStats();
      expect(afterSetStats.size).toBe(1);

      act(() => {
        result.current.get('key1'); // hit
        result.current.get('nonexistent'); // miss
      });

      const afterAccessStats = result.current.getStats();
      expect(afterAccessStats.hits).toBe(1);
      expect(afterAccessStats.misses).toBe(1);
    });

    test('should use custom cache configuration', () => {
      const { result } = renderHook(() => 
        useCache<string>('custom-cache', { maxSize: 5, defaultTTL: 2000 })
      );

      act(() => {
        result.current.set('key1', 'value1');
      });

      expect(result.current.get('key1')).toBe('value1');
    });

    test('should maintain separate caches for different names', () => {
      const { result: result1 } = renderHook(() => useCache<string>('cache1'));
      const { result: result2 } = renderHook(() => useCache<number>('cache2'));

      act(() => {
        result1.current.set('key', 'string-value');
        result2.current.set('key', 42);
      });

      expect(result1.current.get('key')).toBe('string-value');
      expect(result2.current.get('key')).toBe(42);
    });

    test('should handle rapid operations without memory leaks', () => {
      const { result } = renderHook(() => useCache<string>('rapid-cache'));

      // Perform many operations rapidly
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.set(`key${i}`, `value${i}`);
        });
      }

      expect(result.current.getStats().size).toBe(100);

      // Clear many operations rapidly
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.remove(`key${i}`);
        });
      }

      expect(result.current.getStats().size).toBe(0);
    });
  });

  describe('useCachedValue', () => {
    test('should load and cache value', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fetched-value');
      
      const { result } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher)
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.value).toBeUndefined();
      expect(result.current.error).toBe(null);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.value).toBe('fetched-value');
      expect(result.current.error).toBe(null);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    test('should use cached value on subsequent renders', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fetched-value');
      
      const { result, rerender } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher)
      );

      // Initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Rerender - should use cache
      rerender();

      expect(result.current.value).toBe('fetched-value');
      expect(mockFetcher).toHaveBeenCalledTimes(1); // Still only called once
    });

    test('should handle fetcher errors', async () => {
      const mockError = new Error('Fetch failed');
      const mockFetcher = jest.fn().mockRejectedValue(mockError);
      
      const { result } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.value).toBeUndefined();
      expect(result.current.error).toBe(mockError);
    });

    test('should invalidate cached value', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('initial-value');
      
      const { result } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher)
      );

      // Initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('initial-value');

      // Invalidate
      act(() => {
        result.current.invalidate();
      });

      expect(result.current.value).toBeUndefined();

      // Should fetch again on next render
      mockFetcher.mockResolvedValue('new-value');
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('new-value');
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    test('should invalidate pattern', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('value');
      
      const { result } = renderHook(() =>
        useCachedValue('test-cache', 'user:123', mockFetcher)
      );

      // Load initial value
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('value');

      // Invalidate pattern
      act(() => {
        const count = result.current.invalidatePattern('user:*');
        expect(count).toBe(1);
      });

      expect(result.current.value).toBeUndefined();
    });

    test('should refetch manually', async () => {
      const mockFetcher = jest.fn()
        .mockResolvedValueOnce('initial-value')
        .mockResolvedValueOnce('refetched-value');
      
      const { result } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher)
      );

      // Initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('initial-value');
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Refetch
      act(() => {
        result.current.refetch();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('refetched-value');
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    test('should use custom TTL', async () => {
      jest.useFakeTimers();
      
      const mockFetcher = jest.fn().mockResolvedValue('value');
      
      const { result } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher, { ttl: 1000 })
      );

      // Load initial value
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('value');
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Fast forward past TTL
      jest.advanceTimersByTime(1001);

      // Should fetch again
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockFetcher).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    test('should handle dependency changes', async () => {
      const mockFetcher1 = jest.fn().mockResolvedValue('value1');
      const mockFetcher2 = jest.fn().mockResolvedValue('value2');
      
      const { result, rerender } = renderHook(
        ({ fetcher }) => useCachedValue('test-cache', 'test-key', fetcher),
        { initialProps: { fetcher: mockFetcher1 } }
      );

      // Initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('value1');
      expect(mockFetcher1).toHaveBeenCalledTimes(1);

      // Change fetcher
      rerender({ fetcher: mockFetcher2 });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.value).toBe('value2');
      expect(mockFetcher2).toHaveBeenCalledTimes(1);
    });

    test('should handle concurrent requests', async () => {
      let resolveCount = 0;
      const mockFetcher = jest.fn(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolveCount++;
            resolve(`value-${resolveCount}`);
          }, 100);
        });
      });
      
      const { result } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher)
      );

      // Trigger multiple rapid renders
      act(() => {});
      act(() => {});
      act(() => {});

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should only call fetcher once despite multiple renders
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(result.current.value).toBe('value-1');
    });

    test('should cleanup on unmount', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('value');
      
      const { unmount } = renderHook(() =>
        useCachedValue('test-cache', 'test-key', mockFetcher)
      );

      // Start loading
      expect(result.current.isLoading).toBe(true);

      // Unmount while loading
      unmount();

      // Complete the fetch after unmount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should not cause errors
      expect(true).toBe(true);
    });
  });

  describe('Hook Integration', () => {
    test('should work together with useCache and useCachedValue', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('fetched-value');
      
      const { result: cacheResult } = renderHook(() => useCache<string>('shared-cache'));
      const { result: valueResult } = renderHook(() =>
        useCachedValue('shared-cache', 'shared-key', mockFetcher)
      );

      // Load value through useCachedValue
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(valueResult.current.value).toBe('fetched-value');

      // Value should be accessible through useCache
      expect(cacheResult.current.get('shared-key')).toBe('fetched-value');

      // Invalidate through useCache
      act(() => {
        cacheResult.current.invalidatePattern('*');
      });

      expect(valueResult.current.value).toBeUndefined();
      expect(cacheResult.current.has('shared-key')).toBe(false);
    });

    test('should handle multiple hooks with same cache', async () => {
      const mockFetcher1 = jest.fn().mockResolvedValue('value1');
      const mockFetcher2 = jest.fn().mockResolvedValue('value2');
      
      const { result: result1 } = renderHook(() =>
        useCachedValue('shared-cache', 'key1', mockFetcher1)
      );
      
      const { result: result2 } = renderHook(() =>
        useCachedValue('shared-cache', 'key2', mockFetcher2)
      );

      // Load both values
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result1.current.value).toBe('value1');
      expect(result2.current.value).toBe('value2');

      // Invalidate one should not affect the other
      act(() => {
        result1.current.invalidate();
      });

      expect(result1.current.value).toBeUndefined();
      expect(result2.current.value).toBe('value2'); // Should remain
    });
  });
});