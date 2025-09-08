// Performance optimization utilities

/**
 * Preload critical resources to improve LCP
 */
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;

  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.as = 'style';
  criticalCSS.href = '/css/critical.css';
  document.head.appendChild(criticalCSS);

  // Preload critical fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.href = '/fonts/roboto.woff2';
  fontPreload.crossOrigin = 'anonymous';
  document.head.appendChild(fontPreload);
};

/**
 * Defer non-critical JavaScript execution
 */
export const deferNonCriticalJS = (callback: () => void) => {
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 0);
  }
};

/**
 * Optimize image loading
 */
export const optimizeImageLoading = (img: HTMLImageElement) => {
  if (typeof window === 'undefined') return;

  // Add loading="lazy" for images below the fold
  img.loading = 'lazy';
  
  // Add decoding="async" for better performance
  img.decoding = 'async';
};

/**
 * Reduce layout thrashing by batching DOM updates
 */
export const batchDOMUpdates = (updates: (() => void)[]) => {
  if (typeof window === 'undefined') return;

  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

/**
 * Monitor Core Web Vitals
 */
export const monitorWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Monitor LCP
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Monitor FID
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      console.log('FID:', entry.processingStart - entry.startTime);
    });
  }).observe({ entryTypes: ['first-input'] });

  // Monitor CLS
  new PerformanceObserver((entryList) => {
    let clsValue = 0;
    for (const entry of entryList.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    console.log('CLS:', clsValue);
  }).observe({ entryTypes: ['layout-shift'] });
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  markStart: (name: string) => {
    if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
      window.performance.mark(`${name}-start`);
    }
  },
  
  markEnd: (name: string) => {
    if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }
};