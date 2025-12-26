/**
 * In-Memory Cache
 */

import type { CacheEntry, CacheConfig, CacheStats, EvictionStrategy } from './types/Cache';
import { CacheStatsTracker } from './CacheStatsTracker';
import { PatternMatcher } from './PatternMatcher';
import { LRUStrategy } from './strategies/LRUStrategy';
import { LFUStrategy } from './strategies/LFUStrategy';
import { FIFOStrategy } from './strategies/FIFOStrategy';
import { TTLStrategy } from './strategies/TTLStrategy';

export class Cache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private config: Required<CacheConfig>;
  private statsTracker = new CacheStatsTracker();
  private strategies = {
    lru: new LRUStrategy<T>(),
    lfu: new LFUStrategy<T>(),
    fifo: new FIFOStrategy<T>(),
    ttl: new TTLStrategy<T>(),
  };

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 100,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000,
      onEvict: config.onEvict || (() => { }),
      onExpire: config.onExpire || (() => { }),
    };
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.store.size >= this.config.maxSize && !this.store.has(key)) {
      this.evictOne('lru');
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccess: Date.now(),
    };

    this.store.set(key, entry);
    this.statsTracker.updateSize(this.store.size);

    if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof console !== 'undefined' && console.log) {
      console.log(`Cache: Set key "${key}" with TTL ${entry.ttl}ms`);
    }
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      this.statsTracker.recordMiss();
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.statsTracker.recordMiss();
      this.statsTracker.recordExpiration();
      this.config.onExpire(key, entry);
      return undefined;
    }

    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.statsTracker.recordHit();
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.statsTracker.updateSize(this.store.size);
    }
    return deleted;
  }

  invalidatePattern(pattern: string): number {
    const regex = PatternMatcher.convertPatternToRegex(pattern);
    let invalidatedCount = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        invalidatedCount++;
      }
    }

    this.statsTracker.updateSize(this.store.size);
    return invalidatedCount;
  }

  clear(): void {
    this.store.clear();
    this.statsTracker.reset();
  }

  getStats(): CacheStats {
    return this.statsTracker.getStats();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOne(strategy: EvictionStrategy): void {
    const evictionStrategy = this.strategies[strategy];
    if (!evictionStrategy) return;

    const keyToEvict = evictionStrategy.findKeyToEvict(this.store);
    if (keyToEvict) {
      const entry = this.store.get(keyToEvict);
      this.store.delete(keyToEvict);
      this.statsTracker.recordEviction();
      this.statsTracker.updateSize(this.store.size);

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`Cache: Evicted key "${keyToEvict}" using ${strategy} strategy`);
      }

      if (entry) {
        this.config.onEvict(keyToEvict, entry);
      }
    }
  }
}
