/**
 * Memory Pool Implementation for Neural Computation Framework
 *
 * This file implements a memory pooling system for tensor operations to reduce
 * memory fragmentation, lower GC pressure, and improve performance by reusing
 * pre-allocated TypedArrays.
 */

import { DataType, Shape, TypedArray } from '../types/tensor';
import { calculateSize } from './tensor';

/**
 * Configuration options for the memory pool
 */
export interface MemoryPoolOptions {
  /**
   * Initial capacity for each bucket in the pool
   */
  initialCapacity?: number;

  /**
   * Maximum capacity for each bucket in the pool
   */
  maxCapacity?: number;

  /**
   * Growth factor when expanding buckets
   */
  growthFactor?: number;

  /**
   * Whether to track memory usage statistics
   */
  trackStats?: boolean;
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  /**
   * Total number of allocations
   */
  allocations: number;

  /**
   * Number of allocations from the pool
   */
  poolAllocations: number;

  /**
   * Number of releases back to the pool
   */
  releases: number;

  /**
   * Current memory usage in bytes
   */
  currentUsage: number;

  /**
   * Peak memory usage in bytes
   */
  peakUsage: number;

  /**
   * Total memory allocated in bytes
   */
  totalAllocated: number;

  /**
   * Total memory saved by reusing from pool in bytes
   */
  memorySaved: number;
}

/**
 * Size bucket for memory pooling
 */
interface SizeBucket {
  /**
   * Size of arrays in this bucket
   */
  size: number;

  /**
   * Available arrays in this bucket
   */
  available: TypedArray[];

  /**
   * Number of arrays currently in use from this bucket
   */
  inUse: number;
}

/**
 * Memory pool for tensor operations
 */
export class TensorMemoryPool {
  private options: Required<MemoryPoolOptions>;
  private buckets: Map<DataType, Map<number, SizeBucket>>;
  private stats: MemoryStats;

  /**
   * Create a new tensor memory pool
   * @param options Configuration options
   */
  constructor(options: MemoryPoolOptions = {}) {
    this.options = {
      initialCapacity: options.initialCapacity ?? 16,
      maxCapacity: options.maxCapacity ?? 1024,
      growthFactor: options.growthFactor ?? 2,
      trackStats: options.trackStats ?? true
    };

    this.buckets = new Map();
    this.stats = {
      allocations: 0,
      poolAllocations: 0,
      releases: 0,
      currentUsage: 0,
      peakUsage: 0,
      totalAllocated: 0,
      memorySaved: 0
    };

    // Initialize buckets for common data types
    this.initializeBuckets('float32');
    this.initializeBuckets('int32');
  }

  /**
   * Initialize buckets for a specific data type
   * @param dtype Data type
   */
  private initializeBuckets(dtype: DataType): void {
    const typeBuckets = new Map<number, SizeBucket>();

    // Create buckets for common sizes using power-of-2 sizing
    for (let size = 1; size <= 1024; size *= 2) {
      typeBuckets.set(size, {
        size,
        available: [],
        inUse: 0
      });
    }

    // Add buckets for other common sizes
    [3, 5, 7, 9, 10, 12, 15, 20, 25, 50, 100].forEach(size => {
      if (!typeBuckets.has(size)) {
        typeBuckets.set(size, {
          size,
          available: [],
          inUse: 0
        });
      }
    });

    this.buckets.set(dtype, typeBuckets);
  }

  /**
   * Get a typed array from the pool
   * @param size Size of the array
   * @param dtype Data type
   * @returns A typed array from the pool or a new one
   */
  acquire(size: number, dtype: DataType = 'float32'): TypedArray {
    if (this.options.trackStats) {
      this.stats.allocations++;
    }

    // Get or create buckets for this data type
    let typeBuckets = this.buckets.get(dtype);
    if (!typeBuckets) {
      this.initializeBuckets(dtype);
      typeBuckets = this.buckets.get(dtype)!;
    }

    // Find the best bucket for this size
    const bucket = this.findBestBucket(typeBuckets, size);

    if (bucket && bucket.available.length > 0) {
      // Reuse an array from the pool
      const array = bucket.available.pop()!;
      bucket.inUse++;

      if (this.options.trackStats) {
        this.stats.poolAllocations++;
        this.stats.currentUsage += this.getArrayByteSize(array);
        this.stats.memorySaved += this.getArrayByteSize(array);
        this.stats.peakUsage = Math.max(this.stats.peakUsage, this.stats.currentUsage);
      }

      return array;
    }

    // Create a new array
    const array = this.createTypedArray(dtype, size);

    if (bucket) {
      bucket.inUse++;
    }

    if (this.options.trackStats) {
      const byteSize = this.getArrayByteSize(array);
      this.stats.currentUsage += byteSize;
      this.stats.totalAllocated += byteSize;
      this.stats.peakUsage = Math.max(this.stats.peakUsage, this.stats.currentUsage);
    }

    return array;
  }

