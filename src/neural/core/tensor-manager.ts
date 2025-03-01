/**
 * Tensor Manager Implementation for Neural Computation Framework
 *
 * This file implements a tensor manager that uses the memory pool to efficiently
 * manage tensor memory allocation and deallocation.
 */

import { DataType, Shape, Tensor, TensorOptions, TypedArray } from '../types/tensor';
import { TensorImpl, calculateSize, createTensor } from './tensor';
import { TensorMemoryPool, getMemoryPool } from './memory-pool';

/**
 * Configuration options for the tensor manager
 */
export interface TensorManagerOptions {
  /**
   * Memory pool to use
   */
  memoryPool?: TensorMemoryPool;

  /**
   * Whether to track tensor allocations
   */
  trackAllocations?: boolean;

  /**
   * Whether to automatically release tensors when they are no longer needed
   */
  autoRelease?: boolean;
}

/**
 * Tensor allocation statistics
 */
export interface TensorStats {
  /**
   * Total number of tensors created
   */
  created: number;

  /**
   * Total number of tensors released
   */
  released: number;

  /**
   * Current number of active tensors
   */
  active: number;

  /**
   * Peak number of active tensors
   */
  peak: number;

  /**
   * Total memory allocated for tensors in bytes
   */
  totalMemory: number;

  /**
   * Peak memory usage in bytes
   */
  peakMemory: number;
}

/**
 * Manager for tensor creation and memory management
 */
export class TensorManager {
  private memoryPool: TensorMemoryPool;
  private options: Required<TensorManagerOptions>;
  private activeTensors: Map<string, Tensor>;
  private stats: TensorStats;

  /**
   * Create a new tensor manager
   * @param options Configuration options
   */
  constructor(options: TensorManagerOptions = {}) {
    this.memoryPool = options.memoryPool ?? getMemoryPool();
    this.options = {
      memoryPool: this.memoryPool,
      trackAllocations: options.trackAllocations ?? true,
      autoRelease: options.autoRelease ?? true
    };

    this.activeTensors = new Map();
    this.stats = {
      created: 0,
      released: 0,
      active: 0,
      peak: 0,
      totalMemory: 0,
      peakMemory: 0
    };
  }

  /**
   * Create a new tensor with memory from the pool
   * @param options Tensor creation options
   * @returns A new tensor
   */
  createTensor(options: TensorOptions): Tensor {
    const shape = options.shape || [];
    const dtype = options.dtype || 'float32';
    const size = calculateSize(shape);

    // Get memory from the pool
    const data = this.memoryPool.acquire(size, dtype);

    // If values are provided, copy them to the data
    if (options.values) {
      if (Array.isArray(options.values)) {
        for (let i = 0; i < size && i < options.values.length; i++) {
          data[i] = options.values[i];
        }
      } else if (options.values instanceof ArrayBuffer || ArrayBuffer.isView(options.values)) {
        const typedValues = options.values as TypedArray;
        for (let i = 0; i < size && i < typedValues.length; i++) {
          data[i] = typedValues[i];
        }
      }
    }

    // Create the tensor with the pooled memory
    const tensor = new TensorImpl({
      ...options,
      shape,
      dtype,
      values: data
    });

    // Track the tensor if needed
    if (this.options.trackAllocations) {
      this.trackTensor(tensor);
    }

    return tensor;
  }

  /**
   * Release a tensor's memory back to the pool
   * @param tensor Tensor to release
   */
  releaseTensor(tensor: Tensor): void {
    if (!(tensor instanceof TensorImpl)) {
      throw new Error('Cannot release tensor: not a TensorImpl instance');
    }

    // Get the tensor's data
    const data = tensor.data as TypedArray;

    // Release the memory back to the pool
    this.memoryPool.release(data, tensor.dtype);

    // Update tracking if needed
    if (this.options.trackAllocations) {
      this.untrackTensor(tensor);
    }
  }

  /**
   * Track a tensor for memory management
   * @param tensor Tensor to track
   */
  private trackTensor(tensor: Tensor): void {
    this.activeTensors.set(tensor.id, tensor);
    this.stats.created++;
    this.stats.active++;
    this.stats.peak = Math.max(this.stats.peak, this.stats.active);

    const memoryUsage = this.calculateTensorMemory(tensor);
    this.stats.totalMemory += memoryUsage;
    this.stats.peakMemory = Math.max(this.stats.peakMemory, this.stats.totalMemory);
  }

  /**
   * Untrack a tensor for memory management
   * @param tensor Tensor to untrack
   */
  private untrackTensor(tensor: Tensor): void {
    if (this.activeTensors.has(tensor.id)) {
      this.activeTensors.delete(tensor.id);
      this.stats.released++;
      this.stats.active--;

      const memoryUsage = this.calculateTensorMemory(tensor);
      this.stats.totalMemory -= memoryUsage;
    }
  }

  /**
   * Calculate the memory usage of a tensor in bytes
   * @param tensor Tensor to calculate memory for
   * @returns Memory usage in bytes
   */
  private calculateTensorMemory(tensor: Tensor): number {
    const bytesPerElement = this.getBytesPerElement(tensor.dtype);
    return tensor.size * bytesPerElement;
  }

  /**
   * Get the number of bytes per element for a data type
   * @param dtype Data type
   * @returns Bytes per element
   */
  private getBytesPerElement(dtype: DataType): number {
    switch (dtype) {
      case 'float32':
        return 4;
      case 'float64':
        return 8;
      case 'int32':
        return 4;
      case 'int16':
        return 2;
      case 'uint8':
        return 1;
      case 'uint16':
        return 2;
      default:
        return 4;
    }
  }

