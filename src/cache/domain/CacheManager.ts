/**
 * Cache Manager
 * Manages multiple cache instances
 */

import { Cache } from './Cache';
import type { CacheConfig } from './types/Cache';

export class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, Cache<any>>();

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  getCache<T>(name: string, config?: CacheConfig): Cache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Cache<T>(config));
    }
    return this.caches.get(name)!;
  }

  deleteCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      return this.caches.delete(name);
    }
    return false;
  }

  clearAll(): void {
    this.caches.forEach((cache) => cache.clear());
    this.caches.clear();
  }

  getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }
}

export const cacheManager = CacheManager.getInstance();
