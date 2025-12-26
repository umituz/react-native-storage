/**
 * Eviction Strategies Tests
 */

import { LRUStrategy } from '../LRUStrategy';
import { LFUStrategy } from '../LFUStrategy';
import { FIFOStrategy } from '../FIFOStrategy';
import { TTLStrategy } from '../TTLStrategy';
import type { CacheEntry } from '../../types/Cache';

describe('Eviction Strategies', () => {
  const createMockEntries = (): Map<string, CacheEntry<string>> => {
    const entries = new Map<string, CacheEntry<string>>();
    const now = Date.now();
    
    entries.set('key1', {
      value: 'value1',
      timestamp: now - 1000,
      ttl: 5000,
      accessCount: 5,
      lastAccess: now - 500,
    });
    
    entries.set('key2', {
      value: 'value2',
      timestamp: now - 2000,
      ttl: 5000,
      accessCount: 3,
      lastAccess: now - 100,
    });
    
    entries.set('key3', {
      value: 'value3',
      timestamp: now - 3000,
      ttl: 5000,
      accessCount: 10,
      lastAccess: now - 1500,
    });
    
    return entries;
  };

  describe('LRUStrategy', () => {
    let strategy: LRUStrategy<string>;

    beforeEach(() => {
      strategy = new LRUStrategy<string>();
    });

    test('should evict least recently used key', () => {
      const entries = createMockEntries();
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      // key3 has the oldest lastAccess time
      expect(keyToEvict).toBe('key3');
    });

    test('should return undefined for empty entries', () => {
      const entries = new Map<string, CacheEntry<string>>();
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      expect(keyToEvict).toBeUndefined();
    });

    test('should handle single entry', () => {
      const entries = new Map<string, CacheEntry<string>>();
      entries.set('key1', {
        value: 'value1',
        timestamp: Date.now(),
        ttl: 5000,
        accessCount: 1,
        lastAccess: Date.now(),
      });
      
      const keyToEvict = strategy.findKeyToEvict(entries);
      expect(keyToEvict).toBe('key1');
    });
  });

  describe('LFUStrategy', () => {
    let strategy: LFUStrategy<string>;

    beforeEach(() => {
      strategy = new LFUStrategy<string>();
    });

    test('should evict least frequently used key', () => {
      const entries = createMockEntries();
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      // key2 has the lowest access count (3)
      expect(keyToEvict).toBe('key2');
    });

    test('should return undefined for empty entries', () => {
      const entries = new Map<string, CacheEntry<string>>();
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      expect(keyToEvict).toBeUndefined();
    });

    test('should handle ties by choosing first encountered', () => {
      const entries = new Map<string, CacheEntry<string>>();
      const now = Date.now();
      
      entries.set('key1', {
        value: 'value1',
        timestamp: now,
        ttl: 5000,
        accessCount: 2,
        lastAccess: now,
      });
      
      entries.set('key2', {
        value: 'value2',
        timestamp: now,
        ttl: 5000,
        accessCount: 2,
        lastAccess: now,
      });
      
      const keyToEvict = strategy.findKeyToEvict(entries);
      // Should return the first key with lowest count
      expect(keyToEvict).toBe('key1');
    });
  });

  describe('FIFOStrategy', () => {
    let strategy: FIFOStrategy<string>;

    beforeEach(() => {
      strategy = new FIFOStrategy<string>();
    });

    test('should evict first inserted key', () => {
      const entries = createMockEntries();
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      // Map preserves insertion order, so first key should be evicted
      expect(keyToEvict).toBe('key1');
    });

    test('should return undefined for empty entries', () => {
      const entries = new Map<string, CacheEntry<string>>();
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      expect(keyToEvict).toBeUndefined();
    });

    test('should handle single entry', () => {
      const entries = new Map<string, CacheEntry<string>>();
      entries.set('onlyKey', {
        value: 'value',
        timestamp: Date.now(),
        ttl: 5000,
        accessCount: 1,
        lastAccess: Date.now(),
      });
      
      const keyToEvict = strategy.findKeyToEvict(entries);
      expect(keyToEvict).toBe('onlyKey');
    });
  });

  describe('TTLStrategy', () => {
    let strategy: TTLStrategy<string>;

    beforeEach(() => {
      strategy = new TTLStrategy<string>();
    });

    test('should evict key with nearest expiry', () => {
      const now = Date.now();
      const entries = new Map<string, CacheEntry<string>>();
      
      entries.set('key1', {
        value: 'value1',
        timestamp: now - 1000,
        ttl: 2000, // Expires at now + 1000
        accessCount: 1,
        lastAccess: now,
      });
      
      entries.set('key2', {
        value: 'value2',
        timestamp: now - 500,
        ttl: 1000, // Expires at now + 500
        accessCount: 1,
        lastAccess: now,
      });
      
      entries.set('key3', {
        value: 'value3',
        timestamp: now - 2000,
        ttl: 3000, // Expires at now + 1000
        accessCount: 1,
        lastAccess: now,
      });
      
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      // key2 expires soonest (now + 500)
      expect(keyToEvict).toBe('key2');
    });

    test('should return undefined for empty entries', () => {
      const entries = new Map<string, CacheEntry<string>>();
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      expect(keyToEvict).toBeUndefined();
    });

    test('should handle already expired entries', () => {
      const now = Date.now();
      const entries = new Map<string, CacheEntry<string>>();
      
      entries.set('key1', {
        value: 'value1',
        timestamp: now - 2000,
        ttl: 1000, // Already expired
        accessCount: 1,
        lastAccess: now,
      });
      
      entries.set('key2', {
        value: 'value2',
        timestamp: now - 1000,
        ttl: 2000, // Expires at now + 1000
        accessCount: 1,
        lastAccess: now,
      });
      
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      // key1 is already expired, should be evicted first
      expect(keyToEvict).toBe('key1');
    });

    test('should handle ties by choosing first encountered', () => {
      const now = Date.now();
      const entries = new Map<string, CacheEntry<string>>();
      
      entries.set('key1', {
        value: 'value1',
        timestamp: now - 1000,
        ttl: 2000, // Both expire at now + 1000
        accessCount: 1,
        lastAccess: now,
      });
      
      entries.set('key2', {
        value: 'value2',
        timestamp: now - 1000,
        ttl: 2000, // Both expire at now + 1000
        accessCount: 1,
        lastAccess: now,
      });
      
      const keyToEvict = strategy.findKeyToEvict(entries);
      
      // Should return the first key with nearest expiry
      expect(keyToEvict).toBe('key1');
    });
  });

  describe('Strategy Integration', () => {
    test('all strategies should handle different data types', () => {
      const numberStrategy = new LRUStrategy<number>();
      const objectStrategy = new LRUStrategy<{ id: string }>();
      
      const numberEntries = new Map<string, CacheEntry<number>>();
      numberEntries.set('num1', {
        value: 42,
        timestamp: Date.now(),
        ttl: 5000,
        accessCount: 1,
        lastAccess: Date.now(),
      });
      
      const objectEntries = new Map<string, CacheEntry<{ id: string }>>();
      objectEntries.set('obj1', {
        value: { id: 'test' },
        timestamp: Date.now(),
        ttl: 5000,
        accessCount: 1,
        lastAccess: Date.now(),
      });
      
      expect(numberStrategy.findKeyToEvict(numberEntries)).toBe('num1');
      expect(objectStrategy.findKeyToEvict(objectEntries)).toBe('obj1');
    });
  });
});