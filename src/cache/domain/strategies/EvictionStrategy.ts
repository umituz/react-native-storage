/**
 * Eviction Strategy Interface
 */

import type { CacheEntry } from '../types/Cache';

export interface EvictionStrategy<T> {
  findKeyToEvict(entries: Map<string, CacheEntry<T>>): string | undefined;
}