  /**
   * Get tensor allocation statistics
   * @returns Tensor statistics
   */
  getStats(): TensorStats {
    return { ...this.stats };
  }

  /**
   * Release all tensors and reset statistics
   */
  reset(): void {
    // Release all active tensors
    for (const tensor of this.activeTensors.values()) {
      this.releaseTensor(tensor);
    }

    // Clear tracking
    this.activeTensors.clear();

    // Reset statistics
    this.stats = {
      created: 0,
      released: 0,
      active: 0,
      peak: 0,
      totalMemory: 0,
      peakMemory: 0
    };
  }

  /**
   * Create a tensor filled with zeros
   * @param shape Shape of the tensor
   * @param dtype Data type of the tensor
   * @returns A new tensor filled with zeros
   */
  zeros(shape: Shape, dtype: DataType = 'float32'): Tensor {
    const size = calculateSize(shape);
    const data = this.memoryPool.acquire(size, dtype);

    // Data from the pool should already be zeroed, but just to be sure
    data.fill(0);

    const tensor = new TensorImpl({
      shape,
      dtype,
      values: data
    });

    if (this.options.trackAllocations) {
      this.trackTensor(tensor);
    }

    return tensor;
  }

  /**
   * Create a tensor filled with ones
   * @param shape Shape of the tensor
   * @param dtype Data type of the tensor
   * @returns A new tensor filled with ones
   */
  ones(shape: Shape, dtype: DataType = 'float32'): Tensor {
    const size = calculateSize(shape);
    const data = this.memoryPool.acquire(size, dtype);

    // Fill with ones
    data.fill(1);

    const tensor = new TensorImpl({
      shape,
      dtype,
      values: data
    });

    if (this.options.trackAllocations) {
      this.trackTensor(tensor);
    }

    return tensor;
  }

  /**
   * Create a tensor with random values
   * @param shape Shape of the tensor
   * @param dtype Data type of the tensor
   * @param min Minimum value (default: 0)
   * @param max Maximum value (default: 1)
   * @returns A new tensor with random values
   */
  random(
    shape: Shape,
    dtype: DataType = 'float32',
    min: number = 0,
    max: number = 1
  ): Tensor {
    const size = calculateSize(shape);
    const data = this.memoryPool.acquire(size, dtype);
    const range = max - min;

    // Fill with random values
    for (let i = 0; i < size; i++) {
      data[i] = min + Math.random() * range;
    }

    const tensor = new TensorImpl({
      shape,
      dtype,
      values: data
    });

    if (this.options.trackAllocations) {
      this.trackTensor(tensor);
    }

    return tensor;
  }

  /**
   * Create a tensor from an array of values
   * @param values Source array
   * @param shape Shape of the tensor
   * @param dtype Data type of the tensor
   * @returns A new tensor with the given values
   */
  fromArray(
    values: number[],
    shape?: Shape,
    dtype: DataType = 'float32'
  ): Tensor {
    if (!shape) {
      shape = [values.length];
    }

    const size = calculateSize(shape);
    if (size !== values.length) {
      throw new Error(`Shape [${shape}] with size ${size} doesn't match array length ${values.length}`);
    }

    const data = this.memoryPool.acquire(size, dtype);

    // Copy values to the data
    for (let i = 0; i < size; i++) {
      data[i] = values[i];
    }

    const tensor = new TensorImpl({
      shape,
      dtype,
      values: data
    });

    if (this.options.trackAllocations) {
      this.trackTensor(tensor);
    }

    return tensor;
  }
}

// Create a singleton instance for global use
export const globalTensorManager = new TensorManager();

/**
 * Get the global tensor manager instance
 * @returns Global tensor manager
 */
export function getTensorManager(): TensorManager {
  return globalTensorManager;
}

/**
 * Create a tensor with memory from the pool
 * @param options Tensor creation options
 * @returns A new tensor
 */
export function createPooledTensor(options: TensorOptions): Tensor {
  return globalTensorManager.createTensor(options);
}

/**
 * Release a tensor's memory back to the pool
 * @param tensor Tensor to release
 */
export function releaseTensor(tensor: Tensor): void {
  globalTensorManager.releaseTensor(tensor);
}

/**
 * Create a tensor filled with zeros
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 * @returns A new tensor filled with zeros
 */
export function zeros(shape: Shape, dtype: DataType = 'float32'): Tensor {
  return globalTensorManager.zeros(shape, dtype);
}

/**
 * Create a tensor filled with ones
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 * @returns A new tensor filled with ones
 */
export function ones(shape: Shape, dtype: DataType = 'float32'): Tensor {
  return globalTensorManager.ones(shape, dtype);
}

/**
 * Create a tensor with random values
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 * @param min Minimum value (default: 0)
 * @param max Maximum value (default: 1)
 * @returns A new tensor with random values
 */
export function random(
  shape: Shape,
  dtype: DataType = 'float32',
  min: number = 0,
  max: number = 1
): Tensor {
  return globalTensorManager.random(shape, dtype, min, max);
}

/**
 * Create a tensor from an array of values
 * @param values Source array
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 * @returns A new tensor with the given values
 */
export function fromArray(
  values: number[],
  shape?: Shape,
  dtype: DataType = 'float32'
): Tensor {
  return globalTensorManager.fromArray(values, shape, dtype);
}
