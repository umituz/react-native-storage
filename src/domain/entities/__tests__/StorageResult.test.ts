/**
 * StorageResult Entity Tests
 *
 * Unit tests for StorageResult entity
 */

import { success, failure, unwrap, map, isSuccess, isFailure } from '../../domain/entities/StorageResult';
import { StorageError } from '../../domain/errors/StorageError';

describe('StorageResult Entity', () => {
  describe('success', () => {
    it('should create a successful result', () => {
      const data = { test: 'value' };
      const result = success(data);

      expect(result.success).toBe(true);
      expect(result.data).toBe(data);
      expect(result.error).toBeUndefined();
    });
  });

  describe('failure', () => {
    it('should create a failure result', () => {
      const error = new StorageError('test-key', new Error('Test error'));
      const defaultValue = 'default';
      const result = failure(error, defaultValue);

      expect(result.success).toBe(false);
      expect(result.data).toBe(defaultValue);
      expect(result.error).toBe(error);
    });
  });

  describe('unwrap', () => {
    it('should return data for successful result', () => {
      const data = { test: 'value' };
      const result = success(data);
      const defaultValue = 'default';

      const unwrapped = unwrap(result, defaultValue);

      expect(unwrapped).toBe(data);
    });

    it('should return default value for failure result', () => {
      const error = new StorageError('test-key', new Error('Test error'));
      const defaultValue = 'default';
      const result = failure(error, defaultValue);

      const unwrapped = unwrap(result, defaultValue);

      expect(unwrapped).toBe(defaultValue);
    });
  });

  describe('map', () => {
    it('should map successful result', () => {
      const data = { count: 1 };
      const result = success(data);
      const mapper = (value: typeof data) => ({ ...value, count: value.count + 1 });

      const mapped = map(result, mapper);

      expect(mapped.success).toBe(true);
      expect(mapped.data).toEqual({ count: 2 });
    });

    it('should not map failure result', () => {
      const error = new StorageError('test-key', new Error('Test error'));
      const defaultValue = { count: 0 };
      const result = failure(error, defaultValue);
      const mapper = jest.fn();

      const mapped = map(result, mapper);

      expect(mapped.success).toBe(false);
      expect(mapper).not.toHaveBeenCalled();
    });
  });

  describe('isSuccess', () => {
    it('should return true for successful result', () => {
      const result = success('test');
      expect(isSuccess(result)).toBe(true);
    });

    it('should return false for failure result', () => {
      const error = new StorageError('test-key', new Error('Test error'));
      const result = failure(error);
      expect(isSuccess(result)).toBe(false);
    });
  });

  describe('isFailure', () => {
    it('should return false for successful result', () => {
      const result = success('test');
      expect(isFailure(result)).toBe(false);
    });

    it('should return true for failure result', () => {
      const error = new StorageError('test-key', new Error('Test error'));
      const result = failure(error);
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type information', () => {
      interface TestData {
        id: number;
        name: string;
      }

      const data: TestData = { id: 1, name: 'test' };
      const result = success<TestData>(data);

      // TypeScript should infer the type correctly
      const typedData: TestData = result.data;
      expect(typedData).toEqual(data);
    });
  });
});