/**
 * Normalization Example
 *
 * This example demonstrates how to use different normalization techniques
 * in a neural network with automatic differentiation.
 */

import { createTensor } from '../core/tensor';
import { ComputationGraphImpl } from '../core/computation-graph';
import { TensorOpType } from '../types/tensor';
import { backward } from '../core/autograd';

// Create a simple function to print tensor values in a readable format
function printTensor(name: string, tensor: any, maxValues: number = 10) {
  console.log(`\n${name}:`);
  console.log(`  Shape: [${tensor.shape.join(', ')}]`);

  // Print the first few values
  const values = [];
  for (let i = 0; i < Math.min(maxValues, tensor.size); i++) {
    values.push(tensor.get(i).toFixed(4));
  }

  console.log(`  Values: [${values.join(', ')}${tensor.size > maxValues ? ', ...' : ''}]`);
}

// Create a function to demonstrate batch normalization
function batchNormExample() {
  console.log('\n=== Batch Normalization Example ===');

  // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
  const inputValues = [];
  for (let i = 0; i < 2 * 3 * 4 * 5; i++) {
    inputValues.push(Math.random() * 2 - 1); // Random values between -1 and 1
  }

  const input = createTensor({
    shape: [2, 3, 4, 5],
    dtype: 'float32',
    values: inputValues
  });

  // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
  const gammaValues = [];
  const betaValues = [];
  for (let i = 0; i < 5; i++) {
    gammaValues.push(0.5 + Math.random()); // Random values between 0.5 and 1.5
    betaValues.push(Math.random() * 0.5 - 0.25); // Random values between -0.25 and 0.25
  }

  const gamma = createTensor({
    shape: [1, 1, 1, 5],
    dtype: 'float32',
    values: gammaValues
  });

  const beta = createTensor({
    shape: [1, 1, 1, 5],
    dtype: 'float32',
    values: betaValues
  });

  // Create computation graph
  const graph = new ComputationGraphImpl();
  const inputNode = graph.input(input, 'input', true);
  const gammaNode = graph.input(gamma, 'gamma', true);
  const betaNode = graph.input(beta, 'beta', true);

  // Add batch norm operation
  const bnNodeId = graph.operation(
    TensorOpType.BATCH_NORM,
    [inputNode, gammaNode, betaNode],
    { axis: [1, 2] }
  );

  // Mark as output
  graph.markOutput(bnNodeId);

  // Execute forward pass
  const result = graph.execute();
  const output = result.outputs.get(bnNodeId)!;

  // Print tensors
  printTensor('Input', input);
  printTensor('Gamma', gamma);
  printTensor('Beta', beta);
  printTensor('Batch Normalized Output', output);

  // Compute gradients
  backward(graph, bnNodeId);

  // Print gradients
  printTensor('Input Gradient', graph.getNode(inputNode).gradient!);
  printTensor('Gamma Gradient', graph.getNode(gammaNode).gradient!);
  printTensor('Beta Gradient', graph.getNode(betaNode).gradient!);
}

// Create a function to demonstrate layer normalization
function layerNormExample() {
  console.log('\n=== Layer Normalization Example ===');

  // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
  const inputValues = [];
  for (let i = 0; i < 2 * 3 * 4 * 5; i++) {
    inputValues.push(Math.random() * 2 - 1); // Random values between -1 and 1
  }

  const input = createTensor({
    shape: [2, 3, 4, 5],
    dtype: 'float32',
    values: inputValues
  });

  // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
  const gammaValues = [];
  const betaValues = [];
  for (let i = 0; i < 5; i++) {
    gammaValues.push(0.5 + Math.random()); // Random values between 0.5 and 1.5
    betaValues.push(Math.random() * 0.5 - 0.25); // Random values between -0.25 and 0.25
  }

  const gamma = createTensor({
    shape: [1, 1, 1, 5],
    dtype: 'float32',
    values: gammaValues
  });

  const beta = createTensor({
    shape: [1, 1, 1, 5],
    dtype: 'float32',
    values: betaValues
  });

  // Create computation graph
  const graph = new ComputationGraphImpl();
  const inputNode = graph.input(input, 'input', true);
  const gammaNode = graph.input(gamma, 'gamma', true);
  const betaNode = graph.input(beta, 'beta', true);

  // Add layer norm operation
  const lnNodeId = graph.operation(
    TensorOpType.LAYER_NORM,
    [inputNode, gammaNode, betaNode],
    { axis: [1, 2, 3] }
  );

  // Mark as output
  graph.markOutput(lnNodeId);

  // Execute forward pass
  const result = graph.execute();
  const output = result.outputs.get(lnNodeId)!;

  // Print tensors
  printTensor('Input', input);
  printTensor('Gamma', gamma);
  printTensor('Beta', beta);
  printTensor('Layer Normalized Output', output);

  // Compute gradients
  backward(graph, lnNodeId);

  // Print gradients
  printTensor('Input Gradient', graph.getNode(inputNode).gradient!);
  printTensor('Gamma Gradient', graph.getNode(gammaNode).gradient!);
  printTensor('Beta Gradient', graph.getNode(betaNode).gradient!);
}

