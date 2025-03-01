/**
 * Memory Pool Tests
 *
 * This file contains tests for the memory pool and tensor manager implementations.
 * It verifies that the memory pool correctly manages memory and improves performance.
 */

import { DataType, Shape } from '../types/tensor';
import { TensorMemoryPool, getMemoryPool } from '../core/memory-pool';
import { TensorManager, getTensorManager, createPooledTensor, releaseTensor, zeros, ones } from '../core/tensor-manager';
import { createTensor, zeros as standardZeros, ones as standardOnes } from '../core/tensor';

describe('Memory Pool', () => {
  let memoryPool: TensorMemoryPool;

  beforeEach(() => {
    memoryPool = new TensorMemoryPool();
  });

  test('should acquire and release memory', () => {
    // Acquire memory
    const size = 100;
    const dtype: DataType = 'float32';
    const array = memoryPool.acquire(size, dtype);

    // Verify array properties
    expect(array).toBeInstanceOf(Float32Array);
    expect(array.length).toBe(size);

    // Release memory
    memoryPool.release(array, dtype);

    // Verify stats
    const stats = memoryPool.getStats();
    expect(stats.allocations).toBe(1);
    expect(stats.releases).toBe(1);
  });

  test('should reuse memory from the pool', () => {
    // Acquire memory
    const size = 100;
    const dtype: DataType = 'float32';
    const array1 = memoryPool.acquire(size, dtype);

    // Release memory
    memoryPool.release(array1, dtype);

    // Acquire memory again
    const array2 = memoryPool.acquire(size, dtype);

    // Verify stats
    const stats = memoryPool.getStats();
    expect(stats.allocations).toBe(2);
    expect(stats.poolAllocations).toBe(1);
    expect(stats.releases).toBe(1);
  });

  test('should handle different data types', () => {
    // Acquire float32 memory
    const float32Array = memoryPool.acquire(100, 'float32');
    expect(float32Array).toBeInstanceOf(Float32Array);

    // Acquire int32 memory
    const int32Array = memoryPool.acquire(100, 'int32');
    expect(int32Array).toBeInstanceOf(Int32Array);

    // Release memory
    memoryPool.release(float32Array, 'float32');
    memoryPool.release(int32Array, 'int32');
  });

  test('should handle different sizes', () => {
    // Acquire small memory
    const smallArray = memoryPool.acquire(10, 'float32');
    expect(smallArray.length).toBe(10);

    // Acquire large memory
    const largeArray = memoryPool.acquire(1000, 'float32');
    expect(largeArray.length).toBe(1000);

    // Release memory
    memoryPool.release(smallArray, 'float32');
    memoryPool.release(largeArray, 'float32');
  });

  test('should clear the pool', () => {
    // Acquire memory
    const array1 = memoryPool.acquire(100, 'float32');
    const array2 = memoryPool.acquire(200, 'float32');

    // Release memory
    memoryPool.release(array1, 'float32');
    memoryPool.release(array2, 'float32');

    // Clear the pool
    memoryPool.clear();

    // Verify stats
    const stats = memoryPool.getStats();
    expect(stats.allocations).toBe(0);
    expect(stats.releases).toBe(0);
  });

  test('should trim the pool', () => {
    // Acquire memory
    const array1 = memoryPool.acquire(100, 'float32');
    const array2 = memoryPool.acquire(100, 'float32');
    const array3 = memoryPool.acquire(100, 'float32');

    // Release memory
    memoryPool.release(array1, 'float32');
    memoryPool.release(array2, 'float32');
    memoryPool.release(array3, 'float32');

    // Trim the pool to keep only one array
    memoryPool.trim(1);

    // Acquire memory again
    const array4 = memoryPool.acquire(100, 'float32');
    const array5 = memoryPool.acquire(100, 'float32');
    const array6 = memoryPool.acquire(100, 'float32');

    // Verify stats
    const stats = memoryPool.getStats();
    expect(stats.poolAllocations).toBe(1); // Only one array should be reused
  });
});

