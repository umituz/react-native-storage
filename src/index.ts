/**
 * Storage Domain - Public API
 *
 * Domain-Driven Design (DDD) Architecture
 *
 * This is the SINGLE SOURCE OF TRUTH for all storage operations.
 * ALL imports from the storage domain MUST go through this file.
 *
 * Architecture:
 * - domain: Entities, value objects, errors (business logic)
 * - application: Ports (interfaces), use cases (not needed for simple CRUD)
 * - infrastructure: Repository implementation (AsyncStorage adapter)
 * - presentation: Hooks (React integration)
 *
 * Usage:
 *   import { useStorage, useStorageState, createStore } from '@umituz/react-native-storage';
 */

// =============================================================================
// DOMAIN LAYER - Business Logic
// =============================================================================

export {
  StorageKey,
  createUserKey,
  createAppKey,
} from './domain/value-objects/StorageKey';

export type { DynamicStorageKey } from './domain/value-objects/StorageKey';

export {
  StorageError,
  StorageReadError,
  StorageWriteError,
  StorageDeleteError,
  StorageSerializationError,
  StorageDeserializationError,
} from './domain/errors/StorageError';

export type { StorageResult } from './domain/entities/StorageResult';

export {
  success,
  failure,
  unwrap,
  map,
  isSuccess,
  isFailure,
} from './domain/entities/StorageResult';

// =============================================================================
// DOMAIN LAYER - Cached Value Entity
// =============================================================================

export type { CachedValue } from './domain/entities/CachedValue';

export {
  createCachedValue,
  isCacheExpired,
  getRemainingTTL,
  getCacheAge,
} from './domain/entities/CachedValue';

// =============================================================================
// DOMAIN LAYER - Cache Utilities
// =============================================================================

export {
  generateCacheKey,
  generateListCacheKey,
  parseCacheKey,
  isCacheKey,
} from './domain/utils/CacheKeyGenerator';

// =============================================================================
// DOMAIN LAYER - Cache Constants
// =============================================================================

export { TIME_MS, DEFAULT_TTL, CACHE_VERSION } from './domain/constants/CacheDefaults';

// =============================================================================
// DOMAIN LAYER - Development Utilities
// =============================================================================

export { isDev, devWarn, devError, devLog } from './domain/utils/devUtils';

// =============================================================================
// DOMAIN LAYER - Store Types
// =============================================================================

export type { StoreConfig, PersistedState } from './domain/types/Store';

// =============================================================================
// DOMAIN LAYER - Store Factory
// =============================================================================

export { createStore } from './domain/factories/StoreFactory';

// =============================================================================
// APPLICATION LAYER - Ports
// =============================================================================

export type { IStorageRepository } from './application/ports/IStorageRepository';

// =============================================================================
// INFRASTRUCTURE LAYER - Implementation
// =============================================================================

export {
  AsyncStorageRepository,
  storageRepository,
} from './infrastructure/repositories/AsyncStorageRepository';

export {
  storageService,
  type StateStorage,
} from './infrastructure/adapters/StorageService';

// =============================================================================
// PRESENTATION LAYER - Hooks
// =============================================================================

export { useStorage } from './presentation/hooks/useStorage';
export { useStorageState } from './presentation/hooks/useStorageState';
export { useStore } from './presentation/hooks/useStore';

export {
  usePersistentCache,
  type PersistentCacheOptions,
  type PersistentCacheResult,
} from './presentation/hooks/usePersistentCache';

export { useCacheState } from './presentation/hooks/useCacheState';
export { CacheStorageOperations } from './presentation/hooks/CacheStorageOperations';
