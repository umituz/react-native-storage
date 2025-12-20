/**
 * Cached Value Entity
 * Domain layer - Represents a cached value with TTL metadata
 *
 * General-purpose cache entity for any app that needs persistent caching
 */

/**
 * Cached value with time-to-live metadata
 * Generic type T can be any serializable data
 */
export interface CachedValue<T> {
  /**
   * The actual cached data
   */
  value: T;

  /**
   * Timestamp when the value was cached (milliseconds)
   */
  cachedAt: number;

  /**
   * Timestamp when the cache expires (milliseconds)
   */
  expiresAt: number;

  /**
   * Optional version for cache invalidation
   * Increment version to invalidate all caches
   */
  version?: number;
}

/**
 * Create a new cached value with TTL
 * @param value - Data to cache
 * @param ttlMs - Time-to-live in milliseconds
 * @param version - Optional version number
 */
export function createCachedValue<T>(
  value: T,
  ttlMs: number,
  version?: number,
): CachedValue<T> {
  const now = Date.now();
  return {
    value,
    cachedAt: now,
    expiresAt: now + ttlMs,
    version,
  };
}

/**
 * Check if cached value is expired
 * @param cached - Cached value to check
 * @param currentVersion - Optional current version to check against
 */
export function isCacheExpired<T>(
  cached: CachedValue<T>,
  currentVersion?: number,
): boolean {
  const now = Date.now();
  const timeExpired = now > cached.expiresAt;
  const versionMismatch = currentVersion !== undefined && cached.version !== currentVersion;
  return timeExpired || versionMismatch;
}

/**
 * Get remaining TTL in milliseconds
 * Returns 0 if expired
 */
export function getRemainingTTL<T>(cached: CachedValue<T>): number {
  const now = Date.now();
  const remaining = cached.expiresAt - now;
  return Math.max(0, remaining);
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge<T>(cached: CachedValue<T>): number {
  const now = Date.now();
  return now - cached.cachedAt;
}
