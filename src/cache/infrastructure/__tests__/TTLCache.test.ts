/**
 * TTLCache Tests
 */

import { TTLCache } from '../TTLCache';
import type { CacheConfig } from '../domain/types/Cache';

describe('TTLCache', () => {
  let cache: TTLCache<string>;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new TTLCache<string>({ 
      maxSize: 5, 
      defaultTTL: 1000,
      cleanupIntervalMs: 500 
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    cache.destroy();
  });

  describe('Basic Functionality', () => {
    test('should inherit from Cache', () => {
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('has');
      expect(cache).toHaveProperty('delete');
      expect(cache).toHaveProperty('clear');
    });

    test('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    test('should use default TTL', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(1001);
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should use custom TTL', () => {
      cache.set('key1', 'value1', 2000);
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(1001);
      expect(cache.get('key1')).toBe('value1'); // Should still exist

      jest.advanceTimersByTime(1000);
      expect(cache.get('key1')).toBeUndefined(); // Should be expired
    });
  });

  describe('Automatic Cleanup', () => {
    test('should start cleanup interval on creation', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      new TTLCache<string>({ cleanupIntervalMs: 1000 });
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
      setIntervalSpy.mockRestore();
    });

    test('should cleanup expired entries automatically', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      cache.set('key1', 'value1', 500);
      cache.set('key2', 'value2', 1500);
      
      // Fast forward to trigger first cleanup
      jest.advanceTimersByTime(500);
      
      // key1 should be cleaned up, key2 should remain
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      
      expect(consoleSpy).toHaveBeenCalledWith('TTLCache: Cleaned up 1 expired entries');
      
      consoleSpy.mockRestore();
    });

    test('should not log when no entries are cleaned up', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      cache.set('key1', 'value1', 2000);
      
      // Fast forward, but no entries should be expired yet
      jest.advanceTimersByTime(500);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle multiple cleanup cycles', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      cache.set('key1', 'value1', 300);
      cache.set('key2', 'value2', 800);
      cache.set('key3', 'value3', 1300);
      
      // First cleanup - key1 expires
      jest.advanceTimersByTime(500);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      
      // Second cleanup - key2 expires
      jest.advanceTimersByTime(500);
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      
      // Third cleanup - key3 expires
      jest.advanceTimersByTime(500);
      expect(cache.get('key3')).toBeUndefined();
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Destroy Method', () => {
    test('should clear cleanup interval on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      cache.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    test('should clear all data on destroy', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.getStats().size).toBe(2);
      
      cache.destroy();
      
      expect(cache.getStats().size).toBe(0);
    });

    test('should handle multiple destroy calls', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      cache.destroy();
      cache.destroy();
      cache.destroy();
      
      // Should only call clearInterval once
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
      
      clearIntervalSpy.mockRestore();
    });

    test('should not cleanup after destroy', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      cache.set('key1', 'value1', 300);
      
      cache.destroy();
      
      // Advance time - should not trigger cleanup
      jest.advanceTimersByTime(1000);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Destroyed State Handling', () => {
    beforeEach(() => {
      cache.destroy();
    });

    test('should warn on set after destroy', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      cache.set('key1', 'value1');
      
      expect(consoleSpy).toHaveBeenCalledWith('TTLCache: Attempted to set value on destroyed cache');
      expect(cache.get('key1')).toBeUndefined();
      
      consoleSpy.mockRestore();
    });

    test('should warn on get after destroy', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = cache.get('key1');
      
      expect(consoleSpy).toHaveBeenCalledWith('TTLCache: Attempted to get value from destroyed cache');
      expect(result).toBeUndefined();
      
      consoleSpy.mockRestore();
    });

    test('should return false for has after destroy', () => {
      expect(cache.has('key1')).toBe(false);
    });

    test('should return false for delete after destroy', () => {
      expect(cache.delete('key1')).toBe(false);
    });

    test('should not throw on clear after destroy', () => {
      expect(() => cache.clear()).not.toThrow();
    });
  });

  describe('Configuration', () => {
    test('should use custom cleanup interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      new TTLCache<string>({ cleanupIntervalMs: 2000 });
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
      setIntervalSpy.mockRestore();
    });

    test('should use default cleanup interval when not specified', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      new TTLCache<string>();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
      setIntervalSpy.mockRestore();
    });

    test('should pass configuration to parent Cache', () => {
      const config: CacheConfig = {
        maxSize: 10,
        defaultTTL: 5000,
      };
      
      const customCache = new TTLCache<string>(config);
      
      customCache.set('key1', 'value1');
      expect(customCache.get('key1')).toBe('value1');
      
      // Should use custom default TTL
      jest.advanceTimersByTime(5001);
      expect(customCache.get('key1')).toBeUndefined();
      
      customCache.destroy();
    });
  });

  describe('Memory Management', () => {
    test('should not memory leak with many entries', () => {
      const entryCount = 1000;
      
      // Create many entries with short TTL
      for (let i = 0; i < entryCount; i++) {
        cache.set(`key${i}`, `value${i}`, 100);
      }
      
      expect(cache.getStats().size).toBe(entryCount);
      
      // Let all entries expire and cleanup
      jest.advanceTimersByTime(500);
      
      expect(cache.getStats().size).toBe(0);
    });

    test('should handle rapid create/destroy cycles', () => {
      for (let i = 0; i < 10; i++) {
        const tempCache = new TTLCache<string>({ cleanupIntervalMs: 100 });
        tempCache.set('key', 'value');
        tempCache.destroy();
      }
      
      // Should not throw or cause issues
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero cleanup interval', () => {
      expect(() => {
        new TTLCache<string>({ cleanupIntervalMs: 0 });
      }).not.toThrow();
    });

    test('should handle negative cleanup interval', () => {
      expect(() => {
        new TTLCache<string>({ cleanupIntervalMs: -100 });
      }).not.toThrow();
    });

    test('should handle very large cleanup interval', () => {
      expect(() => {
        new TTLCache<string>({ cleanupIntervalMs: Number.MAX_SAFE_INTEGER });
      }).not.toThrow();
    });
  });
});