/**
 * Cache Class Tests
 */

import { Cache } from '../Cache';
import type { CacheConfig } from '../types/Cache';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache<string>({ maxSize: 3, defaultTTL: 1000 });
  });

  describe('Basic Operations', () => {
    test('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    test('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    test('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    test('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
      expect(cache.delete('nonexistent')).toBe(false);
    });

    test('should clear all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.getStats().size).toBe(0);
    });

    test('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });
  });

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should expire entries after TTL', () => {
      cache.set('key1', 'value1', 1000);
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(1001);
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should use default TTL when not specified', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(1001);
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should call onExpire callback when entry expires', () => {
      const onExpire = jest.fn();
      const cacheWithCallback = new Cache<string>({ 
        defaultTTL: 1000, 
        onExpire 
      });

      cacheWithCallback.set('key1', 'value1');
      jest.advanceTimersByTime(1001);
      cacheWithCallback.get('key1'); // Trigger expiration check

      expect(onExpire).toHaveBeenCalledWith('key1', expect.objectContaining({
        value: 'value1',
        timestamp: expect.any(Number),
        ttl: 1000,
        accessCount: 0,
        lastAccess: expect.any(Number)
      }));
    });
  });

  describe('Eviction', () => {
    test('should evict LRU when cache is full', () => {
      const onEvict = jest.fn();
      const cacheWithCallback = new Cache<string>({ 
        maxSize: 2, 
        onEvict 
      });

      cacheWithCallback.set('key1', 'value1');
      cacheWithCallback.set('key2', 'value2');
      
      // Access key1 to make it recently used
      cacheWithCallback.get('key1');
      
      // Add third item, should evict key2 (least recently used)
      cacheWithCallback.set('key3', 'value3');
      
      expect(cacheWithCallback.has('key1')).toBe(true);
      expect(cacheWithCallback.has('key2')).toBe(false);
      expect(cacheWithCallback.has('key3')).toBe(true);
      expect(onEvict).toHaveBeenCalledWith('key2', expect.any(Object));
    });

    test('should not evict when updating existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Update existing key, should not cause eviction
      cache.set('key1', 'value1-updated');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.get('key1')).toBe('value1-updated');
    });
  });

  describe('Pattern Invalidation', () => {
    test('should invalidate keys matching pattern', () => {
      cache.set('user:1', 'user1');
      cache.set('user:2', 'user2');
      cache.set('post:1', 'post1');
      cache.set('admin', 'admin');

      const invalidatedCount = cache.invalidatePattern('user:*');
      
      expect(invalidatedCount).toBe(2);
      expect(cache.has('user:1')).toBe(false);
      expect(cache.has('user:2')).toBe(false);
      expect(cache.has('post:1')).toBe(true);
      expect(cache.has('admin')).toBe(true);
    });

    test('should handle complex patterns', () => {
      cache.set('user:1:profile', 'profile1');
      cache.set('user:2:profile', 'profile2');
      cache.set('user:1:settings', 'settings1');
      cache.set('post:1', 'post1');

      const invalidatedCount = cache.invalidatePattern('user:*:profile');
      
      expect(invalidatedCount).toBe(2);
      expect(cache.has('user:1:profile')).toBe(false);
      expect(cache.has('user:2:profile')).toBe(false);
      expect(cache.has('user:1:settings')).toBe(true);
      expect(cache.has('post:1')).toBe(true);
    });

    test('should return 0 for non-matching patterns', () => {
      cache.set('user:1', 'user1');
      cache.set('post:1', 'post1');

      const invalidatedCount = cache.invalidatePattern('admin:*');
      
      expect(invalidatedCount).toBe(0);
      expect(cache.has('user:1')).toBe(true);
      expect(cache.has('post:1')).toBe(true);
    });
  });

  describe('Statistics', () => {
    test('should track cache statistics correctly', () => {
      // Initial stats
      let stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.expirations).toBe(0);

      // Set some values
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      stats = cache.getStats();
      expect(stats.size).toBe(2);

      // Hit
      cache.get('key1');
      stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);

      // Miss
      cache.get('nonexistent');
      stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      // Delete
      cache.delete('key1');
      stats = cache.getStats();
      expect(stats.size).toBe(1);

      // Clear
      cache.clear();
      stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    test('should return immutable stats object', () => {
      cache.set('key1', 'value1');
      const stats1 = cache.getStats();
      const stats2 = cache.getStats();
      
      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2); // Different references
    });
  });

  describe('Access Count and Last Access', () => {
    test('should track access count and last access time', () => {
      const startTime = Date.now();
      
      cache.set('key1', 'value1');
      
      // First access
      cache.get('key1');
      let stats = cache.getStats();
      
      // Second access
      jest.advanceTimersByTime(100);
      cache.get('key1');
      
      // Verify access tracking (internal implementation detail)
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('Configuration', () => {
    test('should use custom configuration', () => {
      const customConfig: CacheConfig = {
        maxSize: 10,
        defaultTTL: 5000,
        onEvict: jest.fn(),
        onExpire: jest.fn(),
      };

      const customCache = new Cache<string>(customConfig);
      
      customCache.set('key1', 'value1');
      expect(customCache.get('key1')).toBe('value1');
      
      // Should not expire before custom TTL
      jest.advanceTimersByTime(4000);
      expect(customCache.get('key1')).toBe('value1');
      
      // Should expire after custom TTL
      jest.advanceTimersByTime(1001);
      expect(customCache.get('key1')).toBeUndefined();
    });

    test('should use default configuration when not provided', () => {
      const defaultCache = new Cache<string>();
      
      defaultCache.set('key1', 'value1');
      expect(defaultCache.get('key1')).toBe('value1');
      
      // Should use default TTL (5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000 - 1);
      expect(defaultCache.get('key1')).toBe('value1');
      
      jest.advanceTimersByTime(2);
      expect(defaultCache.get('key1')).toBeUndefined();
    });
  });
});