export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface AnalyticsEvent {
  name: string;
  timestamp: number;
  properties: Record<string, any>;
  userId?: string;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private events: AnalyticsEvent[] = [];
  private maxStoredEvents = 100;

  private constructor() {}

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Performance monitoring
  startTimer(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: Date.now(),
      metadata,
    });
  }

  endTimer(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No timer found for ${name}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(name, {
      ...metric,
      endTime,
      duration,
    });

    return duration;
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  // Analytics tracking
  trackEvent(name: string, properties: Record<string, any> = {}, userId?: string): void {
    const event: AnalyticsEvent = {
      name,
      timestamp: Date.now(),
      properties,
      userId,
    };

    this.events.push(event);

    // Maintain max events limit
    if (this.events.length > this.maxStoredEvents) {
      this.events.shift();
    }

    // Log important events
    console.log(`Analytics: ${name}`, properties);
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getEventsByName(name: string): AnalyticsEvent[] {
    return this.events.filter(event => event.name === name);
  }

  clearEvents(): void {
    this.events = [];
  }

  // Common tracking methods
  trackScreenView(screenName: string, userId?: string): void {
    this.trackEvent('screen_view', {screen_name: screenName}, userId);
  }

  trackQRScan(success: boolean, scanType: 'camera' | 'manual', userId?: string): void {
    this.trackEvent('qr_scan', {
      success,
      scan_type: scanType,
      timestamp: Date.now(),
    }, userId);
  }

  trackIdentityCreated(verificationStatus: boolean, source: string, userId?: string): void {
    this.trackEvent('identity_created', {
      verified: verificationStatus,
      source,
    }, userId);
  }

  trackIdentityValidation(score: number, errors: number, warnings: number, userId?: string): void {
    this.trackEvent('identity_validation', {
      score,
      errors,
      warnings,
    }, userId);
  }

  trackStorageOperation(operation: 'create' | 'read' | 'update' | 'delete', success: boolean, userId?: string): void {
    this.trackEvent('storage_operation', {
      operation,
      success,
    }, userId);
  }

  // Performance analysis
  getPerformanceSummary(): {
    slowestOperations: Array<{name: string; duration: number}>;
    averageDurations: Record<string, number>;
    totalOperations: number;
  } {
    const completedMetrics = this.getAllMetrics();

    // Find slowest operations
    const slowestOperations = completedMetrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5)
      .map(metric => ({
        name: metric.name,
        duration: metric.duration || 0,
      }));

    // Calculate average durations by operation name
    const operationGroups = completedMetrics.reduce((groups, metric) => {
      const baseName = metric.name.split('_')[0]; // Group by operation type
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(metric.duration || 0);
      return groups;
    }, {} as Record<string, number[]>);

    const averageDurations = Object.entries(operationGroups).reduce((avgs, [name, durations]) => {
      avgs[name] = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
      return avgs;
    }, {} as Record<string, number>);

    return {
      slowestOperations,
      averageDurations,
      totalOperations: completedMetrics.length,
    };
  }

  getAnalyticsSummary(): {
    eventCounts: Record<string, number>;
    recentEvents: AnalyticsEvent[];
    userActivity: Record<string, number>;
  } {
    // Count events by name
    const eventCounts = this.events.reduce((counts, event) => {
      counts[event.name] = (counts[event.name] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    // Get recent events (last 10)
    const recentEvents = this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    // Count events by user
    const userActivity = this.events.reduce((activity, event) => {
      const userId = event.userId || 'anonymous';
      activity[userId] = (activity[userId] || 0) + 1;
      return activity;
    }, {} as Record<string, number>);

    return {
      eventCounts,
      recentEvents,
      userActivity,
    };
  }

  // Memory and resource monitoring
  getMemoryUsage(): {
    metricsCount: number;
    eventsCount: number;
    estimatedMemoryKB: number;
  } {
    const metricsSize = JSON.stringify(Array.from(this.metrics.values())).length;
    const eventsSize = JSON.stringify(this.events).length;
    const estimatedMemoryKB = Math.round((metricsSize + eventsSize) / 1024);

    return {
      metricsCount: this.metrics.size,
      eventsCount: this.events.length,
      estimatedMemoryKB,
    };
  }

  // Cleanup and optimization
  optimizeStorage(): void {
    // Remove old completed metrics (keep only last 50)
    const completedMetrics = this.getAllMetrics()
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, 50);

    // Clear and re-add only recent metrics
    this.metrics.clear();
    completedMetrics.forEach(metric => {
      this.metrics.set(metric.name, metric);
    });

    // Keep only recent events
    this.events = this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, this.maxStoredEvents);
  }

  // Export data for external analytics
  exportData(): {
    metrics: PerformanceMetric[];
    events: AnalyticsEvent[];
    summary: any;
  } {
    return {
      metrics: this.getAllMetrics(),
      events: this.getEvents(),
      summary: {
        performance: this.getPerformanceSummary(),
        analytics: this.getAnalyticsSummary(),
        memory: this.getMemoryUsage(),
      },
    };
  }

  // Import data (for testing or data migration)
  importData(data: {
    metrics?: PerformanceMetric[];
    events?: AnalyticsEvent[];
  }): void {
    if (data.metrics) {
      data.metrics.forEach(metric => {
        this.metrics.set(metric.name, metric);
      });
    }

    if (data.events) {
      this.events.push(...data.events);
      // Maintain limit
      if (this.events.length > this.maxStoredEvents) {
        this.events = this.events.slice(-this.maxStoredEvents);
      }
    }
  }
}

// Decorator for automatic performance tracking
export function trackPerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const trackingName = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = function (...args: any[]) {
      const performanceService = PerformanceService.getInstance();
      const timerName = `${trackingName}_${Date.now()}`;

      performanceService.startTimer(timerName, {
        className: target.constructor.name,
        methodName: propertyName,
        args: args.length,
      });

      try {
        const result = method.apply(this, args);

        // Handle async methods
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            performanceService.endTimer(timerName);
          });
        } else {
          performanceService.endTimer(timerName);
          return result;
        }
      } catch (error) {
        performanceService.endTimer(timerName);
        throw error;
      }
    };

    return descriptor;
  };
}
