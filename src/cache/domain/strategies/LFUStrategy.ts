/**
 * LFU (Least Frequently Used) Eviction Strategy
 */

import type { EvictionStrategy } from './EvictionStrategy';
import type { CacheEntry } from '../types/Cache';

export class LFUStrategy<T> implements EvictionStrategy<T> {
  findKeyToEvict(entries: Map<string, CacheEntry<T>>): string | undefined {
    let least: string | undefined;
    let leastCount = Infinity;

    for (const [key, entry] of entries.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        least = key;
      }
    }

    return least;
  }
}