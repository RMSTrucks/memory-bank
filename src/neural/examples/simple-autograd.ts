/**
 * Simple Automatic Differentiation Example
 *
 * This example demonstrates the basic functionality of the automatic differentiation system
 * by computing gradients for a simple function.
 */

import { ComputationGraphImpl } from '../core/computation-graph';
import { createTensor } from '../core/tensor';
import { TensorOpType } from '../types/tensor';
import * as autograd from '../core/autograd';

/**
 * Run a simple example of automatic differentiation
 */
function runSimpleExample(): void {
  console.log('=== Simple Automatic Differentiation Example ===');

  // Create a computation graph
  const graph = new ComputationGraphImpl();

  // Create input tensors
  const x = createTensor({
    shape: [1],
    dtype: 'float32',
    values: [2.0]
  });

  const y = createTensor({
    shape: [1],
    dtype: 'float32',
    values: [3.0]
  });

  // Add tensors to graph
  const xId = graph.input(x, 'x', true);
  const yId = graph.input(y, 'y', true);

  // Compute z = x * y
  const zId = graph.operation(
    TensorOpType.MULTIPLY,
    [xId, yId],
    {},
    'z'
  );

  // Mark z as output
  graph.markOutput(zId);

  // Execute forward pass
  const result = graph.execute({
    useCached: false,
    cacheResults: true,
    computeGradients: false
  });

  // Get output
  const z = graph.getOutput(zId);
  console.log(`z = x * y = ${x.get(0)} * ${y.get(0)} = ${z.get(0)}`);

  // Compute gradients
  autograd.backward(graph, zId);

  // Get gradients
  const dz_dx = graph.getGradient(xId);
  const dz_dy = graph.getGradient(yId);

  console.log(`dz/dx = ${dz_dx?.get(0)} (expected: ${y.get(0)})`);
  console.log(`dz/dy = ${dz_dy?.get(0)} (expected: ${x.get(0)})`);

  // More complex example: w = x^2 + y^2
  console.log('\n=== More Complex Example ===');

  // Compute x^2
  const xSquaredId = graph.operation(
    TensorOpType.MULTIPLY,
    [xId, xId],
    {},
    'x_squared'
  );

  // Compute y^2
  const ySquaredId = graph.operation(
    TensorOpType.MULTIPLY,
    [yId, yId],
    {},
    'y_squared'
  );

  // Compute w = x^2 + y^2
  const wId = graph.operation(
    TensorOpType.ADD,
    [xSquaredId, ySquaredId],
    {},
    'w'
  );

  // Mark w as output
  graph.markOutput(wId);

  // Execute forward pass
  const result2 = graph.execute({
    useCached: false,
    cacheResults: true,
    computeGradients: false
  });

  // Get output
  const w = graph.getOutput(wId);
  console.log(`w = x^2 + y^2 = ${x.get(0)}^2 + ${y.get(0)}^2 = ${w.get(0)}`);

  // Reset gradients before computing new ones
  graph.resetGradients();

  // Compute gradients
  autograd.backward(graph, wId);

  // Get gradients
  const dw_dx = graph.getGradient(xId);
  const dw_dy = graph.getGradient(yId);

  console.log(`dw/dx = ${dw_dx?.get(0)} (expected: ${2 * x.get(0)})`);
  console.log(`dw/dy = ${dw_dy?.get(0)} (expected: ${2 * y.get(0)})`);
}

// Run the example
runSimpleExample();
