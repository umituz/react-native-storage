/**
 * Storage Key Value Object
 *
 * Domain-Driven Design: Value Object for storage keys
 * Ensures type safety and prevents invalid key usage
 *
 * Theme: {{THEME_NAME}} ({{CATEGORY}} category)
 */

/**
 * Storage Key Type
 * All valid storage keys must be defined here
 */
export enum StorageKey {
  // Onboarding
  ONBOARDING_COMPLETED = '@onboarding_completed',

  // Localization
  LANGUAGE = '@app_language',

  // Theme
  THEME_MODE = '@app_theme_mode',

  // Settings (requires userId suffix)
  SETTINGS = 'app_settings',

  // Query Cache (requires app name prefix)
  QUERY_CACHE = '{{APP_NAME}}_query_cache',
}

/**
 * Storage key with dynamic suffix
 */
export type DynamicStorageKey = {
  base: StorageKey;
  suffix: string;
};

/**
 * Helper to create user-specific storage key
 *
 * @param baseKey Base storage key
 * @param userId User identifier
 * @returns User-specific key
 */
export const createUserKey = (baseKey: StorageKey, userId: string): string => {
  return `${baseKey}_${userId}`;
};

/**
 * Helper to create app-specific storage key
 *
 * @param baseKey Base storage key
 * @param appName App identifier
 * @returns App-specific key
 */
export const createAppKey = (baseKey: StorageKey, appName: string): string => {
  return `${appName}_${baseKey}`;
};
