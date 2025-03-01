/**
 * Advanced Activation Functions Example
 *
 * This example demonstrates the usage of advanced activation functions
 * in the Neural Computation Framework, including LeakyReLU, ELU, GELU, and Swish/SiLU.
 */

import { ComputationGraphImpl } from '../core/computation-graph';
import { createTensor } from '../core/tensor';
import { TensorOpType } from '../types/tensor';
import * as ops from '../core/operations';
import * as autograd from '../core/autograd';

/**
 * Compare different activation functions on the same input
 */
function compareActivationFunctions(): void {
  console.log('=== Advanced Activation Functions Comparison ===');

  // Create input values from -3 to 3 with 0.5 step
  const inputValues = [];
  for (let x = -3; x <= 3; x += 0.5) {
    inputValues.push(x);
  }

  // Create input tensor
  const inputTensor = createTensor({
    shape: [inputValues.length],
    dtype: 'float32',
    values: inputValues
  });

  // Create computation graph
  const graph = new ComputationGraphImpl();

  // Add input to graph
  const inputId = graph.input(inputTensor, 'input', true);

  // Apply different activation functions
  const reluId = graph.operation(
    TensorOpType.RELU,
    [inputId],
    {},
    'relu'
  );

  const leakyReluId = graph.operation(
    TensorOpType.LEAKY_RELU,
    [inputId],
    { alpha: 0.1 },
    'leaky_relu'
  );

  const eluId = graph.operation(
    TensorOpType.ELU,
    [inputId],
    { alpha: 1.0 },
    'elu'
  );

  const geluId = graph.operation(
    TensorOpType.GELU,
    [inputId],
    { approximate: false },
    'gelu'
  );

  const swishId = graph.operation(
    TensorOpType.SWISH,
    [inputId],
    { beta: 1.0 },
    'swish'
  );

  // Mark all as outputs
  graph.markOutput(reluId);
  graph.markOutput(leakyReluId);
  graph.markOutput(eluId);
  graph.markOutput(geluId);
  graph.markOutput(swishId);

  // Execute forward pass
  const result = graph.execute({
    useCached: false,
    cacheResults: true,
    computeGradients: false
  });

  // Get outputs
  const reluOutput = graph.getOutput(reluId);
  const leakyReluOutput = graph.getOutput(leakyReluId);
  const eluOutput = graph.getOutput(eluId);
  const geluOutput = graph.getOutput(geluId);
  const swishOutput = graph.getOutput(swishId);

  // Print results
  console.log('\nActivation Function Outputs:');
  console.log('x\tReLU\tLeakyReLU\tELU\tGELU\tSwish');
  console.log('-----------------------------------------------------------');
  for (let i = 0; i < inputValues.length; i++) {
    console.log(
      `${inputValues[i].toFixed(1)}\t` +
      `${reluOutput.get(i).toFixed(3)}\t` +
      `${leakyReluOutput.get(i).toFixed(3)}\t` +
      `${eluOutput.get(i).toFixed(3)}\t` +
      `${geluOutput.get(i).toFixed(3)}\t` +
      `${swishOutput.get(i).toFixed(3)}`
    );
  }

  // Compute gradients
  console.log('\n=== Gradient Computation ===');

  // Reset gradients
  graph.resetGradients();

  // Compute gradients for each activation function
  autograd.backward(graph, reluId);
  const reluGrad = graph.getGradient(inputId);
  graph.resetGradients();

  autograd.backward(graph, leakyReluId);
  const leakyReluGrad = graph.getGradient(inputId);
  graph.resetGradients();

  autograd.backward(graph, eluId);
  const eluGrad = graph.getGradient(inputId);
  graph.resetGradients();

  autograd.backward(graph, geluId);
  const geluGrad = graph.getGradient(inputId);
  graph.resetGradients();

  autograd.backward(graph, swishId);
  const swishGrad = graph.getGradient(inputId);

  // Print gradient results
  console.log('\nGradients at Each Input Point:');
  console.log('x\tReLU\tLeakyReLU\tELU\tGELU\tSwish');
  console.log('-----------------------------------------------------------');
  for (let i = 0; i < inputValues.length; i++) {
    console.log(
      `${inputValues[i].toFixed(1)}\t` +
      `${reluGrad?.get(i).toFixed(3) || 'N/A'}\t` +
      `${leakyReluGrad?.get(i).toFixed(3) || 'N/A'}\t` +
      `${eluGrad?.get(i).toFixed(3) || 'N/A'}\t` +
      `${geluGrad?.get(i).toFixed(3) || 'N/A'}\t` +
      `${swishGrad?.get(i).toFixed(3) || 'N/A'}`
    );
  }
}

