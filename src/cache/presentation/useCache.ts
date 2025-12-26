/**
 * useCache Hook
 */

import { useCallback, useRef, useState } from 'react';
import { cacheManager } from '../domain/CacheManager';
import type { CacheConfig } from '../domain/types/Cache';

export function useCache<T>(cacheName: string, config?: CacheConfig) {
  const cacheRef = useRef(cacheManager.getCache<T>(cacheName, config));
  const cache = cacheRef.current!;
  const [, forceUpdate] = useState({});

  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  const set = useCallback(
    (key: string, value: T, ttl?: number) => {
      cache.set(key, value, ttl);
      triggerUpdate();
    },
    [cache, triggerUpdate]
  );

  const get = useCallback(
    (key: string): T | undefined => {
      return cache.get(key);
    },
    [cache]
  );

  const has = useCallback(
    (key: string): boolean => {
      return cache.has(key);
    },
    [cache]
  );

  const remove = useCallback(
    (key: string): boolean => {
      const result = cache.delete(key);
      triggerUpdate();
      return result;
    },
    [cache, triggerUpdate]
  );

  const clear = useCallback(() => {
    cache.clear();
    triggerUpdate();
  }, [cache, triggerUpdate]);

  const invalidatePattern = useCallback(
    (pattern: string): number => {
      const count = cache.invalidatePattern(pattern);
      triggerUpdate();
      return count;
    },
    [cache, triggerUpdate]
  );

  const getStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  return {
    set,
    get,
    has,
    remove,
    clear,
    invalidatePattern,
    getStats,
  };
}
