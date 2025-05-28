import {useEffect, useState, useCallback} from 'react';
import {PerformanceService} from '../services/PerformanceService';

export interface UsePerformanceResult {
  startTimer: (name: string, metadata?: Record<string, any>) => void;
  endTimer: (name: string) => number | null;
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  trackScreenView: (screenName: string) => void;
  getPerformanceSummary: () => any;
  getAnalyticsSummary: () => any;
  getMemoryUsage: () => any;
  optimizeStorage: () => void;
}

export function usePerformance(): UsePerformanceResult {
  const [performanceService] = useState(() => PerformanceService.getInstance());

  const startTimer = useCallback((name: string, metadata?: Record<string, any>) => {
    performanceService.startTimer(name, metadata);
  }, [performanceService]);

  const endTimer = useCallback((name: string): number | null => {
    return performanceService.endTimer(name);
  }, [performanceService]);

  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    performanceService.trackEvent(name, properties);
  }, [performanceService]);

  const trackScreenView = useCallback((screenName: string) => {
    performanceService.trackScreenView(screenName);
  }, [performanceService]);

  const getPerformanceSummary = useCallback(() => {
    return performanceService.getPerformanceSummary();
  }, [performanceService]);

  const getAnalyticsSummary = useCallback(() => {
    return performanceService.getAnalyticsSummary();
  }, [performanceService]);

  const getMemoryUsage = useCallback(() => {
    return performanceService.getMemoryUsage();
  }, [performanceService]);

  const optimizeStorage = useCallback(() => {
    performanceService.optimizeStorage();
  }, [performanceService]);

  return {
    startTimer,
    endTimer,
    trackEvent,
    trackScreenView,
    getPerformanceSummary,
    getAnalyticsSummary,
    getMemoryUsage,
    optimizeStorage,
  };
}

// Hook for automatic screen tracking
export function useScreenTracking(screenName: string): void {
  const {trackScreenView} = usePerformance();

  useEffect(() => {
    trackScreenView(screenName);
  }, [screenName, trackScreenView]);
}

// Hook for operation timing
export function useOperationTimer(): {
  timeOperation: <T>(operationName: string, operation: () => T) => T;
  timeAsyncOperation: <T>(operationName: string, operation: () => Promise<T>) => Promise<T>;
} {
  const {startTimer, endTimer} = usePerformance();

  const timeOperation = useCallback(<T>(operationName: string, operation: () => T): T => {
    const timerName = `${operationName}_${Date.now()}`;
    startTimer(timerName);
    try {
      const result = operation();
      return result;
    } finally {
      endTimer(timerName);
    }
  }, [startTimer, endTimer]);

  const timeAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const timerName = `${operationName}_${Date.now()}`;
    startTimer(timerName);
    try {
      const result = await operation();
      return result;
    } finally {
      endTimer(timerName);
    }
  }, [startTimer, endTimer]);

  return {
    timeOperation,
    timeAsyncOperation,
  };
}
