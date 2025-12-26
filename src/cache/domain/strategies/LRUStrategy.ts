/**
 * LRU (Least Recently Used) Eviction Strategy
 */

import type { EvictionStrategy } from './EvictionStrategy';
import type { CacheEntry } from '../types/Cache';

export class LRUStrategy<T> implements EvictionStrategy<T> {
  findKeyToEvict(entries: Map<string, CacheEntry<T>>): string | undefined {
    let oldest: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of entries.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldest = key;
      }
    }

    return oldest;
  }
}