// Create a function to demonstrate instance normalization
function instanceNormExample() {
  console.log('\n=== Instance Normalization Example ===');

  // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
  const inputValues = [];
  for (let i = 0; i < 2 * 3 * 4 * 5; i++) {
    inputValues.push(Math.random() * 2 - 1); // Random values between -1 and 1
  }

  const input = createTensor({
    shape: [2, 3, 4, 5],
    dtype: 'float32',
    values: inputValues
  });

  // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
  const gammaValues = [];
  const betaValues = [];
  for (let i = 0; i < 5; i++) {
    gammaValues.push(0.5 + Math.random()); // Random values between 0.5 and 1.5
    betaValues.push(Math.random() * 0.5 - 0.25); // Random values between -0.25 and 0.25
  }

  const gamma = createTensor({
    shape: [1, 1, 1, 5],
    dtype: 'float32',
    values: gammaValues
  });

  const beta = createTensor({
    shape: [1, 1, 1, 5],
    dtype: 'float32',
    values: betaValues
  });

  // Create computation graph
  const graph = new ComputationGraphImpl();
  const inputNode = graph.input(input, 'input', true);
  const gammaNode = graph.input(gamma, 'gamma', true);
  const betaNode = graph.input(beta, 'beta', true);

  // Add instance norm operation
  const inNodeId = graph.operation(
    TensorOpType.INSTANCE_NORM,
    [inputNode, gammaNode, betaNode],
    { axis: [1, 2] }
  );

  // Mark as output
  graph.markOutput(inNodeId);

  // Execute forward pass
  const result = graph.execute();
  const output = result.outputs.get(inNodeId)!;

  // Print tensors
  printTensor('Input', input);
  printTensor('Gamma', gamma);
  printTensor('Beta', beta);
  printTensor('Instance Normalized Output', output);

  // Compute gradients
  backward(graph, inNodeId);

  // Print gradients
  printTensor('Input Gradient', graph.getNode(inputNode).gradient!);
  printTensor('Gamma Gradient', graph.getNode(gammaNode).gradient!);
  printTensor('Beta Gradient', graph.getNode(betaNode).gradient!);
}

// Create a function to demonstrate group normalization
function groupNormExample() {
  console.log('\n=== Group Normalization Example ===');

  // Create input tensor with shape [2, 3, 4, 8] (batch, height, width, channels)
  // Note: channels must be divisible by groups
  const inputValues = [];
  for (let i = 0; i < 2 * 3 * 4 * 8; i++) {
    inputValues.push(Math.random() * 2 - 1); // Random values between -1 and 1
  }

  const input = createTensor({
    shape: [2, 3, 4, 8],
    dtype: 'float32',
    values: inputValues
  });

  // Create gamma and beta tensors with shape [1, 1, 1, 8] (one per channel)
  const gammaValues = [];
  const betaValues = [];
  for (let i = 0; i < 8; i++) {
    gammaValues.push(0.5 + Math.random()); // Random values between 0.5 and 1.5
    betaValues.push(Math.random() * 0.5 - 0.25); // Random values between -0.25 and 0.25
  }

  const gamma = createTensor({
    shape: [1, 1, 1, 8],
    dtype: 'float32',
    values: gammaValues
  });

  const beta = createTensor({
    shape: [1, 1, 1, 8],
    dtype: 'float32',
    values: betaValues
  });

  // Create computation graph
  const graph = new ComputationGraphImpl();
  const inputNode = graph.input(input, 'input', true);
  const gammaNode = graph.input(gamma, 'gamma', true);
  const betaNode = graph.input(beta, 'beta', true);

  // Add group norm operation
  const gnNodeId = graph.operation(
    TensorOpType.GROUP_NORM,
    [inputNode, gammaNode, betaNode],
    { axis: [1, 2], groups: 4 }
  );

  // Mark as output
  graph.markOutput(gnNodeId);

  // Execute forward pass
  const result = graph.execute();
  const output = result.outputs.get(gnNodeId)!;

  // Print tensors
  printTensor('Input', input);
  printTensor('Gamma', gamma);
  printTensor('Beta', beta);
  printTensor('Group Normalized Output', output);

  // Compute gradients
  backward(graph, gnNodeId);

  // Print gradients
  printTensor('Input Gradient', graph.getNode(inputNode).gradient!);
  printTensor('Gamma Gradient', graph.getNode(gammaNode).gradient!);
  printTensor('Beta Gradient', graph.getNode(betaNode).gradient!);
}

// Run all examples
function runAllExamples() {
  console.log('Running normalization examples...');
  batchNormExample();
  layerNormExample();
  instanceNormExample();
  groupNormExample();
  console.log('\nAll examples completed!');
}

// Export examples
export {
  batchNormExample,
  layerNormExample,
  instanceNormExample,
  groupNormExample,
  runAllExamples
};
