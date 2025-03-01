/**
 * Computation Graph Example
 *
 * This example demonstrates how to use the computation graph to build and execute
 * a simple neural network forward pass.
 */

import { createTensor, createComputationGraph } from '../core';
import { TensorOpType } from '../types/tensor';

/**
 * Simple neural network forward pass example
 */
function runSimpleNeuralNetwork(): void {
  console.log('Running simple neural network example...');

  // Create a computation graph
  const graph = createComputationGraph();

  // Create input tensor (batch_size=1, features=3)
  const inputTensor = createTensor({
    shape: [1, 3],
    dtype: 'float32',
    values: [0.5, 0.3, 0.2]
  });

  // Create weight tensors for a simple neural network with one hidden layer
  // Hidden layer: 3 inputs -> 2 outputs
  const weightsLayer1 = createTensor({
    shape: [3, 2],
    dtype: 'float32',
    values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
  });

  // Bias for hidden layer
  const biasLayer1 = createTensor({
    shape: [1, 2],
    dtype: 'float32',
    values: [0.1, 0.2]
  });

  // Output layer: 2 inputs -> 1 output
  const weightsLayer2 = createTensor({
    shape: [2, 1],
    dtype: 'float32',
    values: [0.7, 0.8]
  });

  // Bias for output layer
  const biasLayer2 = createTensor({
    shape: [1, 1],
    dtype: 'float32',
    values: [0.3]
  });

  // Add nodes to the graph
  const inputId = graph.input(inputTensor, 'input');
  const weights1Id = graph.constant(weightsLayer1, 'weights1');
  const bias1Id = graph.constant(biasLayer1, 'bias1');
  const weights2Id = graph.constant(weightsLayer2, 'weights2');
  const bias2Id = graph.constant(biasLayer2, 'bias2');

  // Build the computation graph for forward pass
  // Hidden layer: input * weights1 + bias1
  const matmul1Id = graph.operation(
    TensorOpType.MATMUL,
    [inputId, weights1Id],
    {},
    'matmul1'
  );

  const hidden1Id = graph.operation(
    TensorOpType.ADD,
    [matmul1Id, bias1Id],
    {},
    'hidden1'
  );

  // Apply ReLU activation to hidden layer
  const reluId = graph.operation(
    TensorOpType.RELU,
    [hidden1Id],
    {},
    'relu'
  );

  // Output layer: relu * weights2 + bias2
  const matmul2Id = graph.operation(
    TensorOpType.MATMUL,
    [reluId, weights2Id],
    {},
    'matmul2'
  );

  const outputId = graph.operation(
    TensorOpType.ADD,
    [matmul2Id, bias2Id],
    {},
    'output'
  );

  // Apply sigmoid activation to output
  const sigmoidId = graph.operation(
    TensorOpType.SIGMOID,
    [outputId],
    {},
    'sigmoid'
  );

  // Mark the sigmoid node as an output of the graph
  graph.markOutput(sigmoidId);

  // Execute the graph
  console.log('Executing the graph...');
  const result = graph.execute();

  // Get the output tensor
  const outputTensor = result.outputs.get(sigmoidId);
  if (outputTensor) {
    console.log('Output tensor shape:', outputTensor.shape);
    console.log('Output tensor values:', outputTensor.toArray());
  } else {
    console.error('No output tensor found');
  }

  // Print performance information
  console.log('Execution time:', result.performance.executionTime.toFixed(2), 'ms');
  console.log('Operations executed:', result.performance.operationsExecuted);
  console.log('Memory used:', (result.performance.memoryUsed / 1024).toFixed(2), 'KB');

  // Execute with gradient computation
  console.log('\nExecuting the graph with gradient computation...');
  const resultWithGradients = graph.execute({ computeGradients: true });

  // Get gradients
  if (resultWithGradients.gradients) {
    console.log('Gradients computed for', resultWithGradients.gradients.size, 'nodes');

    // Print gradient for sigmoid output
    const sigmoidGradient = graph.getGradient(sigmoidId);
    if (sigmoidGradient) {
      console.log('Sigmoid gradient shape:', sigmoidGradient.shape);
      console.log('Sigmoid gradient values:', sigmoidGradient.toArray());
    }
  }

  console.log('Simple neural network example completed.');
}

/**
 * Example of building a more complex computation graph with multiple outputs
 */
function runMultiOutputExample(): void {
  console.log('\nRunning multi-output example...');

  // Create a computation graph
  const graph = createComputationGraph();

  // Create input tensor
  const inputTensor = createTensor({
    shape: [2, 2],
    dtype: 'float32',
    values: [1.0, 2.0, 3.0, 4.0]
  });

  // Add input node to the graph
  const inputId = graph.input(inputTensor, 'input');

  // Create multiple operations on the input
  const squaredId = graph.operation(
    TensorOpType.MULTIPLY,
    [inputId, inputId],
    {},
    'squared'
  );

  const sumId = graph.operation(
    TensorOpType.SUM,
    [inputId],
    { axes: [1], keepDims: true },
    'sum'
  );

  const meanId = graph.operation(
    TensorOpType.MEAN,
    [inputId],
    { axes: [1], keepDims: true },
    'mean'
  );

  const maxId = graph.operation(
    TensorOpType.MAX,
    [inputId],
    { axes: [1], keepDims: true },
    'max'
  );

  // Mark multiple nodes as outputs
  graph.markOutput(squaredId);
  graph.markOutput(sumId);
  graph.markOutput(meanId);
  graph.markOutput(maxId);

  // Execute the graph
  console.log('Executing the graph with multiple outputs...');
  const result = graph.execute();

  // Get the output tensors
  console.log('Number of outputs:', result.outputs.size);

  const squaredTensor = result.outputs.get(squaredId);
  if (squaredTensor) {
    console.log('Squared tensor values:', squaredTensor.toArray());
  }

  const sumTensor = result.outputs.get(sumId);
  if (sumTensor) {
    console.log('Sum tensor values:', sumTensor.toArray());
  }

  const meanTensor = result.outputs.get(meanId);
  if (meanTensor) {
    console.log('Mean tensor values:', meanTensor.toArray());
  }

  const maxTensor = result.outputs.get(maxId);
  if (maxTensor) {
    console.log('Max tensor values:', maxTensor.toArray());
  }

  console.log('Multi-output example completed.');
}

/**
 * Run the examples
 */
export function runComputationGraphExamples(): void {
  console.log('=== Computation Graph Examples ===\n');

  // Run the simple neural network example
  runSimpleNeuralNetwork();

  // Run the multi-output example
  runMultiOutputExample();

  console.log('\n=== Examples Completed ===');
}

// Run the examples if this file is executed directly
if (require.main === module) {
  runComputationGraphExamples();
}
