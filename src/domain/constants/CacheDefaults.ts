/**
 * Cache Default Constants
 * Domain layer - Default values for caching
 *
 * General-purpose constants for any app
 */

/**
 * Time constants in milliseconds
 */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Default TTL values for different cache types
 */
export const DEFAULT_TTL = {
  /**
   * Very short cache (1 minute)
   * Use for: Real-time data, live updates
   */
  VERY_SHORT: TIME_MS.MINUTE,

  /**
   * Short cache (5 minutes)
   * Use for: Frequently changing data
   */
  SHORT: 5 * TIME_MS.MINUTE,

  /**
   * Medium cache (30 minutes)
   * Use for: Moderately changing data, user-specific content
   */
  MEDIUM: 30 * TIME_MS.MINUTE,

  /**
   * Long cache (2 hours)
   * Use for: Slowly changing data, public content
   */
  LONG: 2 * TIME_MS.HOUR,

  /**
   * Very long cache (24 hours)
   * Use for: Rarely changing data, master data
   */
  VERY_LONG: TIME_MS.DAY,

  /**
   * Permanent cache (7 days)
   * Use for: Static content, app configuration
   */
  PERMANENT: TIME_MS.WEEK,
} as const;

/**
 * Cache version for global invalidation
 * Increment this to invalidate all caches across the app
 */
export const CACHE_VERSION = 1;
