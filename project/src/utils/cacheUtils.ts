/**
 * Cache management utilities
 */

// API Response Cache
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache = new Map<string, CacheEntry>();
  private defaultExpiry = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, expiry?: number): void {
    const expiryTime = expiry || this.defaultExpiry;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiryTime
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiry;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key for API requests
  generateKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }
}

// Global API cache instance
export const apiCache = new APICache();

// Cache decorator for API functions
export function withCache(expiry?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const cacheKey = apiCache.generateKey(propertyName, args);
      const cached = apiCache.get(cacheKey);
      
      if (cached) {
        console.log(`📦 Cache hit for ${propertyName}`);
        return cached;
      }

      const result = await method.apply(this, args);
      apiCache.set(cacheKey, result, expiry);
      console.log(`💾 Cached result for ${propertyName}`);
      
      return result;
    };
  };
}

export const clearCache = async (): Promise<void> => {
  try {
    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      } catch (error) {
        console.warn('Could not clear IndexedDB:', error);
      }
    }

    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const hardReload = (): void => {
  // Force a hard reload that bypasses cache
  window.location.reload();
};

export const clearCacheAndReload = async (): Promise<void> => {
  await clearCache();
  hardReload();
};

export const addCacheBustingToUrl = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
};

export const preloadCriticalResources = (): void => {
  // Preload critical CSS and JS files
  const criticalResources = [
    '/src/main.tsx',
    '/src/App.tsx',
    '/src/index.css'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = addCacheBustingToUrl(resource);
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });
};