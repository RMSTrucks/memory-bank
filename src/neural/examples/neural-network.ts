/**
 * Neural Network Example
 *
 * This example demonstrates how to use the Neural Computation Framework
 * to build and train a simple neural network.
 */

import { ComputationGraphImpl } from '../core/computation-graph';
import { createTensor, zeros, random } from '../core/tensor';
import { Tensor, TensorOpType } from '../types/tensor';
import * as autograd from '../core/autograd';

/**
 * Simple neural network with one hidden layer
 */
export class SimpleNN {
  graph: ComputationGraphImpl;
  W1: string; // First layer weights
  b1: string; // First layer bias
  W2: string; // Second layer weights
  b2: string; // Second layer bias

  /**
   * Create a new neural network
   * @param inputSize Input size
   * @param hiddenSize Hidden layer size
   * @param outputSize Output size
   */
  constructor(inputSize: number, hiddenSize: number, outputSize: number) {
    this.graph = new ComputationGraphImpl();

    // Initialize weights and biases
    this.W1 = this.graph.variable(
      random([inputSize, hiddenSize], 'float32', -0.1, 0.1),
      'W1'
    );

    this.b1 = this.graph.variable(
      zeros([1, hiddenSize], 'float32'),
      'b1'
    );

    this.W2 = this.graph.variable(
      random([hiddenSize, outputSize], 'float32', -0.1, 0.1),
      'W2'
    );

    this.b2 = this.graph.variable(
      zeros([1, outputSize], 'float32'),
      'b2'
    );
  }

  /**
   * Forward pass
   * @param x Input tensor node ID
   */
  forward(x: string): string {
    // First layer: h = relu(x @ W1 + b1)
    const xW1 = this.graph.operation(
      TensorOpType.MATMUL,
      [x, this.W1],
      {},
      'xW1'
    );

    const xW1_b1 = this.graph.operation(
      TensorOpType.ADD,
      [xW1, this.b1],
      {},
      'xW1_b1'
    );

    const h = this.graph.operation(
      TensorOpType.RELU,
      [xW1_b1],
      {},
      'h'
    );

    // Second layer: y = h @ W2 + b2
    const hW2 = this.graph.operation(
      TensorOpType.MATMUL,
      [h, this.W2],
      {},
      'hW2'
    );

    const y = this.graph.operation(
      TensorOpType.ADD,
      [hW2, this.b2],
      {},
      'y'
    );

    return y;
  }

  /**
   * Compute loss
   * @param output Output tensor ID
   * @param target Target tensor ID
   */
  loss(output: string, target: string): string {
    // Mean squared error loss
    const diff = this.graph.operation(
      TensorOpType.SUBTRACT,
      [output, target],
      {},
      'diff'
    );

    const squared = this.graph.operation(
      TensorOpType.MULTIPLY,
      [diff, diff],
      {},
      'squared'
    );

    const loss = this.graph.operation(
      TensorOpType.MEAN,
      [squared],
      {},
      'loss'
    );

    this.graph.markOutput(loss);
    return loss;
  }

  /**
   * Update parameters using gradients
   * @param learningRate Learning rate
   */
  updateParameters(learningRate: number): void {
    // Get parameters
    const parameters = [this.W1, this.b1, this.W2, this.b2];

    // Create learning rate tensor
    const lr = createTensor({
      shape: [],
      dtype: 'float32',
      values: [learningRate]
    });

    // Update each parameter
    for (const paramId of parameters) {
      const param = this.graph.getNode(paramId);
      const gradient = param.gradient;

      if (gradient) {
        // Compute update: param = param - lr * gradient
        const lrNode = this.graph.constant(lr, `${param.metadata?.name}_lr`);
        const gradNode = this.graph.constant(gradient, `${param.metadata?.name}_grad`);

        const update = this.graph.operation(
          TensorOpType.MULTIPLY,
          [lrNode, gradNode],
          {},
          `${param.metadata?.name}_update`
        );

        // Apply update
        const newParam = this.graph.operation(
          TensorOpType.SUBTRACT,
          [paramId, update],
          {},
          `${param.metadata?.name}_new`
        );

        // Replace parameter value
        param.output = this.graph.getOutput(newParam);

        // Clear gradient
        param.gradient = null;
      }
    }
  }

  /**
   * Train the network
   * @param x Input data
   * @param y Target data
   * @param epochs Number of epochs
   * @param learningRate Learning rate
   */
  train(x: number[][], y: number[][], epochs: number, learningRate: number): number[] {
    // Convert inputs to tensors
    const xTensor = createTensor({
      shape: [x.length, x[0].length],
      dtype: 'float32',
      values: x.flat()
    });

    const yTensor = createTensor({
      shape: [y.length, y[0].length],
      dtype: 'float32',
      values: y.flat()
    });

    // Add inputs to graph
    const xInput = this.graph.input(xTensor, 'x_input');
    const yInput = this.graph.input(yTensor, 'y_input');

    // Track losses
    const losses: number[] = [];

    // Training loop
    for (let epoch = 0; epoch < epochs; epoch++) {
      // Forward pass
      const output = this.forward(xInput);

      // Compute loss
      const lossId = this.loss(output, yInput);

      // Execute forward pass
      const result = this.graph.execute({
        useCached: false,
        cacheResults: true
      });

      // Get loss value - use get() without indices for scalar values
      const lossValue = this.graph.getOutput(lossId).get();
      losses.push(lossValue);

      // Backward pass
      autograd.backward(this.graph, lossId);

      // Update parameters
      this.updateParameters(learningRate);

      // Log progress
      if ((epoch + 1) % 10 === 0 || epoch === 0) {
        console.log(`Epoch ${epoch + 1}/${epochs}, Loss: ${lossValue.toFixed(6)}`);
      }
    }

    return losses;
  }

  /**
   * Predict using the trained network
   * @param x Input data
   */
  predict(x: number[]): number[] {
    // Convert input to tensor
    const xTensor = createTensor({
      shape: [1, x.length],
      dtype: 'float32',
      values: x
    });

    // Add input to graph
    const xInput = this.graph.input(xTensor, 'x_predict');

    // Forward pass
    const output = this.forward(xInput);

    // Execute forward pass
    this.graph.execute({
      useCached: false,
      cacheResults: false
    });

    // Get output
    const outputTensor = this.graph.getOutput(output);

    // Convert to array
    const result: number[] = [];
    for (let i = 0; i < outputTensor.size; i++) {
      result.push(outputTensor.get(0, i));
    }

    return result;
  }
}

/**
 * Example usage
 */
export function runXORExample(): void {
  console.log('Training neural network on XOR problem...');

  // Create neural network
  const nn = new SimpleNN(2, 5, 1);

  // XOR data
  const x = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const y = [[0], [1], [1], [0]];

  // Train
  const losses = nn.train(x, y, 1000, 0.1);

  // Test
  console.log('\nTesting trained network:');
  for (const input of x) {
    const output = nn.predict(input);
    console.log(`Input: [${input}], Output: ${output[0].toFixed(4)}, Expected: ${y[x.indexOf(input)][0]}`);
  }

  console.log('\nFinal loss:', losses[losses.length - 1].toFixed(6));
}

// Run example if this file is executed directly
if (require.main === module) {
  runXORExample();
}
