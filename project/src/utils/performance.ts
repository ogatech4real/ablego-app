import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  private constructor() {
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('pageLoad', navEntry.loadEventEnd - navEntry.loadEventStart);
              this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
              this.recordMetric('firstPaint', navEntry.loadEventEnd - navEntry.fetchStart);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Monitor paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'paint') {
              const paintEntry = entry as PerformancePaintTiming;
              this.recordMetric(paintEntry.name, paintEntry.startTime);
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (error) {
        console.warn('Paint timing observer not supported:', error);
      }
    }
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetricAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMetricStats(name: string): { min: number; max: number; avg: number; count: number } {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return { min, max, avg, count: values.length };
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Lazy loading utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, error, placeholder };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const callback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setIsIntersecting(entry.isIntersecting);
    setEntry(entry);
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(callback, options);
    observer.observe(element);

    return () => observer.disconnect();
  }, [callback, options]);

  return { elementRef, isIntersecting, entry };
};

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Memoization utilities
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Virtual scrolling utilities
export const useVirtualScrolling = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      itemCount
    );
    
    return {
      start: Math.max(0, start - overscan),
      end,
      offsetY: start * itemHeight
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, itemCount]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange,
    handleScroll,
    totalHeight: itemCount * itemHeight
  };
};

// Bundle size monitoring
export const getBundleSize = async (): Promise<{ [chunk: string]: number }> => {
  if (import.meta.env.DEV) {
    return {};
  }

  try {
    const response = await fetch('/bundle-analyzer-report.json');
    if (response.ok) {
      const data = await response.json();
      return data.chunks || {};
    }
  } catch (error) {
    console.warn('Bundle analyzer report not available:', error);
  }

  return {};
};

// Performance budget checking
export const checkPerformanceBudget = (metrics: { [key: string]: number }) => {
  const budgets = {
    pageLoad: 3000, // 3 seconds
    firstPaint: 1000, // 1 second
    domContentLoaded: 1500, // 1.5 seconds
    bundleSize: 500 * 1024, // 500KB
  };

  const violations: string[] = [];

  Object.entries(metrics).forEach(([metric, value]) => {
    const budget = budgets[metric as keyof typeof budgets];
    if (budget && value > budget) {
      violations.push(`${metric}: ${value}ms (budget: ${budget}ms)`);
    }
  });

  return {
    withinBudget: violations.length === 0,
    violations
  };
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const recordMetric = (name: string, value: number) =>
  performanceMonitor.recordMetric(name, value);

export const getMetricStats = (name: string) =>
  performanceMonitor.getMetricStats(name);

export const clearMetrics = () =>
  performanceMonitor.clearMetrics();
