/**
 * Storage Result Entity
 *
 * Domain-Driven Design: Entity representing storage operation result
 * Functional programming pattern for error handling (Result type)
 */

import type { StorageError } from '../errors/StorageError';

/**
 * Storage Operation Result
 * Success/Failure pattern for type-safe error handling
 */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: StorageError; fallback?: T };

/**
 * Create success result
 */
export const success = <T>(data: T): StorageResult<T> => ({
  success: true,
  data,
});

/**
 * Create failure result
 */
export const failure = <T>(error: StorageError, fallback?: T): StorageResult<T> => ({
  success: false,
  error,
  fallback,
});

/**
 * Type guard for success result
 */
export const isSuccess = <T>(result: StorageResult<T>): result is { success: true; data: T } => {
  return result.success === true;
};

/**
 * Type guard for failure result
 */
export const isFailure = <T>(result: StorageResult<T>): result is { success: false; error: StorageError; fallback?: T } => {
  return result.success === false;
};

/**
 * Unwrap result with default value
 */
export const unwrap = <T>(result: StorageResult<T>, defaultValue: T): T => {
  if (isSuccess(result)) {
    return result.data;
  }
  // Type guard ensures we can access fallback
  if (isFailure(result) && result.fallback !== undefined) {
    return result.fallback;
  }
  return defaultValue;
};

/**
 * Map result data
 */
export const map = <T, U>(
  result: StorageResult<T>,
  fn: (data: T) => U
): StorageResult<U> => {
  if (isSuccess(result)) {
    return success(fn(result.data));
  }
  // For failure, we can't convert fallback type T to U, so we omit it
  return failure(result.error);
};
