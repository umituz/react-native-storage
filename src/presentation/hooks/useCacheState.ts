/**
 * Cache State Manager
 *
 * Manages cache state following Single Responsibility Principle
 */

import { useState, useCallback, useMemo } from 'react';

export interface CacheState<T> {
  data: T | null;
  isLoading: boolean;
  isExpired: boolean;
}

export interface CacheActions<T> {
  setData: (value: T) => void;
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setExpired: (expired: boolean) => void;
}

/**
 * Hook for managing cache state
 */
export function useCacheState<T>(): [CacheState<T>, CacheActions<T>] {
  const [data, setDataState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  const setData = useCallback((value: T) => {
    setDataState(value);
    setIsExpired(false);
  }, []);

  const clearData = useCallback(() => {
    setDataState(null);
    setIsExpired(true);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setExpired = useCallback((expired: boolean) => {
    setIsExpired(expired);
  }, []);

  // Memoize state and actions objects for performance
  const state: CacheState<T> = useMemo(() => ({ data, isLoading, isExpired }), [data, isLoading, isExpired]);
  const actions: CacheActions<T> = useMemo(() => ({ setData, clearData, setLoading, setExpired }), [setData, clearData, setLoading, setExpired]);

  return [state, actions];
}