  /**
   * Release a typed array back to the pool
   * @param array Array to release
   * @param dtype Data type
   */
  release(array: TypedArray, dtype: DataType = 'float32'): void {
    if (this.options.trackStats) {
      this.stats.releases++;
      this.stats.currentUsage -= this.getArrayByteSize(array);
    }

    // Get buckets for this data type
    const typeBuckets = this.buckets.get(dtype);
    if (!typeBuckets) {
      return;
    }

    // Find the bucket for this array size
    const size = array.length;
    const bucket = this.findBestBucket(typeBuckets, size);

    if (bucket && bucket.inUse > 0) {
      bucket.inUse--;

      // Only keep the array if we're under the max capacity
      if (bucket.available.length < this.options.maxCapacity) {
        // Zero out the array before returning it to the pool
        if (array instanceof Float32Array || array instanceof Float64Array) {
          array.fill(0);
        } else {
          array.fill(0);
        }

        bucket.available.push(array);
      }
    }
  }

  /**
   * Acquire a typed array for a tensor with the given shape
   * @param shape Tensor shape
   * @param dtype Data type
   * @returns A typed array from the pool or a new one
   */
  acquireForShape(shape: Shape, dtype: DataType = 'float32'): TypedArray {
    const size = calculateSize(shape);
    return this.acquire(size, dtype);
  }

  /**
   * Find the best bucket for a given size
   * @param typeBuckets Buckets for a specific data type
   * @param size Requested size
   * @returns The best bucket or undefined
   */
  private findBestBucket(typeBuckets: Map<number, SizeBucket>, size: number): SizeBucket | undefined {
    // First try to find an exact match
    if (typeBuckets.has(size)) {
      return typeBuckets.get(size);
    }

    // Find the smallest bucket that can fit the requested size
    let bestSize = Infinity;
    let bestBucket: SizeBucket | undefined;

    for (const [bucketSize, bucket] of typeBuckets.entries()) {
      if (bucketSize >= size && bucketSize < bestSize) {
        bestSize = bucketSize;
        bestBucket = bucket;
      }
    }

    // If we found a suitable bucket, return it
    if (bestBucket) {
      return bestBucket;
    }

    // If no suitable bucket exists, create a new one
    const newBucketSize = this.nextPowerOfTwo(size);
    const newBucket: SizeBucket = {
      size: newBucketSize,
      available: [],
      inUse: 0
    };

    typeBuckets.set(newBucketSize, newBucket);
    return newBucket;
  }

  /**
   * Create a typed array of the specified type and size
   * @param dtype Data type
   * @param size Array size
   * @returns A new typed array
   */
  private createTypedArray(dtype: DataType, size: number): TypedArray {
    switch (dtype) {
      case 'float32':
        return new Float32Array(size);
      case 'float64':
        return new Float64Array(size);
      case 'int32':
        return new Int32Array(size);
      case 'int16':
        return new Int16Array(size);
      case 'uint8':
        return new Uint8Array(size);
      case 'uint16':
        return new Uint16Array(size);
      default:
        throw new Error(`Unsupported data type: ${dtype}`);
    }
  }

  /**
   * Get the size of a typed array in bytes
   * @param array Typed array
   * @returns Size in bytes
   */
  private getArrayByteSize(array: TypedArray): number {
    return array.byteLength;
  }

  /**
   * Get the next power of two greater than or equal to a number
   * @param n Number
   * @returns Next power of two
   */
  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  /**
   * Get memory usage statistics
   * @returns Memory statistics
   */
  getStats(): MemoryStats {
    return { ...this.stats };
  }

  /**
   * Clear all pools and reset statistics
   */
  clear(): void {
    this.buckets.clear();

    this.stats = {
      allocations: 0,
      poolAllocations: 0,
      releases: 0,
      currentUsage: 0,
      peakUsage: 0,
      totalAllocated: 0,
      memorySaved: 0
    };

    // Reinitialize buckets
    this.initializeBuckets('float32');
    this.initializeBuckets('int32');
  }

  /**
   * Trim the pool to reduce memory usage
   * @param targetSize Target size for each bucket
   */
  trim(targetSize: number = 0): void {
    for (const typeBuckets of this.buckets.values()) {
      for (const bucket of typeBuckets.values()) {
        // Keep only the specified number of arrays in each bucket
        if (bucket.available.length > targetSize) {
          bucket.available.splice(targetSize);
        }
      }
    }
  }
}

// Create a singleton instance for global use
export const globalMemoryPool = new TensorMemoryPool();

/**
 * Get the global memory pool instance
 * @returns Global memory pool
 */
export function getMemoryPool(): TensorMemoryPool {
  return globalMemoryPool;
}
