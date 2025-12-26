/**
 * TTL (Time To Live) Eviction Strategy
 */

import type { EvictionStrategy } from './EvictionStrategy';
import type { CacheEntry } from '../types/Cache';

export class TTLStrategy<T> implements EvictionStrategy<T> {
  findKeyToEvict(entries: Map<string, CacheEntry<T>>): string | undefined {
    let nearest: string | undefined;
    let nearestExpiry = Infinity;

    for (const [key, entry] of entries.entries()) {
      const expiry = entry.timestamp + entry.ttl;
      if (expiry < nearestExpiry) {
        nearestExpiry = expiry;
        nearest = key;
      }
    }

    return nearest;
  }
}