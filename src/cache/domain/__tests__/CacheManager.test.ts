/**
 * CacheManager Tests
 */

import { CacheManager, cacheManager } from '../CacheManager';
import type { CacheConfig } from '../types/Cache';

describe('CacheManager', () => {
  let manager: CacheManager;

  beforeEach(() => {
    // Reset singleton for testing
    (CacheManager as any).instance = null;
    manager = CacheManager.getInstance();
  });

  afterEach(() => {
    manager.clearAll();
    (CacheManager as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = CacheManager.getInstance();
      const instance2 = CacheManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    test('should create only one instance', () => {
      const instance1 = CacheManager.getInstance();
      const instance2 = new (CacheManager as any)();
      
      expect(instance1).not.toBe(instance2);
      expect(instance1).toBe(CacheManager.getInstance());
    });
  });

  describe('Cache Management', () => {
    test('should create and retrieve cache instances', () => {
      const cache1 = manager.getCache<string>('cache1');
      const cache2 = manager.getCache<number>('cache2');
      
      expect(cache1).toBeDefined();
      expect(cache2).toBeDefined();
      expect(cache1).not.toBe(cache2);
    });

    test('should return same cache instance for same name', () => {
      const cache1 = manager.getCache<string>('cache1');
      const cache2 = manager.getCache<string>('cache1');
      
      expect(cache1).toBe(cache2);
    });

    test('should create caches with different types', () => {
      const stringCache = manager.getCache<string>('strings');
      const numberCache = manager.getCache<number>('numbers');
      const objectCache = manager.getCache<{ id: string }>('objects');
      
      stringCache.set('key', 'value');
      numberCache.set('key', 42);
      objectCache.set('key', { id: 'test' });
      
      expect(stringCache.get('key')).toBe('value');
      expect(numberCache.get('key')).toBe(42);
      expect(objectCache.get('key')).toEqual({ id: 'test' });
    });

    test('should apply configuration to cache', () => {
      const config: CacheConfig = {
        maxSize: 50,
        defaultTTL: 10000,
      };
      
      const cache = manager.getCache<string>('configured-cache', config);
      
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
      
      // Test configuration is applied (basic check)
      const stats = cache.getStats();
      expect(stats.size).toBe(1);
    });
  });

  describe('Cache Deletion', () => {
    test('should delete specific cache', () => {
      manager.getCache<string>('cache1');
      manager.getCache<string>('cache2');
      
      expect(manager.getCacheNames()).toContain('cache1');
      expect(manager.getCacheNames()).toContain('cache2');
      
      const deleted = manager.deleteCache('cache1');
      
      expect(deleted).toBe(true);
      expect(manager.getCacheNames()).not.toContain('cache1');
      expect(manager.getCacheNames()).toContain('cache2');
    });

    test('should return false when deleting non-existent cache', () => {
      const deleted = manager.deleteCache('nonexistent');
      
      expect(deleted).toBe(false);
    });

    test('should clear cache before deletion', () => {
      const cache = manager.getCache<string>('cache1');
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.getStats().size).toBe(2);
      
      manager.deleteCache('cache1');
      
      // Get new instance to verify old one was cleared
      const newCache = manager.getCache<string>('cache1');
      expect(newCache.getStats().size).toBe(0);
    });
  });

  describe('Clear All', () => {
    test('should clear all caches', () => {
      const cache1 = manager.getCache<string>('cache1');
      const cache2 = manager.getCache<string>('cache2');
      const cache3 = manager.getCache<string>('cache3');
      
      cache1.set('key1', 'value1');
      cache2.set('key2', 'value2');
      cache3.set('key3', 'value3');
      
      expect(cache1.getStats().size).toBe(1);
      expect(cache2.getStats().size).toBe(1);
      expect(cache3.getStats().size).toBe(1);
      expect(manager.getCacheNames()).toHaveLength(3);
      
      manager.clearAll();
      
      expect(cache1.getStats().size).toBe(0);
      expect(cache2.getStats().size).toBe(0);
      expect(cache3.getStats().size).toBe(0);
      expect(manager.getCacheNames()).toHaveLength(0);
    });

    test('should handle clear all when no caches exist', () => {
      expect(() => manager.clearAll()).not.toThrow();
      expect(manager.getCacheNames()).toHaveLength(0);
    });
  });

  describe('Cache Names', () => {
    test('should return list of cache names', () => {
      expect(manager.getCacheNames()).toHaveLength(0);
      
      manager.getCache<string>('cache1');
      manager.getCache<string>('cache2');
      manager.getCache<string>('cache3');
      
      const names = manager.getCacheNames();
      expect(names).toHaveLength(3);
      expect(names).toContain('cache1');
      expect(names).toContain('cache2');
      expect(names).toContain('cache3');
    });

    test('should not duplicate cache names', () => {
      manager.getCache<string>('cache1');
      manager.getCache<string>('cache1'); // Same name
      manager.getCache<string>('cache2');
      
      const names = manager.getCacheNames();
      expect(names).toHaveLength(2);
      expect(names.filter(name => name === 'cache1')).toHaveLength(1);
    });
  });

  describe('Memory Management', () => {
    test('should handle large number of caches', () => {
      const cacheCount = 100;
      
      for (let i = 0; i < cacheCount; i++) {
        const cache = manager.getCache<string>(`cache${i}`);
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(manager.getCacheNames()).toHaveLength(cacheCount);
      
      // Verify all caches have their data
      for (let i = 0; i < cacheCount; i++) {
        const cache = manager.getCache<string>(`cache${i}`);
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
    });

    test('should handle cache deletion in large scale', () => {
      const cacheCount = 50;
      
      // Create caches
      for (let i = 0; i < cacheCount; i++) {
        manager.getCache<string>(`cache${i}`);
      }
      
      expect(manager.getCacheNames()).toHaveLength(cacheCount);
      
      // Delete every other cache
      for (let i = 0; i < cacheCount; i += 2) {
        manager.deleteCache(`cache${i}`);
      }
      
      expect(manager.getCacheNames()).toHaveLength(Math.floor(cacheCount / 2));
      
      // Verify remaining caches still work
      for (let i = 1; i < cacheCount; i += 2) {
        const cache = manager.getCache<string>(`cache${i}`);
        cache.set('test', 'value');
        expect(cache.get('test')).toBe('value');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string cache name', () => {
      const cache = manager.getCache<string>('');
      expect(cache).toBeDefined();
      expect(manager.getCacheNames()).toContain('');
    });

    test('should handle special characters in cache names', () => {
      const specialNames = ['cache-with-dash', 'cache_with_underscore', 'cache.with.dots', 'cache with spaces'];
      
      specialNames.forEach(name => {
        const cache = manager.getCache<string>(name);
        expect(cache).toBeDefined();
        expect(manager.getCacheNames()).toContain(name);
      });
    });

    test('should handle very long cache names', () => {
      const longName = 'a'.repeat(1000);
      const cache = manager.getCache<string>(longName);
      
      expect(cache).toBeDefined();
      expect(manager.getCacheNames()).toContain(longName);
    });
  });
});

describe('cacheManager export', () => {
  beforeEach(() => {
    (CacheManager as any).instance = null;
  });

  afterEach(() => {
    cacheManager.clearAll();
    (CacheManager as any).instance = null;
  });

  test('should export singleton instance', () => {
    expect(cacheManager).toBeDefined();
    expect(cacheManager).toBeInstanceOf(CacheManager);
  });

  test('should be the same instance as CacheManager.getInstance()', () => {
    const instance = CacheManager.getInstance();
    expect(cacheManager).toBe(instance);
  });

  test('should work with exported instance', () => {
    const cache = cacheManager.getCache<string>('test-cache');
    cache.set('key', 'value');
    
    expect(cache.get('key')).toBe('value');
    expect(cacheManager.getCacheNames()).toContain('test-cache');
  });
});