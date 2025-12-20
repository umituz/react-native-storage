/**
 * useStorageState Hook Tests
 *
 * Unit tests for useStorageState hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useStorageState } from '../useStorageState';
import { AsyncStorage } from '../../__tests__/mocks/asyncStorage.mock';

describe('useStorageState Hook', () => {
  beforeEach(() => {
    (AsyncStorage as any).__clear();
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should load initial value from storage', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const storedValue = 'stored-value';

      await AsyncStorage.setItem(key, JSON.stringify(storedValue));

      const { result, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      // Initial state
      expect(result.current[0]).toBe(defaultValue);
      expect(result.current[2]).toBe(true); // isLoading

      // Wait for load
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current[0]).toBe(storedValue);
      expect(result.current[2]).toBe(false); // isLoading
    });

    it('should use default value for missing key', async () => {
      const key = 'missing-key';
      const defaultValue = 'default';

      const { result, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current[0]).toBe(defaultValue);
      expect(result.current[2]).toBe(false);
    });

    it('should handle StorageKey enum', async () => {
      const key = '@ui_preferences';
      const defaultValue = 'default';
      const storedValue = 'stored-value';

      await AsyncStorage.setItem(key, JSON.stringify(storedValue));

      const { result, waitForNextUpdate } = renderHook(() => 
        useStorageState(key as any, defaultValue)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current[0]).toBe(storedValue);
    });
  });

  describe('Update State', () => {
    it('should update state and persist to storage', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const newValue = 'new-value';

      const { result, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // Update state
      await act(async () => {
        await result.current[1](newValue);
      });

      expect(result.current[0]).toBe(newValue);

      // Verify storage
      const stored = await AsyncStorage.getItem(key);
      expect(JSON.parse(stored!)).toBe(newValue);
    });

    it('should handle update during loading', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const newValue = 'new-value';

      // Mock slow storage
      let resolveStorage: (value: string) => void;
      (AsyncStorage.getItem as jest.Mock).mockImplementation(() => 
        new Promise(resolve => {
          resolveStorage = resolve;
        })
      );

      const { result } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      // Update while loading
      await act(async () => {
        await result.current[1](newValue);
      });

      expect(result.current[0]).toBe(newValue);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should cleanup on unmount', async () => {
      const key = 'test-key';
      const defaultValue = 'default';

      // Mock slow storage
      let resolveStorage: (value: string) => void;
      (AsyncStorage.getItem as jest.Mock).mockImplementation(() => 
        new Promise(resolve => {
          resolveStorage = resolve;
        })
      );

      const { result, unmount } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      // Unmount before load completes
      unmount();

      // Resolve storage after unmount
      await act(async () => {
        resolveStorage!('stored-value');
      });

      // State should not be updated after unmount
      expect(result.current[0]).toBe(defaultValue);
    });

    it('should handle unmount during update', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const newValue = 'new-value';

      // Mock slow storage
      let resolveStorage: () => void;
      (AsyncStorage.setItem as jest.Mock).mockImplementation(() => 
        new Promise(resolve => {
          resolveStorage = resolve;
        })
      );

      const { result, unmount } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      // Start update
      const updatePromise = act(async () => {
        await result.current[1](newValue);
      });

      // Unmount before update completes
      unmount();

      // Complete update
      await act(async () => {
        resolveStorage!();
      });

      await updatePromise;
    });
  });

  describe('Performance', () => {
    it('should not re-run effect when defaultValue changes', async () => {
      const key = 'test-key';
      const defaultValue1 = 'default1';
      const defaultValue2 = 'default2';

      await AsyncStorage.setItem(key, JSON.stringify('stored-value'));

      const { result, rerender, waitForNextUpdate } = renderHook(
        ({ defaultValue }) => useStorageState(key, defaultValue),
        { initialProps: { defaultValue: defaultValue1 } }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      const getItemCalls = (AsyncStorage.getItem as jest.Mock).mock.calls.length;

      // Rerender with different default value
      rerender({ defaultValue: defaultValue2 });

      // Should not trigger another storage read
      expect((AsyncStorage.getItem as jest.Mock).mock.calls.length).toBe(getItemCalls);
    });

    it('should re-run effect when key changes', async () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const defaultValue = 'default';

      await AsyncStorage.setItem(key1, JSON.stringify('value1'));
      await AsyncStorage.setItem(key2, JSON.stringify('value2'));

      const { result, rerender, waitForNextUpdate } = renderHook(
        ({ key }) => useStorageState(key, defaultValue),
        { initialProps: { key: key1 } }
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current[0]).toBe('value1');

      // Change key
      rerender({ key: key2 });

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current[0]).toBe('value2');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage read error', async () => {
      const key = 'test-key';
      const defaultValue = 'default';

      // Mock storage error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { result, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current[0]).toBe(defaultValue);
      expect(result.current[2]).toBe(false); // isLoading should be false
    });

    it('should handle storage write error', async () => {
      const key = 'test-key';
      const defaultValue = 'default';
      const newValue = 'new-value';

      // Mock storage error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { result, waitForNextUpdate } = renderHook(() => 
        useStorageState(key, defaultValue)
      );

      await act(async () => {
        await waitForNextUpdate();
      });

      // State should still update even if storage fails
      await act(async () => {
        await result.current[1](newValue);
      });

      expect(result.current[0]).toBe(newValue);
    });
  });
});