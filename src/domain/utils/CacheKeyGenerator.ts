/**
 * Cache Key Generator
 * Domain layer - Utility for generating consistent cache keys
 *
 * General-purpose key generation for any app
 */

/**
 * Generate a cache key from prefix and identifier
 * @param prefix - Cache key prefix (e.g., 'posts', 'products', 'user')
 * @param id - Unique identifier
 * @returns Formatted cache key
 *
 * @example
 * generateCacheKey('posts', '123') // 'cache:posts:123'
 * generateCacheKey('user', 'profile') // 'cache:user:profile'
 */
export function generateCacheKey(prefix: string, id: string | number): string {
  return `cache:${prefix}:${id}`;
}

/**
 * Generate a cache key for a list/collection
 * @param prefix - Cache key prefix
 * @param params - Optional query parameters
 *
 * @example
 * generateListCacheKey('posts') // 'cache:posts:list'
 * generateListCacheKey('posts', { page: 1 }) // 'cache:posts:list:page=1'
 */
export function generateListCacheKey(
  prefix: string,
  params?: Record<string, string | number>,
): string {
  const base = `cache:${prefix}:list`;
  if (!params) return base;

  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(':');

  return `${base}:${paramString}`;
}

/**
 * Parse a cache key to extract prefix and id
 * @param key - Cache key to parse
 * @returns Object with prefix and id, or null if invalid
 */
export function parseCacheKey(key: string): { prefix: string; id: string } | null {
  const parts = key.split(':');
  if (parts.length < 3 || parts[0] !== 'cache') return null;

  return {
    prefix: parts[1] || '',
    id: parts.slice(2).join(':'),
  };
}

/**
 * Check if a key is a cache key
 */
export function isCacheKey(key: string): boolean {
  return key.startsWith('cache:');
}
