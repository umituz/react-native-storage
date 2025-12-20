/**
 * useStorage Hook Tests
 *
 * Unit tests for useStorage hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useStorage } from '../useStorage';
import { AsyncStorage } from '../../__tests__/mocks/asyncStorage.mock';

describe('useStorage Hook', () => {
  beforeEach(() => {
    (AsyncStorage as any).__clear();
    jest.clearAllMocks();
  });

  describe('getItem', () => {
    it('should get item from storage', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const expectedValue = 'test-value';

      await AsyncStorage.setItem(key, JSON.stringify(expectedValue));

      const { result } = renderHook(() => useStorage());

      const value = await result.current.getItem(key, defaultValue);

      expect(value).toBe(expectedValue);
    });

    it('should return default value for missing key', async () => {
      const key = 'missing-key';
      const defaultValue = 'default';

      const { result } = renderHook(() => useStorage());

      const value = await result.current.getItem(key, defaultValue);

      expect(value).toBe(defaultValue);
    });

    it('should handle StorageKey enum', async () => {
      const key = '@ui_preferences';
      const defaultValue = 'default';
      const expectedValue = 'test-value';

      await AsyncStorage.setItem(key, JSON.stringify(expectedValue));

      const { result } = renderHook(() => useStorage());

      const value = await result.current.getItem(key as any, defaultValue);

      expect(value).toBe(expectedValue);
    });
  });

  describe('setItem', () => {
    it('should set item to storage', async () => {
      const key = 'test-key';
      const value = 'test-value';

      const { result } = renderHook(() => useStorage());

      const success = await result.current.setItem(key, value);

      expect(success).toBe(true);

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      expect(JSON.parse(stored!)).toBe(value);
    });

    it('should return false on failure', async () => {
      const key = 'test-key';
      const value = { circular: {} };
      value.circular = value; // Create circular reference

      const { result } = renderHook(() => useStorage());

      const success = await result.current.setItem(key, value);

      expect(success).toBe(false);
    });
  });

  describe('getString', () => {
    it('should get string from storage', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const expectedValue = 'test-string';

      await AsyncStorage.setItem(key, expectedValue);

      const { result } = renderHook(() => useStorage());

      const value = await result.current.getString(key, defaultValue);

      expect(value).toBe(expectedValue);
    });
  });

  describe('setString', () => {
    it('should set string to storage', async () => {
      const key = 'test-key';
      const value = 'test-string';

      const { result } = renderHook(() => useStorage());

      const success = await result.current.setString(key, value);

      expect(success).toBe(true);

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      expect(stored).toBe(value);
    });
  });

  describe('removeItem', () => {
    it('should remove item from storage', async () => {
      const key = 'test-key';

      // Setup
      await AsyncStorage.setItem(key, 'test-value');

      const { result } = renderHook(() => useStorage());

      const success = await result.current.removeItem(key);

      expect(success).toBe(true);

      // Verify removal
      const stored = await AsyncStorage.getItem(key);
      expect(stored).toBeNull();
    });
  });

  describe('hasItem', () => {
    it('should return true for existing item', async () => {
      const key = 'test-key';

      await AsyncStorage.setItem(key, 'test-value');

      const { result } = renderHook(() => useStorage());

      const exists = await result.current.hasItem(key);

      expect(exists).toBe(true);
    });

    it('should return false for missing item', async () => {
      const key = 'missing-key';

      const { result } = renderHook(() => useStorage());

      const exists = await result.current.hasItem(key);

      expect(exists).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all storage', async () => {
      // Setup
      await AsyncStorage.setItem('key1', 'value1');
      await AsyncStorage.setItem('key2', 'value2');

      const { result } = renderHook(() => useStorage());

      const success = await result.current.clearAll();

      expect(success).toBe(true);

      // Verify clear
      const keys = await AsyncStorage.getAllKeys();
      expect(keys).toHaveLength(0);
    });
  });

  describe('getItemWithResult', () => {
    it('should return full result object', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const expectedValue = 'test-value';

      await AsyncStorage.setItem(key, JSON.stringify(expectedValue));

      const { result } = renderHook(() => useStorage());

      const storageResult = await result.current.getItemWithResult(key, defaultValue);

      expect(storageResult.success).toBe(true);
      expect(storageResult.data).toBe(expectedValue);
      expect(storageResult.error).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should memoize return object', () => {
      const { result, rerender } = renderHook(() => useStorage());

      const firstCall = result.current;
      rerender();
      const secondCall = result.current;

      // Should be the same reference (memoized)
      expect(firstCall).toBe(secondCall);
    });

    it('should not recreate functions on re-render', () => {
      const { result, rerender } = renderHook(() => useStorage());

      const firstFunctions = {
        getItem: result.current.getItem,
        setItem: result.current.setItem,
        getString: result.current.getString,
        setString: result.current.setString,
        removeItem: result.current.removeItem,
        hasItem: result.current.hasItem,
        clearAll: result.current.clearAll,
        getItemWithResult: result.current.getItemWithResult,
      };

      rerender();

      const secondFunctions = {
        getItem: result.current.getItem,
        setItem: result.current.setItem,
        getString: result.current.getString,
        setString: result.current.setString,
        removeItem: result.current.removeItem,
        hasItem: result.current.hasItem,
        clearAll: result.current.clearAll,
        getItemWithResult: result.current.getItemWithResult,
      };

      // All functions should be the same reference
      Object.keys(firstFunctions).forEach(key => {
        expect(firstFunctions[key as keyof typeof firstFunctions]).toBe(
          secondFunctions[key as keyof typeof secondFunctions]
        );
      });
    });
  });
});