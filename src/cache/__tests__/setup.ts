/**
 * Test Setup
 */

// Mock console methods in test environment
(global as any).console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock __DEV__ for testing
(global as any).__DEV__ = true;

// Mock timers globally
jest.useFakeTimers({
  doNotFake: ['nextTick', 'setImmediate']
});