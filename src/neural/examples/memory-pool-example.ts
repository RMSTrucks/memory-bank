/**
 * Memory Pool Example
 *
 * This example demonstrates how to use the memory pool and tensor manager
 * to efficiently manage tensor memory and improve performance.
 */

import { Shape } from '../types/tensor';
import { TensorMemoryPool, getMemoryPool } from '../core/memory-pool';
import {
  TensorManager,
  getTensorManager,
  createPooledTensor,
  releaseTensor,
  zeros,
  ones,
  random,
  fromArray
} from '../core/tensor-manager';
import { createTensor } from '../core/tensor';

/**
 * Measure the execution time of a function
 * @param fn Function to measure
 * @returns Execution time in milliseconds
 */
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

/**
 * Run a performance comparison between standard and pooled tensor creation
 * @param iterations Number of iterations
 * @param shape Tensor shape
 */
function runPerformanceComparison(iterations: number, shape: Shape): void {
  console.log(`\nPerformance comparison (${iterations} iterations, shape: [${shape}]):`);
  console.log('--------------------------------------------------------------');

  // Standard tensor creation
  const standardTime = measureTime(() => {
    for (let i = 0; i < iterations; i++) {
      const tensor = createTensor({ shape });
    }
  });
  console.log(`Standard tensor creation: ${standardTime.toFixed(2)}ms`);

  // Pooled tensor creation and release
  const pooledTime = measureTime(() => {
    for (let i = 0; i < iterations; i++) {
      const tensor = createPooledTensor({ shape });
      releaseTensor(tensor);
    }
  });
  console.log(`Pooled tensor creation and release: ${pooledTime.toFixed(2)}ms`);

  // Calculate speedup
  const speedup = standardTime / pooledTime;
  console.log(`Speedup: ${speedup.toFixed(2)}x`);
}

/**
 * Demonstrate memory pool usage
 */
function demonstrateMemoryPool(): void {
  console.log('\nMemory Pool Demonstration:');
  console.log('-------------------------');

  // Get the global memory pool
  const memoryPool = getMemoryPool();

  // Acquire memory
  console.log('Acquiring memory...');
  const array1 = memoryPool.acquire(100, 'float32');
  console.log(`Acquired array of length ${array1.length}`);

  // Fill with some values
  for (let i = 0; i < 10; i++) {
    array1[i] = i;
  }
  console.log(`First 10 values: ${Array.from(array1.slice(0, 10))}`);

  // Release memory
  console.log('Releasing memory...');
  memoryPool.release(array1, 'float32');

  // Acquire memory again
  console.log('Acquiring memory again...');
  const array2 = memoryPool.acquire(100, 'float32');
  console.log(`Acquired array of length ${array2.length}`);

  // Check if values are zeroed (they should be)
  console.log(`First 10 values: ${Array.from(array2.slice(0, 10))}`);

  // Get memory pool stats
  const stats = memoryPool.getStats();
  console.log('\nMemory Pool Stats:');
  console.log(`- Total allocations: ${stats.allocations}`);
  console.log(`- Pool allocations: ${stats.poolAllocations}`);
  console.log(`- Releases: ${stats.releases}`);
  console.log(`- Memory saved: ${(stats.memorySaved / 1024).toFixed(2)} KB`);
}

/**
 * Demonstrate tensor manager usage
 */
function demonstrateTensorManager(): void {
  console.log('\nTensor Manager Demonstration:');
  console.log('----------------------------');

  // Get the global tensor manager
  const tensorManager = getTensorManager();

  // Create a zeros tensor
  console.log('Creating a zeros tensor...');
  const zerosTensor = zeros([2, 3]);
  console.log(`Zeros tensor shape: [${zerosTensor.shape}]`);
  console.log(`Zeros tensor values:`);
  for (let i = 0; i < 2; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      row.push(zerosTensor.get(i, j));
    }
    console.log(`  [${row}]`);
  }

  // Create a ones tensor
  console.log('\nCreating a ones tensor...');
  const onesTensor = ones([2, 3]);
  console.log(`Ones tensor shape: [${onesTensor.shape}]`);
  console.log(`Ones tensor values:`);
  for (let i = 0; i < 2; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      row.push(onesTensor.get(i, j));
    }
    console.log(`  [${row}]`);
  }

  // Create a random tensor
  console.log('\nCreating a random tensor...');
  const randomTensor = random([2, 3], 'float32', 0, 1);
  console.log(`Random tensor shape: [${randomTensor.shape}]`);
  console.log(`Random tensor values:`);
  for (let i = 0; i < 2; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      row.push(randomTensor.get(i, j).toFixed(4));
    }
    console.log(`  [${row}]`);
  }

  // Create a tensor from an array
  console.log('\nCreating a tensor from an array...');
  const values = [1, 2, 3, 4, 5, 6];
  const arrayTensor = fromArray(values, [2, 3]);
  console.log(`Array tensor shape: [${arrayTensor.shape}]`);
  console.log(`Array tensor values:`);
  for (let i = 0; i < 2; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      row.push(arrayTensor.get(i, j));
    }
    console.log(`  [${row}]`);
  }

  // Release all tensors
  console.log('\nReleasing all tensors...');
  releaseTensor(zerosTensor);
  releaseTensor(onesTensor);
  releaseTensor(randomTensor);
  releaseTensor(arrayTensor);

  // Get tensor manager stats
  const stats = tensorManager.getStats();
  console.log('\nTensor Manager Stats:');
  console.log(`- Created tensors: ${stats.created}`);
  console.log(`- Released tensors: ${stats.released}`);
  console.log(`- Active tensors: ${stats.active}`);
  console.log(`- Peak tensors: ${stats.peak}`);
}

/**
 * Demonstrate memory usage improvement
 */
function demonstrateMemoryUsage(): void {
  console.log('\nMemory Usage Improvement Demonstration:');
  console.log('-------------------------------------');

  const iterations = 1000;
  const shape: Shape = [100, 100];
  const memoryPool = getMemoryPool();
  const tensorManager = getTensorManager();

  // Clear stats
  memoryPool.clear();
  tensorManager.reset();

  console.log(`Creating and releasing ${iterations} tensors of shape [${shape}]...`);

  // Create and release pooled tensors
  for (let i = 0; i < iterations; i++) {
    const tensor = createPooledTensor({ shape });
    releaseTensor(tensor);
  }

  // Get stats
  const poolStats = memoryPool.getStats();
  const tensorStats = tensorManager.getStats();

  console.log('\nMemory Usage Stats:');
  console.log(`- Total allocations: ${poolStats.allocations}`);
  console.log(`- Pool allocations: ${poolStats.poolAllocations}`);
  console.log(`- Memory saved: ${(poolStats.memorySaved / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Reuse ratio: ${(poolStats.poolAllocations / poolStats.allocations * 100).toFixed(2)}%`);
}

/**
 * Main function
 */
function main(): void {
  console.log('Memory Pool and Tensor Manager Example');
  console.log('=====================================');

  // Demonstrate memory pool usage
  demonstrateMemoryPool();

  // Demonstrate tensor manager usage
  demonstrateTensorManager();

  // Demonstrate memory usage improvement
  demonstrateMemoryUsage();

  // Run performance comparisons
  runPerformanceComparison(1000, [10, 10]);
  runPerformanceComparison(1000, [100, 100]);
  runPerformanceComparison(100, [1000, 1000]);
}

// Run the example
main();
