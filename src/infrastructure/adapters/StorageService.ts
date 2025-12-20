/**
 * Storage Service
 *
 * Zustand persist middleware compatible StateStorage implementation.
 * Uses AsyncStorage under the hood for React Native persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { devWarn } from '../../domain/utils/devUtils';

/**
 * StateStorage interface for Zustand persist middleware
 */
export interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
}

/**
 * Storage service for Zustand persist middleware
 * Direct AsyncStorage implementation with proper error handling
 */
export const storageService: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (error) {
      devWarn(`StorageService: Failed to get item "${name}"`, error);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      devWarn(`StorageService: Failed to set item "${name}"`, error);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      devWarn(`StorageService: Failed to remove item "${name}"`, error);
    }
  },
};
