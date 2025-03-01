import { VectorCacheConfig, VectorError } from '../types/vector-operations.js';

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: VectorCacheConfig = {
  ttl: 3600000, // 1 hour
  maxSize: 10000,
  enabled: true,
  namespace: 'default'
};

/**
 * In-memory cache for vector operations
 */
export class VectorCacheService {
  private cache: Map<string, { vector: number[]; expiry: number }>;
  private config: VectorCacheConfig;

  constructor(config: Partial<VectorCacheConfig> = {}) {
    this.cache = new Map();
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Get vector from cache
   */
  public async get(key: string): Promise<number[] | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.vector;
  }

  /**
   * Set vector in cache
   */
  public async set(key: string, vector: number[], ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Enforce max size limit
    if (this.cache.size >= this.config.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      vector,
      expiry: Date.now() + (ttl || this.config.ttl)
    });
  }

  /**
   * Delete vector from cache
   */
  public async delete(key: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.cache.delete(key);
  }

  /**
   * Clear all vectors from cache
   */
  public async clear(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.cache.clear();
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
