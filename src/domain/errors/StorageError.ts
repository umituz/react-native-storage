/**
 * Storage Error Types
 *
 * Domain-Driven Design: Domain errors for storage operations
 * Typed errors for better error handling and debugging
 */

/**
 * Base Storage Error
 */
export class StorageError extends Error {
  constructor(message: string, public readonly key?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage Read Error
 */
export class StorageReadError extends StorageError {
  public readonly cause?: unknown;

  constructor(key: string, cause?: unknown) {
    super(`Failed to read from storage: ${key}`, key);
    this.name = 'StorageReadError';
    this.cause = cause;
  }
}

/**
 * Storage Write Error
 */
export class StorageWriteError extends StorageError {
  public readonly cause?: unknown;

  constructor(key: string, cause?: unknown) {
    super(`Failed to write to storage: ${key}`, key);
    this.name = 'StorageWriteError';
    this.cause = cause;
  }
}

/**
 * Storage Delete Error
 */
export class StorageDeleteError extends StorageError {
  public readonly cause?: unknown;

  constructor(key: string, cause?: unknown) {
    super(`Failed to delete from storage: ${key}`, key);
    this.name = 'StorageDeleteError';
    this.cause = cause;
  }
}

/**
 * Storage Serialization Error
 */
export class StorageSerializationError extends StorageError {
  public readonly cause?: unknown;

  constructor(key: string, cause?: unknown) {
    super(`Failed to serialize data for key: ${key}`, key);
    this.name = 'StorageSerializationError';
    this.cause = cause;
  }
}

/**
 * Storage Deserialization Error
 */
export class StorageDeserializationError extends StorageError {
  public readonly cause?: unknown;

  constructor(key: string, cause?: unknown) {
    super(`Failed to deserialize data for key: ${key}`, key);
    this.name = 'StorageDeserializationError';
    this.cause = cause;
  }
}
