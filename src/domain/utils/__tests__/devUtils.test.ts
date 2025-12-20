/**
 * Development Utilities Tests
 */

import { isDev, devWarn, devError, devLog } from '../devUtils';

// Mock console methods
const mockConsoleWarn = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleLog = jest.fn();

describe('Development Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    console.warn = mockConsoleWarn;
    console.error = mockConsoleError;
    console.log = mockConsoleLog;
  });

  describe('isDev', () => {
    it('should return true when __DEV__ is true', () => {
      (globalThis as any).__DEV__ = true;
      expect(isDev()).toBe(true);
    });

    it('should return false when __DEV__ is false', () => {
      (globalThis as any).__DEV__ = false;
      expect(isDev()).toBe(false);
    });

    it('should return false when __DEV__ is undefined', () => {
      delete (globalThis as any).__DEV__;
      expect(isDev()).toBe(false);
    });
  });

  describe('devWarn', () => {
    it('should log warning when in development mode', () => {
      (globalThis as any).__DEV__ = true;
      
      devWarn('Test warning', { data: 'test' });
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('Test warning', { data: 'test' });
    });

    it('should not log warning when not in development mode', () => {
      (globalThis as any).__DEV__ = false;
      
      devWarn('Test warning', { data: 'test' });
      
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });
  });

  describe('devError', () => {
    it('should log error when in development mode', () => {
      (globalThis as any).__DEV__ = true;
      
      devError('Test error', new Error('test'));
      
      expect(mockConsoleError).toHaveBeenCalledWith('Test error', new Error('test'));
    });

    it('should not log error when not in development mode', () => {
      (globalThis as any).__DEV__ = false;
      
      devError('Test error', new Error('test'));
      
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('devLog', () => {
    it('should log info when in development mode', () => {
      (globalThis as any).__DEV__ = true;
      
      devLog('Test log', { info: 'test' });
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Test log', { info: 'test' });
    });

    it('should not log info when not in development mode', () => {
      (globalThis as any).__DEV__ = false;
      
      devLog('Test log', { info: 'test' });
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  afterEach(() => {
    // Clean up __DEV__ after each test
    delete (globalThis as any).__DEV__;
  });
});