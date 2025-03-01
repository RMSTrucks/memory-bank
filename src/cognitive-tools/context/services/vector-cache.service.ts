import { VectorCache, VectorCacheConfig, VectorError } from '../types/vector';
import { Result } from '../../../types/common';

/**
 * In-memory cache implementation for vector operations
 */
export class VectorCacheService implements VectorCache {
  private cache: Map<string, {
    vector: number[];
    timestamp: number;
  }>;
  private config: VectorCacheConfig;
  private cacheStats: {
    hits: number;
    misses: number;
  };

  constructor(config: VectorCacheConfig) {
    this.cache = new Map();
    this.config = config;
    this.cacheStats = {
      hits: 0,
      misses: 0
    };

    // Start cleanup interval if TTL is enabled
    if (this.config.enabled && this.config.ttl > 0) {
      setInterval(() => this.cleanup(), this.config.ttl * 1000);
    }
  }

  /**
   * Get a vector from cache
   */
  public async get(key: string): Promise<number[] | null> {
    try {
      if (!this.config.enabled) {
        return null;
      }

      const namespaceKey = this.getNamespacedKey(key);
      const entry = this.cache.get(namespaceKey);

      if (!entry) {
        this.cacheStats.misses++;
        return null;
      }

      // Check if entry has expired
      if (this.hasExpired(entry.timestamp)) {
        this.cache.delete(namespaceKey);
        this.cacheStats.misses++;
        return null;
      }

      this.cacheStats.hits++;
      return entry.vector;
    } catch (error) {
      throw this.createError('Failed to get vector from cache', error);
    }
  }

  /**
   * Store a vector in cache
   */
  public async set(key: string, vector: number[]): Promise<void> {
    try {
      if (!this.config.enabled) {
        return;
      }

      const namespaceKey = this.getNamespacedKey(key);

      // Enforce cache size limit
      if (this.cache.size >= this.config.maxSize) {
        this.evictOldest();
      }

      this.cache.set(namespaceKey, {
        vector,
        timestamp: Date.now()
      });
    } catch (error) {
      throw this.createError('Failed to store vector in cache', error);
    }
  }

  /**
   * Invalidate a cached vector
   */
  public async invalidate(key: string): Promise<void> {
    try {
      const namespaceKey = this.getNamespacedKey(key);
      this.cache.delete(namespaceKey);
    } catch (error) {
      throw this.createError('Failed to invalidate cached vector', error);
    }
  }

  /**
   * Clear all cached vectors
   */
  public async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.cacheStats = {
        hits: 0,
        misses: 0
      };
    } catch (error) {
      throw this.createError('Failed to clear cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async stats(): Promise<{ hits: number; misses: number; size: number }> {
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      size: this.cache.size
    };
  }

  /**
   * Update cache configuration
   */
  public updateConfig(config: Partial<VectorCacheConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Check if a cache entry has expired
   */
  private hasExpired(timestamp: number): boolean {
    if (this.config.ttl <= 0) {
      return false;
    }
    const age = Date.now() - timestamp;
    return age > this.config.ttl * 1000;
  }

  /**
   * Remove oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.hasExpired(entry.timestamp)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get namespaced cache key
   */
  private getNamespacedKey(key: string): string {
    return this.config.namespace ? `${this.config.namespace}:${key}` : key;
  }

  /**
   * Create error object
   */
  private createError(message: string, details?: unknown): VectorError {
    return {
      code: 'CACHE_ERROR',
      message,
      details
    };
  }
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: VectorCacheConfig = {
  enabled: true,
  ttl: 3600, // 1 hour
  maxSize: 10000,
  namespace: 'vectors'
};
