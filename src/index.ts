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
 *   import { useStorage, useStorageState, StorageKey } from '@umituz/react-native-storage';
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
} from './domain/entities/StorageResult';

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

// =============================================================================
// PRESENTATION LAYER - Hooks
// =============================================================================

export { useStorage } from './presentation/hooks/useStorage';
export { useStorageState } from './presentation/hooks/useStorageState';
