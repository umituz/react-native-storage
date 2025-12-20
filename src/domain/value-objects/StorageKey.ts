/**
 * Storage Key Value Object
 *
 * Domain-Driven Design: Value Object for storage keys
 * Ensures type safety and prevents invalid key usage
 */

/**
 * Storage key with dynamic suffix
 */
export type DynamicStorageKey = {
  base: string;
  suffix: string;
};

/**
 * Helper to create user-specific storage key
 *
 * @param baseKey Base storage key
 * @param userId User identifier
 * @returns User-specific key
 */
export const createUserKey = (baseKey: string, userId: string): string => {
  return `${baseKey}_${userId}`;
};

/**
 * Helper to create app-specific storage key
 *
 * @param baseKey Base storage key
 * @param appName App identifier
 * @returns App-specific key
 */
export const createAppKey = (baseKey: string, appName: string): string => {
  return `${appName}_${baseKey}`;
};

/**
 * Helper to create namespaced storage key
 *
 * @param namespace Key namespace
 * @param key Specific key
 * @returns Namespaced key
 */
export const createNamespacedKey = (namespace: string, key: string): string => {
  return `${namespace}:${key}`;
};

/**
 * Common storage keys for cross-app usage
 * Generic keys that can be used across multiple applications
 */
export enum StorageKey {
  USER_PREFERENCES = '@user_preferences',
  APP_SETTINGS = '@app_settings',
  LANGUAGE = '@language',
  UI_PREFERENCES = '@ui_preferences',
  QUERY_CACHE = '@query_cache',
  DATA_CACHE = '@data_cache',
}
