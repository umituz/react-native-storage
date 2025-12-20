/**
 * StorageError Tests
 *
 * Unit tests for StorageError classes
 */

import {
  StorageError,
  StorageReadError,
  StorageWriteError,
  StorageDeleteError,
  StorageSerializationError,
  StorageDeserializationError,
} from '../../domain/errors/StorageError';

describe('StorageError Classes', () => {
  describe('StorageError', () => {
    it('should create base storage error', () => {
      const key = 'test-key';
      const cause = new Error('Original error');
      const error = new StorageError(key, cause);

      expect(error.key).toBe(key);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('StorageError');
      expect(error.message).toContain(key);
    });

    it('should serialize error details', () => {
      const key = 'test-key';
      const cause = new Error('Original error');
      const error = new StorageError(key, cause);

      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.key).toBe(key);
      expect(parsed.message).toContain(key);
    });
  });

  describe('StorageReadError', () => {
    it('should create read error', () => {
      const key = 'test-key';
      const cause = new Error('Read failed');
      const error = new StorageReadError(key, cause);

      expect(error.key).toBe(key);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('StorageReadError');
      expect(error.message).toContain('read');
    });
  });

  describe('StorageWriteError', () => {
    it('should create write error', () => {
      const key = 'test-key';
      const cause = new Error('Write failed');
      const error = new StorageWriteError(key, cause);

      expect(error.key).toBe(key);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('StorageWriteError');
      expect(error.message).toContain('write');
    });
  });

  describe('StorageDeleteError', () => {
    it('should create delete error', () => {
      const key = 'test-key';
      const cause = new Error('Delete failed');
      const error = new StorageDeleteError(key, cause);

      expect(error.key).toBe(key);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('StorageDeleteError');
      expect(error.message).toContain('delete');
    });
  });

  describe('StorageSerializationError', () => {
    it('should create serialization error', () => {
      const key = 'test-key';
      const cause = new Error('Serialization failed');
      const error = new StorageSerializationError(key, cause);

      expect(error.key).toBe(key);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('StorageSerializationError');
      expect(error.message).toContain('serialize');
    });
  });

  describe('StorageDeserializationError', () => {
    it('should create deserialization error', () => {
      const key = 'test-key';
      const cause = new Error('Deserialization failed');
      const error = new StorageDeserializationError(key, cause);

      expect(error.key).toBe(key);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('StorageDeserializationError');
      expect(error.message).toContain('deserialize');
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain error chain', () => {
      const key = 'test-key';
      const cause = new Error('Original error');
      const error = new StorageReadError(key, cause);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof StorageError).toBe(true);
      expect(error instanceof StorageReadError).toBe(true);
    });

    it('should preserve stack trace', () => {
      const key = 'test-key';
      const cause = new Error('Original error');
      const error = new StorageReadError(key, cause);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('StorageReadError');
    });
  });
});