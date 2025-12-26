/**
 * TTL Cache
 * Time-to-live cache with automatic cleanup
 */

import { Cache } from '../domain/Cache';
import type { CacheConfig } from '../domain/types/Cache';

export class TTLCache<T = unknown> extends Cache<T> {
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;
  private readonly cleanupIntervalMs: number;

  constructor(config: CacheConfig & { cleanupIntervalMs?: number } = {}) {
    super(config);

    this.cleanupIntervalMs = config.cleanupIntervalMs || 60000;
    this.startCleanup();
  }

  private startCleanup(): void {
    if (this.isDestroyed) return;

    this.cleanupInterval = setInterval(() => {
      if (!this.isDestroyed) {
        this.cleanup();
      }
    }, this.cleanupIntervalMs);
  }

  private cleanup(): void {
    if (this.isDestroyed) return;

    const keys = this.keys();
    let cleanedCount = 0;
    const now = Date.now();

    for (const key of keys) {
      const entry = (this as any).store.get(key);
      if (entry && (now - entry.timestamp) > entry.ttl) {
        (this as any).store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      (this as any).statsTracker.updateSize((this as any).store.size);
      (this as any).statsTracker.recordExpiration();

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`TTLCache: Cleaned up ${cleanedCount} expired entries`);
      }
    }
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.clear();
  }

  override set(key: string, value: T, ttl?: number): void {
    if (this.isDestroyed) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('TTLCache: Attempted to set value on destroyed cache');
      }
      return;
    }
    super.set(key, value, ttl);
  }

  override get(key: string): T | undefined {
    if (this.isDestroyed) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('TTLCache: Attempted to get value from destroyed cache');
      }
      return undefined;
    }
    return super.get(key);
  }

  override has(key: string): boolean {
    if (this.isDestroyed) return false;
    return super.has(key);
  }

  override delete(key: string): boolean {
    if (this.isDestroyed) return false;
    return super.delete(key);
  }

  override clear(): void {
    if (this.isDestroyed) return;
    super.clear();
  }
}
