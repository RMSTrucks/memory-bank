/**
 * Basic Usage Examples for the Neural Computation Framework
 *
 * This file demonstrates the basic usage of the Neural Computation Framework.
 */

import {
  createTensor,
  zeros,
  ones,
  random,
  fromArray,
  range,
  shapeUtils,
  // Tensor operations
  add,
  subtract,
  multiply,
  divide,
  matmul,
  transpose,
  exp,
  log,
  sigmoid,
  tanh,
  relu,
  softmax,
  sum,
  mean,
  max,
  min,
  argmax,
  argmin
} from '../core';

/**
 * Example 1: Creating tensors
 */
function createTensorsExample() {
  console.log('Example 1: Creating tensors');

  // Create a tensor with specific values
  const tensor = createTensor({
    shape: [2, 3],
    values: [1, 2, 3, 4, 5, 6]
  });
  console.log('Tensor with specific values:');
  console.log(`Shape: [${tensor.shape}]`);
  console.log(`Size: ${tensor.size}`);
  console.log(`Rank: ${tensor.rank}`);
  console.log(`Data type: ${tensor.dtype}`);
  console.log('Values:');
  for (let i = 0; i < tensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < tensor.shape[1]; j++) {
      row.push(tensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Create a tensor filled with zeros
  const zeroTensor = zeros([2, 2]);
  console.log('Tensor filled with zeros:');
  for (let i = 0; i < zeroTensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < zeroTensor.shape[1]; j++) {
      row.push(zeroTensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Create a tensor filled with ones
  const oneTensor = ones([2, 2]);
  console.log('Tensor filled with ones:');
  for (let i = 0; i < oneTensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < oneTensor.shape[1]; j++) {
      row.push(oneTensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Create a tensor with random values
  const randomTensor = random([2, 2], 'float32', 0, 1);
  console.log('Tensor with random values:');
  for (let i = 0; i < randomTensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < randomTensor.shape[1]; j++) {
      row.push(randomTensor.get(i, j).toFixed(4));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Create a tensor from an array
  const arrayTensor = fromArray([1, 2, 3, 4], [2, 2]);
  console.log('Tensor from array:');
  for (let i = 0; i < arrayTensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < arrayTensor.shape[1]; j++) {
      row.push(arrayTensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Create a tensor with values in a range
  const rangeTensor = range(0, 5);
  console.log('Tensor with range values:');
  console.log(`  [${rangeTensor.toArray().join(', ')}]`);
  console.log();
}

/**
 * Example 2: Accessing and modifying tensor values
 */
function accessModifyExample() {
  console.log('Example 2: Accessing and modifying tensor values');

  // Create a tensor
  const tensor = createTensor({
    shape: [2, 3],
    values: [1, 2, 3, 4, 5, 6]
  });

  console.log('Original tensor:');
  for (let i = 0; i < tensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < tensor.shape[1]; j++) {
      row.push(tensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Get a specific value
  const value = tensor.get(0, 1);
  console.log(`Value at [0, 1]: ${value}`);

  // Set a specific value
  tensor.set(10, 0, 1);
  console.log('After setting value 10 at [0, 1]:');
  for (let i = 0; i < tensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < tensor.shape[1]; j++) {
      row.push(tensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();
}

/**
 * Example 3: Transforming tensors
 */
function transformExample() {
  console.log('Example 3: Transforming tensors');

  // Create a tensor
  const tensor = createTensor({
    shape: [2, 3],
    values: [1, 2, 3, 4, 5, 6]
  });

  console.log('Original tensor (2x3):');
  for (let i = 0; i < tensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < tensor.shape[1]; j++) {
      row.push(tensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Reshape the tensor
  const reshaped = tensor.reshape([3, 2]);
  console.log('Reshaped tensor (3x2):');
  for (let i = 0; i < reshaped.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < reshaped.shape[1]; j++) {
      row.push(reshaped.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Clone the tensor
  const cloned = tensor.clone();
  console.log('Cloned tensor:');
  for (let i = 0; i < cloned.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < cloned.shape[1]; j++) {
      row.push(cloned.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  // Modify the cloned tensor
  cloned.set(100, 0, 0);
  console.log('Original tensor (unchanged):');
  for (let i = 0; i < tensor.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < tensor.shape[1]; j++) {
      row.push(tensor.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();

  console.log('Modified cloned tensor:');
  for (let i = 0; i < cloned.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < cloned.shape[1]; j++) {
      row.push(cloned.get(i, j));
    }
    console.log(`  [${row.join(', ')}]`);
  }
  console.log();
}

/**
 * Example 4: Shape utilities
 */
function shapeUtilsExample() {
  console.log('Example 4: Shape utilities');

  // Calculate size
  const shape1 = [2, 3];
  const size = shapeUtils.calculateSize(shape1);
  console.log(`Size of shape [${shape1}]: ${size}`);

  // Calculate strides
  const strides = shapeUtils.calculateStrides(shape1);
  console.log(`Strides of shape [${shape1}]: [${strides}]`);

  // Check if shapes are broadcastable
  const shape2 = [2, 1];
  const broadcastable = shapeUtils.areBroadcastable(shape1, shape2);
  console.log(`Are shapes [${shape1}] and [${shape2}] broadcastable? ${broadcastable}`);

  // Get broadcasted shape
  if (broadcastable) {
    const broadcastedShape = shapeUtils.broadcastShapes(shape1, shape2);
    console.log(`Broadcasted shape: [${broadcastedShape}]`);
  }

  // Validate shape
  const validShape = shapeUtils.validateShape(shape1);
  console.log(`Is shape [${shape1}] valid? ${validShape}`);

  const invalidShape = shapeUtils.validateShape([-1, 3] as any);
  console.log(`Is shape [-1, 3] valid? ${invalidShape}`);
}

/**
 * Example 5: Tensor operations
 */
function tensorOperationsExample() {
  console.log('Example 5: Tensor operations');

  // Create tensors for operations
  const a = createTensor({
    shape: [2, 2],
    values: [1, 2, 3, 4]
  });

  const b = createTensor({
    shape: [2, 2],
    values: [5, 6, 7, 8]
  });

  console.log('Tensor A:');
  printTensor(a);

  console.log('Tensor B:');
  printTensor(b);

  // Element-wise operations
  console.log('\nElement-wise operations:');

  console.log('A + B:');
  printTensor(add(a, b).tensor);

  console.log('A - B:');
  printTensor(subtract(a, b).tensor);

  console.log('A * B:');
  printTensor(multiply(a, b).tensor);

  console.log('A / B:');
  printTensor(divide(a, b).tensor);

  // Matrix operations
  console.log('\nMatrix operations:');

  console.log('A @ B (matrix multiplication):');
  printTensor(matmul(a, b).tensor);

  console.log('transpose(A):');
  printTensor(transpose(a).tensor);

  // Activation functions
  console.log('\nActivation functions:');

  console.log('exp(A):');
  printTensor(exp(a).tensor);

  console.log('sigmoid(A):');
  printTensor(sigmoid(a).tensor);

  console.log('tanh(A):');
  printTensor(tanh(a).tensor);

  console.log('relu(A):');
  printTensor(relu(a).tensor);

  console.log('softmax(A, axis=1):');
  printTensor(softmax(a, 1).tensor);

  // Reduction operations
  console.log('\nReduction operations:');

  console.log('sum(A):');
  printTensor(sum(a).tensor);

  console.log('sum(A, axes=[0]):');
  printTensor(sum(a, [0]).tensor);

  console.log('mean(A):');
  printTensor(mean(a).tensor);

  console.log('max(A):');
  printTensor(max(a).tensor);

  console.log('min(A):');
  printTensor(min(a).tensor);

  console.log('argmax(A, axis=0):');
  printTensor(argmax(a, 0).tensor);

  console.log('argmin(A, axis=1):');
  printTensor(argmin(a, 1).tensor);

  // Broadcasting example
  console.log('\nBroadcasting example:');

  const c = createTensor({
    shape: [2, 1],
    values: [10, 20]
  });

  console.log('Tensor C (shape [2, 1]):');
  printTensor(c);

  console.log('A + C (broadcasting):');
  printTensor(add(a, c).tensor);
}

/**
 * Helper function to print a tensor
 */
function printTensor(tensor: any) {
  if (tensor.rank === 0) {
    console.log(`  ${tensor.get()}`);
  } else if (tensor.rank === 1) {
    const values = [];
    for (let i = 0; i < tensor.shape[0]; i++) {
      values.push(typeof tensor.get(i) === 'number' ? tensor.get(i).toFixed(4).replace(/\.?0+$/, '') : tensor.get(i));
    }
    console.log(`  [${values.join(', ')}]`);
  } else if (tensor.rank === 2) {
    for (let i = 0; i < tensor.shape[0]; i++) {
      const row = [];
      for (let j = 0; j < tensor.shape[1]; j++) {
        row.push(typeof tensor.get(i, j) === 'number' ? tensor.get(i, j).toFixed(4).replace(/\.?0+$/, '') : tensor.get(i, j));
      }
      console.log(`  [${row.join(', ')}]`);
    }
  } else {
    console.log(`  Tensor with shape [${tensor.shape}] and rank ${tensor.rank}`);
  }
}

/**
 * Run all examples
 */
function runExamples() {
  createTensorsExample();
  accessModifyExample();
  transformExample();
  shapeUtilsExample();
  tensorOperationsExample();
}

// Uncomment to run the examples
// runExamples();

export {
  createTensorsExample,
  accessModifyExample,
  transformExample,
  shapeUtilsExample,
  tensorOperationsExample,
  runExamples
};
