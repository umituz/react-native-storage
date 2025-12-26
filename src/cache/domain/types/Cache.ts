/**
 * Cache Types
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  onEvict?: (key: string, entry: CacheEntry<unknown>) => void;
  onExpire?: (key: string, entry: CacheEntry<unknown>) => void;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
}

export type EvictionStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl';
