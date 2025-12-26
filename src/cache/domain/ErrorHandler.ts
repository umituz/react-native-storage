/**
 * Error Handler for Cache Operations
 */

export class CacheError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'CacheError';
  }
}

export class ErrorHandler {
  static handle(error: unknown, context: string): never {
    if (error instanceof CacheError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new CacheError(`${context}: ${error.message}`, 'CACHE_ERROR');
    }
    
    throw new CacheError(`${context}: Unknown error`, 'UNKNOWN_ERROR');
  }

  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    context: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new CacheError(`${context}: Operation timed out after ${timeoutMs}ms`, 'TIMEOUT'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      this.handle(error, context);
    }
  }
}