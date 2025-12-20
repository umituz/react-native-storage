/**
 * usePersistentCache Hook
 * Presentation layer - Hook for persistent caching with TTL
 *
 * General-purpose cache hook for any app
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useCacheState } from './useCacheState';
import { CacheStorageOperations } from './CacheStorageOperations';
import { isCacheExpired } from '../../domain/entities/CachedValue';
import { DEFAULT_TTL } from '../../domain/constants/CacheDefaults';

/**
 * Options for persistent cache
 */
export interface PersistentCacheOptions {
  /**
   * Time-to-live in milliseconds
   * @default DEFAULT_TTL.MEDIUM (30 minutes)
   */
  ttl?: number;

  /**
   * Cache version for invalidation
   * Increment to invalidate existing caches
   */
  version?: number;

  /**
   * Whether cache is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Result from usePersistentCache hook
 */
export interface PersistentCacheResult<T> {
  /**
   * Cached data (null if not loaded or expired)
   */
  data: T | null;

  /**
   * Whether data is being loaded from storage
   */
  isLoading: boolean;

  /**
   * Whether cached data is expired
   */
  isExpired: boolean;

  /**
   * Set data to cache
   */
  setData: (value: T) => Promise<void>;

  /**
   * Clear cached data
   */
  clearData: () => Promise<void>;

  /**
   * Refresh cache (reload from storage)
   */
  refresh: () => Promise<void>;
}

/**
 * Hook for persistent caching with TTL support
 *
 * @example
 * ```typescript
 * const { data, setData, isExpired } = usePersistentCache<Post[]>('posts-page-1', {
 *   ttl: TIME_MS.HOUR,
 *   version: 1,
 * });
 *
 * // Check if need to fetch
 * if (!data || isExpired) {
 *   const freshData = await fetchPosts();
 *   await setData(freshData);
 * }
 * ```
 */
export function usePersistentCache<T>(
  key: string,
  options: PersistentCacheOptions = {},
): PersistentCacheResult<T> {
  const { ttl = DEFAULT_TTL.MEDIUM, version, enabled = true } = options;
  const [state, actions] = useCacheState<T>();
  
  // Use singleton pattern to prevent memory leaks
  const cacheOps = useMemo(() => CacheStorageOperations.getInstance(), []);

  const loadFromStorage = useCallback(async () => {
    if (!enabled) {
      actions.setLoading(false);
      return;
    }

    actions.setLoading(true);

    try {
      const cached = await cacheOps.loadFromStorage<T>(key, version);

      if (cached) {
        const expired = isCacheExpired(cached, version);
        actions.setData(cached.value);
        actions.setExpired(expired);
      } else {
        actions.clearData();
      }
    } catch {
      actions.clearData();
    } finally {
      actions.setLoading(false);
    }
  }, [key, version, enabled, actions, cacheOps]);

  const setData = useCallback(
    async (value: T) => {
      await cacheOps.saveToStorage(key, value, { ttl, version, enabled });
      actions.setData(value);
    },
    [key, ttl, version, enabled, actions, cacheOps],
  );

  const clearData = useCallback(async () => {
    await cacheOps.clearFromStorage(key, enabled);
    actions.clearData();
  }, [key, enabled, actions, cacheOps]);

  const refresh = useCallback(async () => {
    await loadFromStorage();
  }, [loadFromStorage]);

  // Prevent infinite loops by only running when key or enabled changes
  useEffect(() => {
    loadFromStorage();
  }, [key, enabled]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    isExpired: state.isExpired,
    setData,
    clearData,
    refresh,
  };
}
