/**
 * Automatic Differentiation Module
 *
 * This file provides utilities for automatic differentiation in the Neural Computation Framework.
 */

import { ComputationGraph } from '../types/computation';
import { Tensor } from '../types/tensor';
import { createTensor } from './tensor';

/**
 * Compute gradients for a computation graph
 * @param graph Computation graph
 * @param outputId ID of the output node
 * @param gradOutput Optional gradient to start with (defaults to ones)
 */
export function backward(
  graph: ComputationGraph,
  outputId: string,
  gradOutput?: Tensor
): void {
  // Get output node
  const outputNode = graph.getNode(outputId);

  // Skip if output doesn't require gradients
  if (!outputNode.requiresGrad) {
    return;
  }

  // Initialize gradient if not provided
  if (!gradOutput) {
    // Default to ones with same shape as output
    gradOutput = createTensor({
      shape: outputNode.output!.shape,
      dtype: outputNode.output!.dtype,
      values: new Array(outputNode.output!.size).fill(1)
    });
  }

  // Set initial gradient
  outputNode.gradient = gradOutput;

  // Execute backward pass
  graph.execute({
    computeGradients: true,
    useCached: true,
    cacheResults: true
  });
}

/**
 * Get gradient of a node with respect to an input
 * @param graph Computation graph
 * @param outputId ID of the output node
 * @param inputId ID of the input node
 * @param gradOutput Optional gradient to start with
 */
export function grad(
  graph: ComputationGraph,
  outputId: string,
  inputId: string,
  gradOutput?: Tensor
): Tensor | null {
  // Compute gradients
  backward(graph, outputId, gradOutput);

  // Get gradient for the input node
  const inputNode = graph.getNode(inputId);
  return inputNode.gradient || null;
}

/**
 * Compute value and gradient of a function
 * @param fn Function that takes inputs and returns a computation graph and output ID
 * @param inputs Input tensors
 */
export function valueAndGrad(
  fn: (...inputs: Tensor[]) => [ComputationGraph, string],
  ...inputs: Tensor[]
): [Tensor, Tensor[]] {
  // Call function to get graph and output ID
  const [graph, outputId] = fn(...inputs);

  // Get output value
  const outputValue = graph.getOutput(outputId);

  // Compute gradients
  backward(graph, outputId);

  // Get gradients for all inputs
  const gradients: Tensor[] = [];
  for (const inputId of graph.inputs) {
    const inputNode = graph.getNode(inputId);
    gradients.push(inputNode.gradient || createTensor({
      shape: inputNode.output!.shape,
      dtype: inputNode.output!.dtype,
      values: new Array(inputNode.output!.size).fill(0)
    }));
  }

  return [outputValue, gradients];
}

/**
 * Create a function that computes both value and gradient
 * @param fn Function that takes inputs and returns a computation graph and output ID
 */
export function withGrad<T extends any[]>(
  fn: (...inputs: T) => [ComputationGraph, string]
): (...inputs: T) => [Tensor, Tensor[]] {
  return (...inputs: T) => {
    // Type assertion to handle the generic constraint
    return valueAndGrad(fn as any, ...inputs as any);
  };
}

/**
 * Compute numerical gradient for testing purposes
 * @param fn Function that takes a tensor and returns a scalar
 * @param input Input tensor
 * @param epsilon Small value for finite difference approximation
 */
export function numericalGradient(
  fn: (x: Tensor) => number,
  input: Tensor,
  epsilon: number = 1e-5
): Tensor {
  // Create gradient tensor with same shape as input
  const gradValues = new Array(input.size).fill(0);

  // Compute gradient for each element
  for (let i = 0; i < input.size; i++) {
    // Get indices for this element
    const indices = [];
    let remaining = i;
    for (let j = 0; j < input.rank; j++) {
      indices.push(Math.floor(remaining / input.strides[j]));
      remaining %= input.strides[j];
    }

    // Get original value
    const originalValue = input.get(...indices);

    // Compute f(x + epsilon)
    input.set(originalValue + epsilon, ...indices);
    const fPlus = fn(input);

    // Compute f(x - epsilon)
    input.set(originalValue - epsilon, ...indices);
    const fMinus = fn(input);

    // Restore original value
    input.set(originalValue, ...indices);

    // Compute gradient using central difference
    gradValues[i] = (fPlus - fMinus) / (2 * epsilon);
  }

  // Create gradient tensor
  return createTensor({
    shape: input.shape,
    dtype: input.dtype,
    values: gradValues
  });
}
