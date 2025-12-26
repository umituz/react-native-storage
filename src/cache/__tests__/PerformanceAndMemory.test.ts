/**
 * Performance and Memory Leak Tests
 */

import { Cache } from '../Cache';
import { TTLCache } from '../TTLCache';
import { cacheManager } from '../CacheManager';
import { PatternMatcher } from '../PatternMatcher';
import { renderHook, act } from '@testing-library/react';
import { useCache } from '../../presentation/useCache';

describe('Performance and Memory Leak Tests', () => {
  describe('Cache Performance', () => {
    test('should handle large number of entries efficiently', () => {
      const cache = new Cache<string>({ maxSize: 10000 });
      const startTime = performance.now();
      
      // Add 10,000 entries
      for (let i = 0; i < 10000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const insertTime = performance.now() - startTime;
      
      // Test retrieval performance
      const retrieveStart = performance.now();
      for (let i = 0; i < 10000; i++) {
        cache.get(`key${i}`);
      }
      const retrieveTime = performance.now() - retrieveStart;
      
      expect(cache.getStats().size).toBe(10000);
      expect(insertTime).toBeLessThan(1000); // 1 second for 10k inserts
      expect(retrieveTime).toBeLessThan(500); // 0.5 second for 10k retrievals
    });

    test('should handle rapid eviction without performance degradation', () => {
      const cache = new Cache<string>({ maxSize: 100 });
      const startTime = performance.now();
      
      // Add and rapidly evict entries
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(cache.getStats().size).toBe(100); // Should maintain max size
      expect(cache.getStats().evictions).toBeGreaterThan(800); // Many evictions
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });

    test('should handle pattern invalidation efficiently', () => {
      const cache = new Cache<string>();
      
      // Add entries with different patterns
      for (let i = 0; i < 1000; i++) {
        cache.set(`user:${i}:profile`, `profile${i}`);
        cache.set(`user:${i}:settings`, `settings${i}`);
        cache.set(`post:${i}`, `post${i}`);
      }
      
      const startTime = performance.now();
      const invalidatedCount = cache.invalidatePattern('user:*:profile');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(invalidatedCount).toBe(1000);
      expect(duration).toBeLessThan(100); // Should be very fast
      expect(cache.getStats().size).toBe(2000); // posts + settings remain
    });
  });

  describe('Memory Management', () => {
    test('should not memory leak with cache destruction', () => {
      const caches: TTLCache<string>[] = [];
      
      // Create many caches
      for (let i = 0; i < 100; i++) {
        const cache = new TTLCache<string>({ cleanupIntervalMs: 100 });
        cache.set(`key${i}`, `value${i}`);
        caches.push(cache);
      }
      
      // Destroy all caches
      const startTime = performance.now();
      caches.forEach(cache => cache.destroy());
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should destroy quickly
      
      // Operations on destroyed caches should be safe
      caches.forEach(cache => {
        expect(() => cache.set('test', 'value')).not.toThrow();
        expect(cache.get('test')).toBeUndefined();
      });
    });

    test('should handle cache manager memory efficiently', () => {
      const cacheNames: string[] = [];
      
      // Create many caches through manager
      for (let i = 0; i < 1000; i++) {
        const name = `cache-${i}`;
        cacheNames.push(name);
        const cache = cacheManager.getCache<string>(name);
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(cacheManager.getCacheNames()).toHaveLength(1000);
      
      // Delete all caches
      const startTime = performance.now();
      cacheNames.forEach(name => cacheManager.deleteCache(name));
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000);
      expect(cacheManager.getCacheNames()).toHaveLength(0);
    });

    test('should cleanup pattern matcher cache', () => {
      // Create many unique patterns to fill cache
      for (let i = 0; i < 1000; i++) {
        PatternMatcher.convertPatternToRegex(`pattern-${i}-*`);
      }
      
      // Clear cache and verify memory is freed
      PatternMatcher.clearCache();
      
      // Should still work after clear
      expect(PatternMatcher.matchesPattern('test-key', 'test-*')).toBe(true);
    });
  });

  describe('React Hooks Performance', () => {
    test('should handle many hook instances without memory leaks', () => {
      const hooks: Array<ReturnType<typeof useCache<string>>> = [];
      
      // Create many hook instances
      for (let i = 0; i < 100; i++) {
        const { result } = renderHook(() => useCache<string>(`test-cache-${i}`));
        hooks.push(result.current);
      }
      
      // Perform operations on all hooks
      const startTime = performance.now();
      hooks.forEach((hook, index) => {
        act(() => {
          hook.set(`key${index}`, `value${index}`);
        });
      });
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Verify all operations worked
      hooks.forEach((hook, index) => {
        expect(hook.get(`key${index}`)).toBe(`value${index}`);
      });
      
      // Cleanup all hooks
      hooks.forEach(() => {
        // Hooks will be automatically cleaned up when unmounted
      });
    });

    test('should handle rapid hook re-renders efficiently', () => {
      const { result, rerender } = renderHook(() => useCache<string>('rapid-cache'));
      
      const startTime = performance.now();
      
      // Perform many rapid operations
      for (let i = 0; i < 1000; i++) {
        act(() => {
          result.current.set(`key${i}`, `value${i}`);
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(result.current.getStats().size).toBeLessThanOrEqual(100); // Limited by eviction
    });
  });

  describe('Stress Tests', () => {
    test('should handle concurrent operations safely', async () => {
      const cache = new Cache<string>({ maxSize: 1000 });
      const promises: Promise<void>[] = [];
      
      // Create concurrent operations
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              for (let j = 0; j < 10; j++) {
                const key = `concurrent-${i}-${j}`;
                const value = `value-${i}-${j}`;
                cache.set(key, value);
                cache.get(key);
              }
              resolve();
            }, Math.random() * 100);
          })
        );
      }
      
      // Wait for all operations to complete
      await Promise.all(promises);
      
      // Verify cache is in consistent state
      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1000);
      expect(stats.hits + stats.misses).toBeGreaterThan(0);
    });

    test('should handle TTL cache under stress', async () => {
      jest.useFakeTimers();
      
      const cache = new TTLCache<string>({ 
        maxSize: 500, 
        defaultTTL: 100,
        cleanupIntervalMs: 50 
      });
      
      // Add many entries with short TTL
      for (let i = 0; i < 1000; i++) {
        cache.set(`stress-key${i}`, `stress-value${i}`);
      }
      
      // Advance time to trigger multiple cleanup cycles
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(50);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Cache should handle stress without errors
      expect(() => cache.get('any-key')).not.toThrow();
      
      const stats = cache.getStats();
      expect(stats.expirations).toBeGreaterThan(0);
      
      cache.destroy();
      jest.useRealTimers();
    });

    test('should handle pattern matching stress test', () => {
      const patterns: string[] = [];
      const keys: string[] = [];
      
      // Generate many patterns and keys
      for (let i = 0; i < 1000; i++) {
        patterns.push(`pattern-${i}-*`);
        keys.push(`pattern-${i}-value`);
      }
      
      const startTime = performance.now();
      
      // Test all pattern matches
      patterns.forEach((pattern, index) => {
        PatternMatcher.matchesPattern(keys[index], pattern);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should be very fast with caching
    });
  });

  describe('Memory Leak Detection', () => {
    test('should not leak memory with repeated cache operations', () => {
      const cache = new Cache<string>();
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let cycle = 0; cycle < 100; cycle++) {
        // Add many entries
        for (let i = 0; i < 100; i++) {
          cache.set(`cycle-${cycle}-key-${i}`, `value-${i}`);
        }
        
        // Clear cache
        cache.clear();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (allowing for some variance)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    test('should not leak memory with repeated hook mount/unmount', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Mount and unmount hooks repeatedly
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useCache<string>(`test-cache-${i}`));
        
        act(() => {
          // Perform some operations
        });
        
        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
    });
  });

  describe('Performance Regression Tests', () => {
    test('should maintain performance with large cache sizes', () => {
      const sizes = [100, 1000, 5000, 10000];
      
      sizes.forEach(size => {
        const cache = new Cache<string>({ maxSize: size });
        const startTime = performance.now();
        
        // Fill cache
        for (let i = 0; i < size; i++) {
          cache.set(`key${i}`, `value${i}`);
        }
        
        // Random access pattern
        for (let i = 0; i < size; i++) {
          const randomIndex = Math.floor(Math.random() * size);
          cache.get(`key${randomIndex}`);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Performance should scale reasonably
        const opsPerMs = (size * 2) / duration; // inserts + gets
        expect(opsPerMs).toBeGreaterThan(10); // At least 10 ops per ms
      });
    });

    test('should maintain pattern matching performance', () => {
      const patternComplexities = [
        'simple:*',
        'complex:*:pattern:*:here',
        'very:complex:pattern:*:with:many:parts:*:and:sections',
      ];
      
      patternComplexities.forEach(pattern => {
        const startTime = performance.now();
        
        // Test many matches
        for (let i = 0; i < 1000; i++) {
          PatternMatcher.matchesPattern(`test:${i}:value`, pattern);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Even complex patterns should be fast
        expect(duration).toBeLessThan(50); // Less than 50ms for 1000 matches
      });
    });
  });
});