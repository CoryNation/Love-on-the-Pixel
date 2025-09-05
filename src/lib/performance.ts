// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  markStart(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      this.metrics.set(name, window.performance.now());
    }
  }

  // Mark the end of a performance measurement and log the duration
  markEnd(name: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = this.metrics.get(name);
      if (startTime !== undefined) {
        const duration = window.performance.now() - startTime;
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        this.metrics.delete(name);
        return duration;
      }
    }
    return 0;
  }

  // Measure the performance of a function
  async measureFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.markStart(name);
    try {
      const result = await fn();
      this.markEnd(name);
      return result;
    } catch (error) {
      this.markEnd(name);
      throw error;
    }
  }

  // Get Core Web Vitals metrics
  getWebVitals(): void {
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      // This would require the web-vitals package
      console.log('Web Vitals monitoring available');
    }
  }

  // Log bundle size information
  logBundleInfo(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log('Performance Metrics:', {
          'DOM Content Loaded': `${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`,
          'Load Complete': `${(navigation.loadEventEnd - navigation.loadEventStart).toFixed(2)}ms`,
          'First Byte': `${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`,
          'DOM Interactive': `${(navigation.domInteractive - navigation.navigationStart).toFixed(2)}ms`,
        });
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Performance optimization utilities
export const optimizeImages = (src: string, width?: number, height?: number): string => {
  // Add image optimization parameters
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', '80'); // Quality
  params.set('f', 'webp'); // Format
  
  return `${src}?${params.toString()}`;
};

// Debounce function for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
