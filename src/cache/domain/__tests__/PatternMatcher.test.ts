/**
 * PatternMatcher Tests
 */

import { PatternMatcher } from '../PatternMatcher';

describe('PatternMatcher', () => {
  beforeEach(() => {
    PatternMatcher.clearCache();
  });

  describe('convertPatternToRegex', () => {
    test('should handle simple patterns', () => {
      const regex = PatternMatcher.convertPatternToRegex('user:*');
      expect(regex.test('user:1')).toBe(true);
      expect(regex.test('user:123')).toBe(true);
      expect(regex.test('user:abc')).toBe(true);
      expect(regex.test('admin:1')).toBe(false);
    });

    test('should handle multiple wildcards', () => {
      const regex = PatternMatcher.convertPatternToRegex('*:*:*');
      expect(regex.test('user:1:profile')).toBe(true);
      expect(regex.test('post:2:comments')).toBe(true);
      expect(regex.test('user:1')).toBe(false);
      expect(regex.test('user')).toBe(false);
    });

    test('should handle exact matches', () => {
      const regex = PatternMatcher.convertPatternToRegex('exact-key');
      expect(regex.test('exact-key')).toBe(true);
      expect(regex.test('exact-key-123')).toBe(false);
      expect(regex.test('exact')).toBe(false);
    });

    test('should handle patterns with special characters', () => {
      const regex = PatternMatcher.convertPatternToRegex('user.*profile');
      expect(regex.test('user.123.profile')).toBe(true);
      expect(regex.test('user.abc.profile')).toBe(true);
      expect(regex.test('user.profile')).toBe(false);
    });

    test('should escape regex special characters', () => {
      const regex = PatternMatcher.convertPatternToRegex('user.+?^${}()|[]\\');
      expect(regex.test('user.+?^${}()|[]\\')).toBe(true);
      expect(regex.test('user-something')).toBe(false);
    });

    test('should handle empty pattern', () => {
      const regex = PatternMatcher.convertPatternToRegex('');
      expect(regex.test('')).toBe(true);
      expect(regex.test('anything')).toBe(false);
    });

    test('should handle pattern with only wildcards', () => {
      const regex = PatternMatcher.convertPatternToRegex('*');
      expect(regex.test('anything')).toBe(true);
      expect(regex.test('')).toBe(true);
    });

    test('should handle complex patterns', () => {
      const regex = PatternMatcher.convertPatternToRegex('cache:*:data:*');
      expect(regex.test('cache:user:data:123')).toBe(true);
      expect(regex.test('cache:post:data:456')).toBe(true);
      expect(regex.test('cache:user:meta:123')).toBe(false);
      expect(regex.test('user:data:123')).toBe(false);
    });

    test('should handle patterns with dots and dashes', () => {
      const regex = PatternMatcher.convertPatternToRegex('module.*-service.*');
      expect(regex.test('module.auth-service.v1')).toBe(true);
      expect(regex.test('module.user-service.v2')).toBe(true);
      expect(regex.test('module.auth')).toBe(false);
    });
  });

  describe('matchesPattern', () => {
    test('should return true for matching patterns', () => {
      expect(PatternMatcher.matchesPattern('user:1', 'user:*')).toBe(true);
      expect(PatternMatcher.matchesPattern('post:123:comments', '*:*:*')).toBe(true);
      expect(PatternMatcher.matchesPattern('exact', 'exact')).toBe(true);
    });

    test('should return false for non-matching patterns', () => {
      expect(PatternMatcher.matchesPattern('admin:1', 'user:*')).toBe(false);
      expect(PatternMatcher.matchesPattern('user:1', '*:*:*')).toBe(false);
      expect(PatternMatcher.matchesPattern('exact', 'different')).toBe(false);
    });

    test('should handle case-sensitive matching', () => {
      expect(PatternMatcher.matchesPattern('User:1', 'user:*')).toBe(false);
      expect(PatternMatcher.matchesPattern('user:1', 'User:*')).toBe(false);
      expect(PatternMatcher.matchesPattern('USER:1', 'USER:*')).toBe(true);
    });

    test('should handle empty strings', () => {
      expect(PatternMatcher.matchesPattern('', '')).toBe(true);
      expect(PatternMatcher.matchesPattern('', '*')).toBe(true);
      expect(PatternMatcher.matchesPattern('test', '')).toBe(false);
    });
  });

  describe('Regex Caching', () => {
    test('should cache converted regex patterns', () => {
      const pattern = 'user:*';
      
      const regex1 = PatternMatcher.convertPatternToRegex(pattern);
      const regex2 = PatternMatcher.convertPatternToRegex(pattern);
      
      expect(regex1).toBe(regex2); // Same reference
    });

    test('should create different regex for different patterns', () => {
      const regex1 = PatternMatcher.convertPatternToRegex('user:*');
      const regex2 = PatternMatcher.convertPatternToRegex('post:*');
      
      expect(regex1).not.toBe(regex2); // Different references
      expect(regex1.test('user:1')).toBe(true);
      expect(regex1.test('post:1')).toBe(false);
      expect(regex2.test('post:1')).toBe(true);
      expect(regex2.test('user:1')).toBe(false);
    });

    test('should clear cache', () => {
      const pattern = 'user:*';
      
      const regex1 = PatternMatcher.convertPatternToRegex(pattern);
      PatternMatcher.clearCache();
      const regex2 = PatternMatcher.convertPatternToRegex(pattern);
      
      expect(regex1).not.toBe(regex2); // Different references after clear
    });

    test('should maintain cache performance', () => {
      const pattern = 'very:complex:pattern:*:with:many:parts:*';
      
      // First call - should create new regex
      const start1 = performance.now();
      const regex1 = PatternMatcher.convertPatternToRegex(pattern);
      const end1 = performance.now();
      
      // Second call - should use cached regex
      const start2 = performance.now();
      const regex2 = PatternMatcher.convertPatternToRegex(pattern);
      const end2 = performance.now();
      
      expect(regex1).toBe(regex2);
      // Second call should be faster (though this might not always be true in tests)
      expect(end2 - start2).toBeLessThanOrEqual(end1 - start1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long patterns', () => {
      const longPattern = 'a'.repeat(1000) + '*';
      const longKey = 'a'.repeat(1000) + 'suffix';
      
      expect(PatternMatcher.matchesPattern(longKey, longPattern)).toBe(true);
      expect(PatternMatcher.matchesPattern('a'.repeat(999), longPattern)).toBe(false);
    });

    test('should handle patterns with only special characters', () => {
      const regex = PatternMatcher.convertPatternToRegex('.+?^${}()|[]\\');
      expect(regex.test('.+?^${}()|[]\\')).toBe(true);
    });

    test('should handle Unicode characters', () => {
      expect(PatternMatcher.matchesPattern('üser:1', 'üser:*')).toBe(true);
      expect(PatternMatcher.matchesPattern('用户:1', '用户:*')).toBe(true);
      expect(PatternMatcher.matchesPattern('🚀:launch', '🚀:*')).toBe(true);
    });

    test('should handle null and undefined inputs gracefully', () => {
      expect(() => {
        PatternMatcher.convertPatternToRegex(null as any);
      }).toThrow();
      
      expect(() => {
        PatternMatcher.convertPatternToRegex(undefined as any);
      }).toThrow();
    });

    test('should handle non-string inputs', () => {
      expect(() => {
        PatternMatcher.convertPatternToRegex(123 as any);
      }).toThrow();
      
      expect(() => {
        PatternMatcher.convertPatternToRegex({} as any);
      }).toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should handle large number of pattern matches efficiently', () => {
      const pattern = 'cache:*:data:*';
      const keys = Array.from({ length: 1000 }, (_, i) => `cache:${i}:data:${i * 2}`);
      
      const start = performance.now();
      
      keys.forEach(key => {
        PatternMatcher.matchesPattern(key, pattern);
      });
      
      const end = performance.now();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(end - start).toBeLessThan(100); // 100ms
    });

    test('should reuse cached regex for many matches', () => {
      const pattern = 'user:*';
      const keys = Array.from({ length: 1000 }, (_, i) => `user:${i}`);
      
      // Pre-cache the regex
      PatternMatcher.convertPatternToRegex(pattern);
      
      const start = performance.now();
      
      keys.forEach(key => {
        PatternMatcher.matchesPattern(key, pattern);
      });
      
      const end = performance.now();
      
      // Should be faster with cached regex
      expect(end - start).toBeLessThan(50); // 50ms
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle common cache key patterns', () => {
      const scenarios = [
        { key: 'user:123:profile', pattern: 'user:*:profile', expected: true },
        { key: 'user:123:settings', pattern: 'user:*:profile', expected: false },
        { key: 'post:456:comments:789', pattern: 'post:*:comments:*', expected: true },
        { key: 'post:456:likes', pattern: 'post:*:comments:*', expected: false },
        { key: 'session:abc123', pattern: 'session:*', expected: true },
        { key: 'cache:api:user:123', pattern: 'cache:api:*', expected: true },
        { key: 'cache:db:user:123', pattern: 'cache:api:*', expected: false },
      ];

      scenarios.forEach(({ key, pattern, expected }) => {
        expect(PatternMatcher.matchesPattern(key, pattern)).toBe(expected);
      });
    });

    test('should handle API endpoint patterns', () => {
      const apiPatterns = [
        { endpoint: '/api/v1/users/123', pattern: '/api/v1/users/*', expected: true },
        { endpoint: '/api/v1/posts/456/comments', pattern: '/api/v1/posts/*/comments', expected: true },
        { endpoint: '/api/v2/users/123', pattern: '/api/v1/users/*', expected: false },
        { endpoint: '/api/v1/users', pattern: '/api/v1/users/*', expected: false },
      ];

      apiPatterns.forEach(({ endpoint, pattern, expected }) => {
        expect(PatternMatcher.matchesPattern(endpoint, pattern)).toBe(expected);
      });
    });
  });
});