describe('Tensor Manager', () => {
  let tensorManager: TensorManager;

  beforeEach(() => {
    tensorManager = new TensorManager();
  });

  test('should create and release tensors', () => {
    // Create a tensor
    const shape: Shape = [2, 3];
    const tensor = tensorManager.createTensor({ shape });

    // Verify tensor properties
    expect(tensor.shape).toEqual(shape);
    expect(tensor.size).toBe(6);

    // Release the tensor
    tensorManager.releaseTensor(tensor);

    // Verify stats
    const stats = tensorManager.getStats();
    expect(stats.created).toBe(1);
    expect(stats.released).toBe(1);
    expect(stats.active).toBe(0);
  });

  test('should create tensors with initial values', () => {
    // Create a tensor with values
    const shape: Shape = [2, 2];
    const values = [1, 2, 3, 4];
    const tensor = tensorManager.createTensor({ shape, values });

    // Verify tensor values
    expect(tensor.get(0, 0)).toBe(1);
    expect(tensor.get(0, 1)).toBe(2);
    expect(tensor.get(1, 0)).toBe(3);
    expect(tensor.get(1, 1)).toBe(4);

    // Release the tensor
    tensorManager.releaseTensor(tensor);
  });

  test('should create zeros tensors', () => {
    // Create a zeros tensor
    const shape: Shape = [2, 3];
    const tensor = tensorManager.zeros(shape);

    // Verify tensor values
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        expect(tensor.get(i, j)).toBe(0);
      }
    }

    // Release the tensor
    tensorManager.releaseTensor(tensor);
  });

  test('should create ones tensors', () => {
    // Create a ones tensor
    const shape: Shape = [2, 3];
    const tensor = tensorManager.ones(shape);

    // Verify tensor values
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        expect(tensor.get(i, j)).toBe(1);
      }
    }

    // Release the tensor
    tensorManager.releaseTensor(tensor);
  });

  test('should create random tensors', () => {
    // Create a random tensor
    const shape: Shape = [10, 10];
    const min = 0;
    const max = 1;
    const tensor = tensorManager.random(shape, 'float32', min, max);

    // Verify tensor values are within range
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const value = tensor.get(i, j);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    }

    // Release the tensor
    tensorManager.releaseTensor(tensor);
  });

  test('should create tensors from arrays', () => {
    // Create a tensor from an array
    const values = [1, 2, 3, 4, 5, 6];
    const shape: Shape = [2, 3];
    const tensor = tensorManager.fromArray(values, shape);

    // Verify tensor values
    expect(tensor.get(0, 0)).toBe(1);
    expect(tensor.get(0, 1)).toBe(2);
    expect(tensor.get(0, 2)).toBe(3);
    expect(tensor.get(1, 0)).toBe(4);
    expect(tensor.get(1, 1)).toBe(5);
    expect(tensor.get(1, 2)).toBe(6);

    // Release the tensor
    tensorManager.releaseTensor(tensor);
  });

  test('should reset the manager', () => {
    // Create tensors
    const tensor1 = tensorManager.zeros([10, 10]);
    const tensor2 = tensorManager.ones([5, 5]);

    // Reset the manager
    tensorManager.reset();

    // Verify stats
    const stats = tensorManager.getStats();
    expect(stats.created).toBe(0);
    expect(stats.released).toBe(0);
    expect(stats.active).toBe(0);
  });
});

describe('Global Functions', () => {
  test('should get the global memory pool', () => {
    const memoryPool = getMemoryPool();
    expect(memoryPool).toBeInstanceOf(TensorMemoryPool);
  });

  test('should get the global tensor manager', () => {
    const tensorManager = getTensorManager();
    expect(tensorManager).toBeInstanceOf(TensorManager);
  });

  test('should create and release pooled tensors', () => {
    // Create a pooled tensor
    const shape: Shape = [2, 3];
    const tensor = createPooledTensor({ shape });

    // Verify tensor properties
    expect(tensor.shape).toEqual(shape);
    expect(tensor.size).toBe(6);

    // Release the tensor
    releaseTensor(tensor);
  });
});

