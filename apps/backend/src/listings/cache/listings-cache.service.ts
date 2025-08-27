import { Injectable, Inject } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { cacheHitTotal, cacheMissTotal } from '../../observability/metrics';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
  expiresAt: number;
  version: number;
}

export interface ListingsCacheOptions {
  ttl: number; // Time to live in milliseconds
  staleTtl: number; // Time after which data is stale but still served
  warmupThreshold: number; // Threshold for triggering background refresh
}

@Injectable()
export class ListingsCacheService {
  private readonly defaultOptions: ListingsCacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes
    staleTtl: 2 * 60 * 1000, // 2 minutes (serve stale for 3 minutes)
    warmupThreshold: 30 * 1000, // Start background refresh 30s before stale
  };

  private readonly backgroundRefreshPromises = new Map<string, Promise<any>>();

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  /**
   * Generate cache key for listings query
   */
  generateListingsKey(query: Record<string, any>): string {
    const normalized = this.normalizeQuery(query);
    return `listings:v2:${JSON.stringify(normalized)}`;
  }

  /**
   * Get cached listings with stale-while-revalidate logic
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: Partial<ListingsCacheOptions> = {},
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();

    try {
      const cached = await this.cache.get<CacheEntry<T>>(key);
      
      if (cached) {
        // Data exists in cache
        if (now < cached.staleAt) {
          // Fresh data - return immediately
          this.recordCacheHit(key);
          return cached.data;
        }
        
        if (now < cached.expiresAt) {
          // Stale but not expired - serve stale and refresh in background
          this.recordCacheHit(key, true);
          this.scheduleBackgroundRefresh(key, fetchFn, opts);
          return cached.data;
        }
      }

      // Cache miss or expired - fetch fresh data
      this.recordCacheMiss(key);
      return await this.fetchAndCache(key, fetchFn, opts);
    } catch (error) {
      console.error(`Cache error for key ${key}:`, error);
      // On cache error, fetch directly
      return await fetchFn();
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // For Redis-based cache stores
      const redisClient = (this.cache as any).store?.client;
      
      if (redisClient && typeof redisClient.keys === 'function') {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        // Fallback for other cache stores - clear all listings cache
        await this.invalidateListingsCache();
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate all listings cache
   */
  async invalidateListingsCache(): Promise<void> {
    await this.invalidatePattern('listings:v2:*');
  }

  /**
   * Invalidate specific listing and related caches
   */
  async invalidateListing(listingId: string): Promise<void> {
    // Invalidate all listings queries since a listing changed
    await this.invalidateListingsCache();
    
    // Also invalidate specific listing cache if it exists
    await this.cache.del(`listing:${listingId}`);
  }

  /**
   * Warmup cache with popular queries
   */
  async warmupCache(
    popularQueries: Array<{ query: Record<string, any>; fetchFn: () => Promise<any> }>,
  ): Promise<void> {
    const warmupPromises = popularQueries.map(async ({ query, fetchFn }) => {
      const key = this.generateListingsKey(query);
      try {
        await this.fetchAndCache(key, fetchFn, this.defaultOptions);
      } catch (error) {
        console.error(`Warmup failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: ListingsCacheOptions,
  ): Promise<T> {
    const data = await fetchFn();
    const now = Date.now();
    
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: now,
      staleAt: now + options.staleTtl,
      expiresAt: now + options.ttl,
      version: 1,
    };

    await this.cache.set(key, cacheEntry, Math.ceil(options.ttl / 1000));
    return data;
  }

  private scheduleBackgroundRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: ListingsCacheOptions,
  ): void {
    // Prevent multiple background refreshes for the same key
    if (this.backgroundRefreshPromises.has(key)) {
      return;
    }

    const refreshPromise = this.backgroundRefresh(key, fetchFn, options);
    this.backgroundRefreshPromises.set(key, refreshPromise);

    // Clean up promise when done
    refreshPromise.finally(() => {
      this.backgroundRefreshPromises.delete(key);
    });
  }

  private async backgroundRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: ListingsCacheOptions,
  ): Promise<void> {
    try {
      await this.fetchAndCache(key, fetchFn, options);
    } catch (error) {
      console.error(`Background refresh failed for key ${key}:`, error);
    }
  }

  private normalizeQuery(query: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    // Sort keys for consistent cache keys
    const sortedKeys = Object.keys(query).sort();
    
    for (const key of sortedKeys) {
      const value = query[key];
      if (value !== undefined && value !== null && value !== '') {
        normalized[key] = value;
      }
    }
    
    return normalized;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private recordCacheHit(key: string, isStale = false): void {
    try {
      cacheHitTotal.inc({ source: 'listings_cache' });
    } catch {
      // Metrics should never break the flow
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private recordCacheMiss(key: string): void {
    try {
      cacheMissTotal.inc({ source: 'listings_cache' });
    } catch {
      // Metrics should never break the flow
    }
  }
}