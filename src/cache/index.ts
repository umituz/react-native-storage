/**
 * @umituz/react-native-cache
 * In-memory caching utilities for React Native
 */

export { Cache } from './domain/Cache';
export { CacheManager, cacheManager } from './domain/CacheManager';
export { CacheStatsTracker } from './domain/CacheStatsTracker';
export { PatternMatcher } from './domain/PatternMatcher';
export { ErrorHandler, CacheError } from './domain/ErrorHandler';
export { TTLCache } from './infrastructure/TTLCache';

export type {
  CacheEntry,
  CacheConfig,
  CacheStats,
  EvictionStrategy,
} from './domain/types/Cache';

export type { EvictionStrategy as IEvictionStrategy } from './domain/strategies/EvictionStrategy';

export { LRUStrategy } from './domain/strategies/LRUStrategy';
export { LFUStrategy } from './domain/strategies/LFUStrategy';
export { FIFOStrategy } from './domain/strategies/FIFOStrategy';
export { TTLStrategy as TTLEvictionStrategy } from './domain/strategies/TTLStrategy';

export { useCache } from './presentation/useCache';
export { useCachedValue } from './presentation/useCachedValue';
