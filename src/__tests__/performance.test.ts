/**
 * Performance Tests
 *
 * Performance and memory leak tests
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useStorage, useStorageState, usePersistentCache } from '../../index';
import { AsyncStorage } from '../mocks/asyncStorage.mock';
import { mockPerformance, trackMemoryUsage } from '../setup';

describe('Performance Tests', () => {
  beforeEach(() => {
    (AsyncStorage as any).__clear();
    jest.clearAllMocks();
    mockPerformance();
  });

  describe('Memory Leak Prevention', () => {
    it('should not leak memory with multiple hook instances', () => {
      const memoryTracker = trackMemoryUsage();
      
      // Create many hook instances
      const hooks = Array.from({ length: 100 }, (_, i) => 
        renderHook(() => useStorage())
      );

      // Add listeners
      hooks.forEach(hook => {
        hook.current.getItem(`key-${i}`, 'default');
      });

      const listenerCount = memoryTracker.getListenerCount();
      expect(listenerCount).toBeLessThan(50); // Should be much less than 100

      // Cleanup
      hooks.forEach(hook => hook.unmount());
      memoryTracker.cleanup();
    });

    it('should cleanup on unmount', () => {
      const memoryTracker = trackMemoryUsage();
      
      const { result, unmount } = renderHook(() => useStorageState('test', 'default'));

      // Add some async operations
      const promise = result.current[1]('test-value');
      
      // Unmount before promise resolves
      unmount();

      const listenerCount = memoryTracker.getListenerCount();
      expect(listenerCount).toBe(0);

      memoryTracker.cleanup();
      return promise;
    });

    it('should not create multiple CacheStorageOperations instances', () => {
      const { result: hook1 } = renderHook(() => 
        usePersistentCache('key1')
      );

      const { result: hook2 } = renderHook(() => 
        usePersistentCache('key2')
      );

      const { result: hook3 } = renderHook(() => 
        usePersistentCache('key3')
      );

      // All should use the same instance (singleton pattern)
      expect(hook1.current.setData).toBe(hook2.current.setData);
      expect(hook2.current.setData).toBe(hook3.current.setData);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle large datasets efficiently', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      // Create large dataset (10,000 items)
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        metadata: {
          created: Date.now(),
          tags: [`tag${i % 10}`, `category${i % 5}`],
        },
      }));

      const startTime = performance.now();

      // Set large data
      const setSuccess = await storageHook.current.setItem('large-data', largeData);
      expect(setSuccess).toBe(true);

      // Get large data
      const retrievedData = await storageHook.current.getItem('large-data', []);
      expect(retrievedData).toEqual(largeData);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle rapid operations efficiently', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      const iterations = 1000;
      const startTime = performance.now();

      // Rapid set/get operations
      for (let i = 0; i < iterations; i++) {
        const key = `rapid-key-${i}`;
        const value = `rapid-value-${i}`;

        await storageHook.current.setItem(key, value);
        const retrieved = await storageHook.current.getItem(key, '');
        expect(retrieved).toBe(value);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      // Average operation should be fast (less than 1ms per operation)
      expect(avgTime).toBeLessThan(1);
    });

    it('should handle concurrent operations efficiently', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      const concurrentOperations = 100;
      const operations = Array.from({ length: concurrentOperations }, (_, i) => 
        storageHook.current.setItem(`concurrent-key-${i}`, `concurrent-value-${i}`)
      );

      const startTime = performance.now();

      // Execute all operations concurrently
      const results = await Promise.all(operations);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // All operations should succeed
      expect(results.every(success => success)).toBe(true);

      // Concurrent operations should be faster than sequential
      expect(duration).toBeLessThan(concurrentOperations * 10); // Less than 10ms per operation
    });
  });

  describe('Cache Performance', () => {
    it('should handle cache operations efficiently', async () => {
      const { result: cacheHook } = renderHook(() => 
        usePersistentCache('performance-cache')
      );

      const cacheOperations = 1000;
      const startTime = performance.now();

      // Rapid cache operations
      for (let i = 0; i < cacheOperations; i++) {
        const data = { id: i, value: `cache-value-${i}` };
        
        await cacheHook.current.setData(data);
        expect(cacheHook.current.data).toEqual(data);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / cacheOperations;

      // Cache operations should be very fast
      expect(avgTime).toBeLessThan(0.1); // Less than 0.1ms per operation
    });

    it('should handle TTL checks efficiently', async () => {
      const { result: cacheHook } = renderHook(() => 
        usePersistentCache('ttl-cache', { ttl: 60000 })
      );

      const data = { test: 'value' };
      await cacheHook.current.setData(data);

      const startTime = performance.now();

      // Check TTL many times (should be cached)
      for (let i = 0; i < 10000; i++) {
        // Access isExpired property
        const isExpired = cacheHook.current.isExpired;
        expect(isExpired).toBe(false);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // TTL checks should be extremely fast
      expect(duration).toBeLessThan(10); // Less than 10ms for 10,000 checks
    });
  });

  describe('State Performance', () => {
    it('should handle state updates efficiently', async () => {
      const { result: stateHook, waitForNextUpdate } = renderHook(() => 
        useStorageState('performance-state', 'initial')
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const stateUpdates = 1000;
      const startTime = performance.now();

      // Rapid state updates
      for (let i = 0; i < stateUpdates; i++) {
        await act(async () => {
          await stateHook.current[1](`update-${i}`);
        });
        expect(stateHook.current[0]).toBe(`update-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / stateUpdates;

      // State updates should be fast
      expect(avgTime).toBeLessThan(1); // Less than 1ms per update
    });

    it('should not re-render unnecessarily', async () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        const [state] = useStorageState('render-test', 'default');
        return null; // Don't render anything
      };

      const { rerender } = renderHook(() => <TestComponent />);

      const initialRenders = renderCount;

      // Rerender with same props
      rerender(<TestComponent />);

      // Should not cause additional renders
      expect(renderCount).toBe(initialRenders);
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create and destroy many objects
      for (let i = 0; i < 1000; i++) {
        const largeObject = {
          id: i,
          data: new Array(1000).fill(`data-${i}`),
          nested: {
            level1: { level2: { level3: new Array(100).fill(`nested-${i}`) } },
          },
        };

        await storageHook.current.setItem(`temp-${i}`, largeObject);
        await storageHook.current.removeItem(`temp-${i}`);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });

    it('should cleanup event listeners', () => {
      const memoryTracker = trackMemoryUsage();
      
      // Create and destroy many hooks
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useStorageState(`cleanup-${i}`, 'default'));
        unmount();
      }

      const listenerCount = memoryTracker.getListenerCount();
      expect(listenerCount).toBe(0);

      memoryTracker.cleanup();
    });
  });

  describe('Scalability Tests', () => {
    it('should handle many keys efficiently', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      const keyCount = 10000;
      const startTime = performance.now();

      // Create many keys
      for (let i = 0; i < keyCount; i++) {
        await storageHook.current.setItem(`scale-key-${i}`, `scale-value-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle many keys efficiently
      expect(duration).toBeLessThan(keyCount * 0.1); // Less than 0.1ms per key

      // Verify all keys exist
      for (let i = 0; i < keyCount; i++) {
        const exists = await storageHook.current.hasItem(`scale-key-${i}`);
        expect(exists).toBe(true);
      }
    });

    it('should handle large values efficiently', async () => {
      const { result: storageHook } = renderHook(() => useStorage());

      // Create very large value (1MB string)
      const largeValue = 'x'.repeat(1024 * 1024);
      const startTime = performance.now();

      const setSuccess = await storageHook.current.setItem('large-value', largeValue);
      expect(setSuccess).toBe(true);

      const retrievedValue = await storageHook.current.getString('large-value', '');
      expect(retrievedValue).toBe(largeValue);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Large values should be handled efficiently
      expect(duration).toBeLessThan(100); // Less than 100ms for 1MB
    });
  });
});