describe('Performance Comparison', () => {
  // Helper function to measure execution time
  const measureTime = (fn: () => void): number => {
    const start = performance.now();
    fn();
    return performance.now() - start;
  };

  test('should be faster to create and release tensors with pooling', () => {
    const iterations = 1000;
    const shape: Shape = [100, 100];

    // Measure time for standard tensor creation
    const standardTime = measureTime(() => {
      for (let i = 0; i < iterations; i++) {
        const tensor = createTensor({ shape });
      }
    });

    // Measure time for pooled tensor creation and release
    const pooledTime = measureTime(() => {
      for (let i = 0; i < iterations; i++) {
        const tensor = createPooledTensor({ shape });
        releaseTensor(tensor);
      }
    });

    // Log the results
    console.log(`Standard tensor creation: ${standardTime.toFixed(2)}ms`);
    console.log(`Pooled tensor creation and release: ${pooledTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(standardTime / pooledTime).toFixed(2)}x`);

    // The pooled version should be faster after the first few iterations
    // due to the overhead of setting up the pool
    expect(pooledTime).toBeLessThan(standardTime);
  });

  test('should be faster to create zeros tensors with pooling', () => {
    const iterations = 1000;
    const shape: Shape = [100, 100];

    // Measure time for standard zeros
    const standardTime = measureTime(() => {
      for (let i = 0; i < iterations; i++) {
        const tensor = standardZeros(shape);
      }
    });

    // Measure time for pooled zeros
    const pooledTime = measureTime(() => {
      for (let i = 0; i < iterations; i++) {
        const tensor = zeros(shape);
        releaseTensor(tensor);
      }
    });

    // Log the results
    console.log(`Standard zeros: ${standardTime.toFixed(2)}ms`);
    console.log(`Pooled zeros: ${pooledTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(standardTime / pooledTime).toFixed(2)}x`);

    // The pooled version should be faster
    expect(pooledTime).toBeLessThan(standardTime);
  });

  test('should be faster to create ones tensors with pooling', () => {
    const iterations = 1000;
    const shape: Shape = [100, 100];

    // Measure time for standard ones
    const standardTime = measureTime(() => {
      for (let i = 0; i < iterations; i++) {
        const tensor = standardOnes(shape);
      }
    });

    // Measure time for pooled ones
    const pooledTime = measureTime(() => {
      for (let i = 0; i < iterations; i++) {
        const tensor = ones(shape);
        releaseTensor(tensor);
      }
    });

    // Log the results
    console.log(`Standard ones: ${standardTime.toFixed(2)}ms`);
    console.log(`Pooled ones: ${pooledTime.toFixed(2)}ms`);
    console.log(`Speedup: ${(standardTime / pooledTime).toFixed(2)}x`);

    // The pooled version should be faster
    expect(pooledTime).toBeLessThan(standardTime);
  });

  test('should measure memory usage improvement', () => {
    const iterations = 1000;
    const shape: Shape = [100, 100];
    const memoryPool = getMemoryPool();
    const tensorManager = getTensorManager();

    // Clear stats
    memoryPool.clear();
    tensorManager.reset();

    // Create and release pooled tensors
    for (let i = 0; i < iterations; i++) {
      const tensor = createPooledTensor({ shape });
      releaseTensor(tensor);
    }

    // Get stats
    const poolStats = memoryPool.getStats();
    const tensorStats = tensorManager.getStats();

    // Log the results
    console.log(`Total allocations: ${poolStats.allocations}`);
    console.log(`Pool allocations: ${poolStats.poolAllocations}`);
    console.log(`Memory saved: ${(poolStats.memorySaved / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Reuse ratio: ${(poolStats.poolAllocations / poolStats.allocations * 100).toFixed(2)}%`);

    // Verify that we're reusing memory
    expect(poolStats.poolAllocations).toBeGreaterThan(0);
    expect(poolStats.memorySaved).toBeGreaterThan(0);
  });
});
