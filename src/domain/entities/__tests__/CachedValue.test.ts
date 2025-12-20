/**
 * CachedValue Entity Tests
 *
 * Unit tests for CachedValue entity
 */

import { 
  createCachedValue, 
  isCacheExpired, 
  getRemainingTTL, 
  getCacheAge 
} from '../../domain/entities/CachedValue';

describe('CachedValue Entity', () => {
  const mockNow = 1000000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCachedValue', () => {
    it('should create cached value with default values', () => {
      const data = { test: 'value' };
      const cached = createCachedValue(data);

      expect(cached.value).toBe(data);
      expect(cached.timestamp).toBe(mockNow);
      expect(cached.ttl).toBeDefined();
      expect(cached.version).toBeUndefined();
    });

    it('should create cached value with custom TTL', () => {
      const data = { test: 'value' };
      const ttl = 60000; // 1 minute
      const cached = createCachedValue(data, ttl);

      expect(cached.value).toBe(data);
      expect(cached.timestamp).toBe(mockNow);
      expect(cached.ttl).toBe(ttl);
    });

    it('should create cached value with version', () => {
      const data = { test: 'value' };
      const version = 2;
      const cached = createCachedValue(data, undefined, version);

      expect(cached.value).toBe(data);
      expect(cached.timestamp).toBe(mockNow);
      expect(cached.version).toBe(version);
    });
  });

  describe('isCacheExpired', () => {
    it('should return false for fresh cache', () => {
      const data = { test: 'value' };
      const ttl = 60000; // 1 minute
      const cached = createCachedValue(data, ttl);

      expect(isCacheExpired(cached)).toBe(false);
    });

    it('should return true for expired cache', () => {
      const data = { test: 'value' };
      const ttl = 1000; // 1 second
      const cached = createCachedValue(data, ttl, mockNow - 2000); // Created 2 seconds ago

      expect(isCacheExpired(cached)).toBe(true);
    });

    it('should handle version mismatch', () => {
      const data = { test: 'value' };
      const cached = createCachedValue(data, 60000, 1);
      const currentVersion = 2;

      expect(isCacheExpired(cached, currentVersion)).toBe(true);
    });

    it('should return false when version matches', () => {
      const data = { test: 'value' };
      const cached = createCachedValue(data, 60000, 1);
      const currentVersion = 1;

      expect(isCacheExpired(cached, currentVersion)).toBe(false);
    });
  });

  describe('getRemainingTTL', () => {
    it('should return remaining TTL for fresh cache', () => {
      const data = { test: 'value' };
      const ttl = 60000; // 1 minute
      const cached = createCachedValue(data, ttl, mockNow - 30000); // Created 30 seconds ago

      const remaining = getRemainingTTL(cached);
      expect(remaining).toBe(30000); // 30 seconds remaining
    });

    it('should return 0 for expired cache', () => {
      const data = { test: 'value' };
      const ttl = 1000; // 1 second
      const cached = createCachedValue(data, ttl, mockNow - 2000); // Created 2 seconds ago

      const remaining = getRemainingTTL(cached);
      expect(remaining).toBe(0);
    });

    it('should handle missing TTL', () => {
      const data = { test: 'value' };
      const cached = createCachedValue(data);

      const remaining = getRemainingTTL(cached);
      expect(remaining).toBeGreaterThan(0);
    });
  });

  describe('getCacheAge', () => {
    it('should return correct age', () => {
      const data = { test: 'value' };
      const age = 30000; // 30 seconds
      const cached = createCachedValue(data, undefined, undefined, mockNow - age);

      const cacheAge = getCacheAge(cached);
      expect(cacheAge).toBe(age);
    });

    it('should return 0 for new cache', () => {
      const data = { test: 'value' };
      const cached = createCachedValue(data);

      const cacheAge = getCacheAge(cached);
      expect(cacheAge).toBe(0);
    });
  });

  describe('Immutability', () => {
    it('should create immutable cached value', () => {
      const data = { test: 'value' };
      const cached = createCachedValue(data);

      // Attempt to modify
      (cached as any).value = { modified: true };

      expect(cached.value).toEqual(data);
    });
  });
});