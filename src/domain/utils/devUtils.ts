/**
 * Development utilities
 */

/**
 * Check if running in development mode
 */
export const isDev = (): boolean => {
  return (globalThis as any).__DEV__ === true;
};

/**
 * Log warning in development mode only
 */
export const devWarn = (message: string, ...args: any[]): void => {
  if (isDev()) {
    console.warn(message, ...args);
  }
};

/**
 * Log error in development mode only
 */
export const devError = (message: string, ...args: any[]): void => {
  if (isDev()) {
    console.error(message, ...args);
  }
};

/**
 * Log info in development mode only
 */
export const devLog = (message: string, ...args: any[]): void => {
  if (isDev()) {
    console.log(message, ...args);
  }
};