/**
 * Storage Result Entity
 *
 * Domain-Driven Design: Entity representing storage operation result
 * Functional programming pattern for error handling (Result type)
 *
 * Theme: {{THEME_NAME}} ({{CATEGORY}} category)
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
 * Unwrap result with default value
 */
export const unwrap = <T>(result: StorageResult<T>, defaultValue: T): T => {
  if (result.success) {
    return result.data;
  }
  return result.fallback ?? defaultValue;
};

/**
 * Map result data
 */
export const map = <T, U>(
  result: StorageResult<T>,
  fn: (data: T) => U
): StorageResult<U> => {
  if (result.success) {
    return success(fn(result.data));
  }
  return result as StorageResult<U>;
};
