/**
 * Test Setup
 *
 * Global test configuration and mocks
 */

import 'jest-environment-jsdom';

// Mock __DEV__ global
Object.defineProperty(globalThis, '__DEV__', {
  value: true,
  writable: true,
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
  },
}));

// Mock console for __DEV__ checks
const originalConsole = { ...console };

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Restore console after each test
  Object.assign(console, originalConsole);
});

// Performance test utilities
export const mockPerformance = () => {
  const mockPerformance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  };
  
  globalThis.performance = mockPerformance as any;
  return mockPerformance;
};

// Memory leak test utilities
export const trackMemoryUsage = () => {
  const listeners = new Set<() => void>();
  
  return {
    addListener: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getListenerCount: () => listeners.size,
    cleanup: () => listeners.clear(),
  };
};