/**
 * Demonstrate a simple neural network layer with different activation functions
 */
function simpleNeuralNetworkLayer(): void {
  console.log('\n=== Simple Neural Network Layer with Different Activations ===');

  // Create input tensor (batch_size=2, features=3)
  const inputTensor = createTensor({
    shape: [2, 3],
    dtype: 'float32',
    values: [0.5, -0.2, 0.1, 0.8, -0.5, 0.3]
  });

  // Create weights tensor (in_features=3, out_features=2)
  const weightsTensor = createTensor({
    shape: [3, 2],
    dtype: 'float32',
    values: [0.1, 0.2, -0.1, 0.3, 0.4, -0.2]
  });

  // Create bias tensor (out_features=2)
  const biasTensor = createTensor({
    shape: [2],
    dtype: 'float32',
    values: [0.1, -0.1]
  });

  // Create computation graph
  const graph = new ComputationGraphImpl();

  // Add tensors to graph
  const inputId = graph.input(inputTensor, 'input', true);
  const weightsId = graph.variable(weightsTensor, 'weights');
  const biasId = graph.variable(biasTensor, 'bias');

  // Linear transformation: output = input @ weights + bias
  const matmulId = graph.operation(
    TensorOpType.MATMUL,
    [inputId, weightsId],
    {},
    'matmul'
  );

  // Add bias (broadcasting)
  const linearId = graph.operation(
    TensorOpType.ADD,
    [matmulId, biasId],
    {},
    'linear'
  );

  // Apply different activation functions
  const reluId = graph.operation(
    TensorOpType.RELU,
    [linearId],
    {},
    'relu_output'
  );

  const leakyReluId = graph.operation(
    TensorOpType.LEAKY_RELU,
    [linearId],
    { alpha: 0.1 },
    'leaky_relu_output'
  );

  const eluId = graph.operation(
    TensorOpType.ELU,
    [linearId],
    { alpha: 1.0 },
    'elu_output'
  );

  const geluId = graph.operation(
    TensorOpType.GELU,
    [linearId],
    { approximate: true },
    'gelu_output'
  );

  const swishId = graph.operation(
    TensorOpType.SWISH,
    [linearId],
    { beta: 1.0 },
    'swish_output'
  );

  // Mark outputs
  graph.markOutput(reluId);
  graph.markOutput(leakyReluId);
  graph.markOutput(eluId);
  graph.markOutput(geluId);
  graph.markOutput(swishId);

  // Execute forward pass
  const result = graph.execute({
    useCached: false,
    cacheResults: true,
    computeGradients: false
  });

  // Get outputs
  const reluOutput = graph.getOutput(reluId);
  const leakyReluOutput = graph.getOutput(leakyReluId);
  const eluOutput = graph.getOutput(eluId);
  const geluOutput = graph.getOutput(geluId);
  const swishOutput = graph.getOutput(swishId);

  // Print linear output (before activation)
  const linearOutput = graph.getOutput(linearId);
  console.log('\nLinear Output (before activation):');
  for (let i = 0; i < linearOutput.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < linearOutput.shape[1]; j++) {
      row.push(linearOutput.get(i, j).toFixed(3));
    }
    console.log(`[${row.join(', ')}]`);
  }

  // Print outputs with different activation functions
  console.log('\nOutputs with Different Activation Functions:');

  console.log('\nReLU:');
  for (let i = 0; i < reluOutput.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < reluOutput.shape[1]; j++) {
      row.push(reluOutput.get(i, j).toFixed(3));
    }
    console.log(`[${row.join(', ')}]`);
  }

  console.log('\nLeaky ReLU:');
  for (let i = 0; i < leakyReluOutput.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < leakyReluOutput.shape[1]; j++) {
      row.push(leakyReluOutput.get(i, j).toFixed(3));
    }
    console.log(`[${row.join(', ')}]`);
  }

  console.log('\nELU:');
  for (let i = 0; i < eluOutput.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < eluOutput.shape[1]; j++) {
      row.push(eluOutput.get(i, j).toFixed(3));
    }
    console.log(`[${row.join(', ')}]`);
  }

  console.log('\nGELU:');
  for (let i = 0; i < geluOutput.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < geluOutput.shape[1]; j++) {
      row.push(geluOutput.get(i, j).toFixed(3));
    }
    console.log(`[${row.join(', ')}]`);
  }

  console.log('\nSwish:');
  for (let i = 0; i < swishOutput.shape[0]; i++) {
    const row = [];
    for (let j = 0; j < swishOutput.shape[1]; j++) {
      row.push(swishOutput.get(i, j).toFixed(3));
    }
    console.log(`[${row.join(', ')}]`);
  }

  // Compute gradients for backpropagation
  console.log('\n=== Backpropagation with Different Activations ===');

  // Define a simple loss function (sum of all outputs)
  const createSumLoss = (outputId: string) => {
    return graph.operation(
      TensorOpType.SUM,
      [outputId],
      {},
      `${outputId}_loss`
    );
  };

  // Create loss nodes
  const reluLossId = createSumLoss(reluId);
  const leakyReluLossId = createSumLoss(leakyReluId);
  const eluLossId = createSumLoss(eluId);
  const geluLossId = createSumLoss(geluId);
  const swishLossId = createSumLoss(swishId);

  // Mark losses as outputs
  graph.markOutput(reluLossId);
  graph.markOutput(leakyReluLossId);
  graph.markOutput(eluLossId);
  graph.markOutput(geluLossId);
  graph.markOutput(swishLossId);

  // Execute forward pass again to compute losses
  graph.execute({
    useCached: true,
    cacheResults: true,
    computeGradients: false
  });

  // Compute gradients for each activation function
  const computeAndPrintGradients = (lossId: string, name: string) => {
    graph.resetGradients();
    autograd.backward(graph, lossId);

    const inputGrad = graph.getGradient(inputId);
    const weightsGrad = graph.getGradient(weightsId);
    const biasGrad = graph.getGradient(biasId);

    console.log(`\n${name} - Input Gradients:`);
    for (let i = 0; i < inputGrad!.shape[0]; i++) {
      const row = [];
      for (let j = 0; j < inputGrad!.shape[1]; j++) {
        row.push(inputGrad!.get(i, j).toFixed(3));
      }
      console.log(`[${row.join(', ')}]`);
    }

    console.log(`\n${name} - Weights Gradients:`);
    for (let i = 0; i < weightsGrad!.shape[0]; i++) {
      const row = [];
      for (let j = 0; j < weightsGrad!.shape[1]; j++) {
        row.push(weightsGrad!.get(i, j).toFixed(3));
      }
      console.log(`[${row.join(', ')}]`);
    }

    console.log(`\n${name} - Bias Gradients:`);
    const biasGradRow = [];
    for (let j = 0; j < biasGrad!.shape[0]; j++) {
      biasGradRow.push(biasGrad!.get(j).toFixed(3));
    }
    console.log(`[${biasGradRow.join(', ')}]`);
  };

  // Compute and print gradients for each activation
  computeAndPrintGradients(reluLossId, 'ReLU');
  computeAndPrintGradients(leakyReluLossId, 'Leaky ReLU');
  computeAndPrintGradients(eluLossId, 'ELU');
  computeAndPrintGradients(geluLossId, 'GELU');
  computeAndPrintGradients(swishLossId, 'Swish');
}

// Run the examples
function runExamples() {
  compareActivationFunctions();
  simpleNeuralNetworkLayer();
}

// Execute if this file is run directly
if (require.main === module) {
  runExamples();
}

export { compareActivationFunctions, simpleNeuralNetworkLayer, runExamples };
