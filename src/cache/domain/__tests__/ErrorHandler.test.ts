/**
 * ErrorHandler Tests
 */

import { ErrorHandler, CacheError } from '../ErrorHandler';

describe('ErrorHandler', () => {
  describe('CacheError', () => {
    test('should create CacheError with message and code', () => {
      const error = new CacheError('Test message', 'TEST_CODE');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CacheError);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('CacheError');
    });

    test('should have stack trace', () => {
      const error = new CacheError('Test message', 'TEST_CODE');
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    test('should be serializable', () => {
      const error = new CacheError('Test message', 'TEST_CODE');
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.message).toBe('Test message');
      expect(parsed.code).toBe('TEST_CODE');
      expect(parsed.name).toBe('CacheError');
    });
  });

  describe('handle', () => {
    test('should throw CacheError as-is', () => {
      const originalError = new CacheError('Original error', 'ORIGINAL');
      
      expect(() => {
        ErrorHandler.handle(originalError, 'test context');
      }).toThrow('Original error');
    });

    test('should wrap regular Error in CacheError', () => {
      const originalError = new Error('Regular error');
      
      expect(() => {
        ErrorHandler.handle(originalError, 'test context');
      }).toThrow(CacheError);
    });

    test('should include context in wrapped error message', () => {
      const originalError = new Error('Regular error');
      
      try {
        ErrorHandler.handle(originalError, 'test context');
      } catch (error) {
        expect((error as CacheError).message).toBe('test context: Regular error');
        expect((error as CacheError).code).toBe('CACHE_ERROR');
      }
    });

    test('should handle unknown error type', () => {
      const unknownError = 'string error';
      
      try {
        ErrorHandler.handle(unknownError, 'test context');
      } catch (error) {
        expect((error as CacheError).message).toBe('test context: Unknown error');
        expect((error as CacheError).code).toBe('UNKNOWN_ERROR');
      }
    });

    test('should handle null error', () => {
      try {
        ErrorHandler.handle(null, 'test context');
      } catch (error) {
        expect((error as CacheError).message).toBe('test context: Unknown error');
        expect((error as CacheError).code).toBe('UNKNOWN_ERROR');
      }
    });

    test('should handle undefined error', () => {
      try {
        ErrorHandler.handle(undefined, 'test context');
      } catch (error) {
        expect((error as CacheError).message).toBe('test context: Unknown error');
        expect((error as CacheError).code).toBe('UNKNOWN_ERROR');
      }
    });

    test('should preserve original error properties when possible', () => {
      const originalError = new Error('Original error');
      (originalError as any).customProperty = 'custom value';
      
      try {
        ErrorHandler.handle(originalError, 'test context');
      } catch (error) {
        const cacheError = error as CacheError;
        expect(cacheError.message).toBe('test context: Original error');
        expect(cacheError.code).toBe('CACHE_ERROR');
        // Note: original properties are not copied to maintain clean error structure
      }
    });
  });

  describe('withTimeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should resolve promise before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await ErrorHandler.withTimeout(promise, 1000, 'test context');
      
      expect(result).toBe('success');
    });

    test('should timeout when promise takes too long', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('late'), 2000));
      
      await expect(
        ErrorHandler.withTimeout(promise, 1000, 'test context')
      ).rejects.toThrow(CacheError);
    });

    test('should include timeout in error message', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('late'), 2000));
      
      try {
        await ErrorHandler.withTimeout(promise, 1000, 'test context');
      } catch (error) {
        expect((error as CacheError).message).toBe('test context: Operation timed out after 1000ms');
        expect((error as CacheError).code).toBe('TIMEOUT');
      }
    });

    test('should handle promise rejection before timeout', async () => {
      const promise = Promise.reject(new Error('Promise rejected'));
      
      await expect(
        ErrorHandler.withTimeout(promise, 1000, 'test context')
      ).rejects.toThrow(CacheError);
    });

    test('should include context in promise rejection error', async () => {
      const promise = Promise.reject(new Error('Promise rejected'));
      
      try {
        await ErrorHandler.withTimeout(promise, 1000, 'test context');
      } catch (error) {
        expect((error as CacheError).message).toBe('test context: Promise rejected');
        expect((error as CacheError).code).toBe('CACHE_ERROR');
      }
    });

    test('should handle zero timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 100));
      
      await expect(
        ErrorHandler.withTimeout(promise, 0, 'test context')
      ).rejects.toThrow(CacheError);
    });

    test('should handle negative timeout', async () => {
      const promise = Promise.resolve('success');
      
      // Negative timeout should trigger immediate timeout
      await expect(
        ErrorHandler.withTimeout(promise, -1000, 'test context')
      ).rejects.toThrow(CacheError);
    });

    test('should cleanup timeout when promise resolves', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const promise = Promise.resolve('success');
      
      await ErrorHandler.withTimeout(promise, 1000, 'test context');
      
      // Should clear timeout after promise resolves
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    test('should handle multiple concurrent timeouts', async () => {
      const promise1 = Promise.resolve('success1');
      const promise2 = Promise.resolve('success2');
      const promise3 = new Promise(resolve => setTimeout(() => resolve('success3'), 2000));
      
      const results = await Promise.allSettled([
        ErrorHandler.withTimeout(promise1, 1000, 'context1'),
        ErrorHandler.withTimeout(promise2, 1000, 'context2'),
        ErrorHandler.withTimeout(promise3, 1000, 'context3'),
      ]);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('rejected');
    });
  });

  describe('Integration with Cache Operations', () => {
    test('should handle cache operation errors', () => {
      const mockOperation = () => {
        throw new Error('Cache operation failed');
      };
      
      expect(() => {
        ErrorHandler.handle(mockOperation(), 'cache.set');
      }).toThrow('cache.set: Cache operation failed');
    });

    test('should handle async cache operation errors', async () => {
      const mockAsyncOperation = async () => {
        throw new Error('Async cache operation failed');
      };
      
      await expect(
        ErrorHandler.withTimeout(mockAsyncOperation(), 1000, 'cache.get')
      ).rejects.toThrow('cache.get: Async cache operation failed');
    });

    test('should handle network timeout scenarios', async () => {
      const mockNetworkCall = new Promise(resolve => 
        setTimeout(() => resolve({ data: 'response' }), 5000)
      );
      
      await expect(
        ErrorHandler.withTimeout(mockNetworkCall, 1000, 'api.fetch')
      ).rejects.toThrow('api.fetch: Operation timed out after 1000ms');
    });
  });

  describe('Error Code Constants', () => {
    test('should use consistent error codes', () => {
      const scenarios = [
        { error: new Error('test'), expectedCode: 'CACHE_ERROR' },
        { error: 'string', expectedCode: 'UNKNOWN_ERROR' },
        { error: null, expectedCode: 'UNKNOWN_ERROR' },
        { error: undefined, expectedCode: 'UNKNOWN_ERROR' },
      ];

      scenarios.forEach(({ error, expectedCode }) => {
        try {
          ErrorHandler.handle(error, 'test');
        } catch (caught) {
          expect((caught as CacheError).code).toBe(expectedCode);
        }
      });
    });

    test('should use TIMEOUT code for timeout errors', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('late'), 2000));
      
      try {
        await ErrorHandler.withTimeout(promise, 1000, 'test');
      } catch (error) {
        expect((error as CacheError).code).toBe('TIMEOUT');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty context string', () => {
      const error = new Error('test error');
      
      try {
        ErrorHandler.handle(error, '');
      } catch (caught) {
        expect((caught as CacheError).message).toBe(': test error');
      }
    });

    test('should handle very long context string', () => {
      const longContext = 'context'.repeat(1000);
      const error = new Error('test error');
      
      try {
        ErrorHandler.handle(error, longContext);
      } catch (caught) {
        expect((caught as CacheError).message).toBe(`${longContext}: test error`);
      }
    });

    test('should handle special characters in context', () => {
      const context = 'context-with-special-chars-!@#$%^&*()';
      const error = new Error('test error');
      
      try {
        ErrorHandler.handle(error, context);
      } catch (caught) {
        expect((caught as CacheError).message).toBe(`${context}: test error`);
      }
    });
  });
});