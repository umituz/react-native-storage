/**
 * Cache Statistics Tracker
 */

import type { CacheStats } from './types/Cache';

export class CacheStatsTracker {
  private stats: CacheStats = {
    size: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0,
  };

  recordHit(): void {
    this.stats.hits++;
  }

  recordMiss(): void {
    this.stats.misses++;
  }

  recordEviction(): void {
    this.stats.evictions++;
  }

  recordExpiration(): void {
    this.stats.expirations++;
  }

  updateSize(size: number): void {
    this.stats.size = size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
    };
  }
}