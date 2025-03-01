/**
 * Tests for Normalization Gradients
 *
 * This file contains tests for the gradient functions of normalization operations.
 */

import { createTensor } from '../core/tensor';
import { batchNorm, layerNorm, instanceNorm, groupNorm } from '../core/normalization';
import { ComputationGraphImpl } from '../core/computation-graph';
import { TensorOpType, Tensor } from '../types/tensor';
import { numericalGradient } from '../core/autograd';

/**
 * Calculate the relative error between two tensors
 * @param a First tensor
 * @param b Second tensor
 */
function gradientError(a: Tensor, b: Tensor): number {
  // Calculate L2 norm of the difference
  let diffSum = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.size; i++) {
    const diff = a.get(i) - b.get(i);
    diffSum += diff * diff;
    normA += a.get(i) * a.get(i);
    normB += b.get(i) * b.get(i);
  }

  // Avoid division by zero
  const norm = Math.sqrt(normA) + Math.sqrt(normB);
  if (norm < 1e-10) {
    return 0;
  }

  return Math.sqrt(diffSum) / norm;
}

describe('Normalization Gradients', () => {
  // Helper function to create random tensor
  const createRandomTensor = (shape: number[], min = -1, max = 1) => {
    const size = shape.reduce((a, b) => a * b, 1);
    const values = Array.from({ length: size }, () => min + Math.random() * (max - min));
    return createTensor({
      shape,
      dtype: 'float32',
      values
    });
  };

  describe('Batch Normalization Gradient', () => {
    test('computes correct gradient with respect to input', () => {
      // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
      const input = createRandomTensor([2, 3, 4, 5]);

      // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
      const gamma = createRandomTensor([1, 1, 1, 5], 0.5, 1.5);
      const beta = createRandomTensor([1, 1, 1, 5], -0.5, 0.5);

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

      // Execute forward pass
      graph.execute();

      // Create random gradient for output
      const outputGrad = createRandomTensor(input.shape);

      // Set output gradient
      const bnNode = graph.getNode(bnNodeId);
      bnNode.gradient = outputGrad;

      // Execute backward pass
      graph.execute({ computeGradients: true });

      // Check gradients using numerical approximation
      const numericalInputGrad = numericalGradient(
        (x) => {
          const tempGraph = new ComputationGraphImpl();
          const tempInputNode = tempGraph.input(x, 'input', true);
          const tempGammaNode = tempGraph.input(gamma, 'gamma', true);
          const tempBetaNode = tempGraph.input(beta, 'beta', true);

          const tempBnNodeId = tempGraph.operation(
            TensorOpType.BATCH_NORM,
            [tempInputNode, tempGammaNode, tempBetaNode],
            { axis: [1, 2] }
          );

          tempGraph.execute();

          // Compute loss as sum(output * outputGrad)
          let sum = 0;
          const output = tempGraph.getNode(tempBnNodeId).output!;
          for (let i = 0; i < output.size; i++) {
            sum += output.get(i) * outputGrad.get(i);
          }
          return sum;
        },
        input
      );

      // Compare analytical and numerical gradients
      const analyticalInputGrad = graph.getNode(inputNode).gradient!;

      // Check if gradients are close
      expect(gradientError(analyticalInputGrad, numericalInputGrad)).toBeLessThan(1e-4);
    });

    test('computes correct gradient with respect to gamma', () => {
      // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
      const input = createRandomTensor([2, 3, 4, 5]);

      // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
      const gamma = createRandomTensor([1, 1, 1, 5], 0.5, 1.5);
      const beta = createRandomTensor([1, 1, 1, 5], -0.5, 0.5);

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

      // Execute forward pass
      graph.execute();

      // Create random gradient for output
      const outputGrad = createRandomTensor(input.shape);

      // Set output gradient
      const bnNode = graph.getNode(bnNodeId);
      bnNode.gradient = outputGrad;

      // Execute backward pass
      graph.execute({ computeGradients: true });

      // Check gradients using numerical approximation
      const numericalGammaGrad = numericalGradient(
        (g) => {
          const tempGraph = new ComputationGraphImpl();
          const tempInputNode = tempGraph.input(input, 'input', true);
          const tempGammaNode = tempGraph.input(g, 'gamma', true);
          const tempBetaNode = tempGraph.input(beta, 'beta', true);

          const tempBnNodeId = tempGraph.operation(
            TensorOpType.BATCH_NORM,
            [tempInputNode, tempGammaNode, tempBetaNode],
            { axis: [1, 2] }
          );

          tempGraph.execute();

          // Compute loss as sum(output * outputGrad)
          let sum = 0;
          const output = tempGraph.getNode(tempBnNodeId).output!;
          for (let i = 0; i < output.size; i++) {
            sum += output.get(i) * outputGrad.get(i);
          }
          return sum;
        },
        gamma
      );

      // Compare analytical and numerical gradients
      const analyticalGammaGrad = graph.getNode(gammaNode).gradient!;

      // Check if gradients are close
      expect(gradientError(analyticalGammaGrad, numericalGammaGrad)).toBeLessThan(1e-4);
    });

    test('computes correct gradient with respect to beta', () => {
      // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
      const input = createRandomTensor([2, 3, 4, 5]);

      // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
      const gamma = createRandomTensor([1, 1, 1, 5], 0.5, 1.5);
      const beta = createRandomTensor([1, 1, 1, 5], -0.5, 0.5);

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

      // Execute forward pass
      graph.execute();

      // Create random gradient for output
      const outputGrad = createRandomTensor(input.shape);

      // Set output gradient
      const bnNode = graph.getNode(bnNodeId);
      bnNode.gradient = outputGrad;

      // Execute backward pass
      graph.execute({ computeGradients: true });

      // Check gradients using numerical approximation
      const numericalBetaGrad = numericalGradient(
        (b) => {
          const tempGraph = new ComputationGraphImpl();
          const tempInputNode = tempGraph.input(input, 'input', true);
          const tempGammaNode = tempGraph.input(gamma, 'gamma', true);
          const tempBetaNode = tempGraph.input(b, 'beta', true);

          const tempBnNodeId = tempGraph.operation(
            TensorOpType.BATCH_NORM,
            [tempInputNode, tempGammaNode, tempBetaNode],
            { axis: [1, 2] }
          );

          tempGraph.execute();

          // Compute loss as sum(output * outputGrad)
          let sum = 0;
          const output = tempGraph.getNode(tempBnNodeId).output!;
          for (let i = 0; i < output.size; i++) {
            sum += output.get(i) * outputGrad.get(i);
          }
          return sum;
        },
        beta
      );

      // Compare analytical and numerical gradients
      const analyticalBetaGrad = graph.getNode(betaNode).gradient!;

      // Check if gradients are close
      expect(gradientError(analyticalBetaGrad, numericalBetaGrad)).toBeLessThan(1e-4);
    });
  });

  describe('Layer Normalization Gradient', () => {
    test('computes correct gradient with respect to input', () => {
      // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
      const input = createRandomTensor([2, 3, 4, 5]);

      // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
      const gamma = createRandomTensor([1, 1, 1, 5], 0.5, 1.5);
      const beta = createRandomTensor([1, 1, 1, 5], -0.5, 0.5);

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

      // Execute forward pass
      graph.execute();

      // Create random gradient for output
      const outputGrad = createRandomTensor(input.shape);

      // Set output gradient
      const lnNode = graph.getNode(lnNodeId);
      lnNode.gradient = outputGrad;

      // Execute backward pass
      graph.execute({ computeGradients: true });

      // Check gradients using numerical approximation
      const numericalInputGrad = numericalGradient(
        (x) => {
          const tempGraph = new ComputationGraphImpl();
          const tempInputNode = tempGraph.input(x, 'input', true);
          const tempGammaNode = tempGraph.input(gamma, 'gamma', true);
          const tempBetaNode = tempGraph.input(beta, 'beta', true);

          const tempLnNodeId = tempGraph.operation(
            TensorOpType.LAYER_NORM,
            [tempInputNode, tempGammaNode, tempBetaNode],
            { axis: [1, 2, 3] }
          );

          tempGraph.execute();

          // Compute loss as sum(output * outputGrad)
          let sum = 0;
          const output = tempGraph.getNode(tempLnNodeId).output!;
          for (let i = 0; i < output.size; i++) {
            sum += output.get(i) * outputGrad.get(i);
          }
          return sum;
        },
        input
      );

      // Compare analytical and numerical gradients
      const analyticalInputGrad = graph.getNode(inputNode).gradient!;

      // Check if gradients are close
      expect(gradientError(analyticalInputGrad, numericalInputGrad)).toBeLessThan(1e-4);
    });
  });

  describe('Instance Normalization Gradient', () => {
    test('computes correct gradient with respect to input', () => {
      // Create input tensor with shape [2, 3, 4, 5] (batch, height, width, channels)
      const input = createRandomTensor([2, 3, 4, 5]);

      // Create gamma and beta tensors with shape [1, 1, 1, 5] (one per channel)
      const gamma = createRandomTensor([1, 1, 1, 5], 0.5, 1.5);
      const beta = createRandomTensor([1, 1, 1, 5], -0.5, 0.5);

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

      // Execute forward pass
      graph.execute();

      // Create random gradient for output
      const outputGrad = createRandomTensor(input.shape);

      // Set output gradient
      const inNode = graph.getNode(inNodeId);
      inNode.gradient = outputGrad;

      // Execute backward pass
      graph.execute({ computeGradients: true });

      // Check gradients using numerical approximation
      const numericalInputGrad = numericalGradient(
        (x) => {
          const tempGraph = new ComputationGraphImpl();
          const tempInputNode = tempGraph.input(x, 'input', true);
          const tempGammaNode = tempGraph.input(gamma, 'gamma', true);
          const tempBetaNode = tempGraph.input(beta, 'beta', true);

          const tempInNodeId = tempGraph.operation(
            TensorOpType.INSTANCE_NORM,
            [tempInputNode, tempGammaNode, tempBetaNode],
            { axis: [1, 2] }
          );

          tempGraph.execute();

          // Compute loss as sum(output * outputGrad)
          let sum = 0;
          const output = tempGraph.getNode(tempInNodeId).output!;
          for (let i = 0; i < output.size; i++) {
            sum += output.get(i) * outputGrad.get(i);
          }
          return sum;
        },
        input
      );

      // Compare analytical and numerical gradients
      const analyticalInputGrad = graph.getNode(inputNode).gradient!;

      // Check if gradients are close
      expect(gradientError(analyticalInputGrad, numericalInputGrad)).toBeLessThan(1e-4);
    });
  });

  describe('Group Normalization Gradient', () => {
    test('computes correct gradient with respect to input', () => {
      // Create input tensor with shape [2, 3, 4, 8] (batch, height, width, channels)
      // Note: channels must be divisible by groups
      const input = createRandomTensor([2, 3, 4, 8]);

      // Create gamma and beta tensors with shape [1, 1, 1, 8] (one per channel)
      const gamma = createRandomTensor([1, 1, 1, 8], 0.5, 1.5);
      const beta = createRandomTensor([1, 1, 1, 8], -0.5, 0.5);

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

      // Execute forward pass
      graph.execute();

      // Create random gradient for output
      const outputGrad = createRandomTensor(input.shape);

      // Set output gradient
      const gnNode = graph.getNode(gnNodeId);
      gnNode.gradient = outputGrad;

      // Execute backward pass
      graph.execute({ computeGradients: true });

      // Check gradients using numerical approximation
      const numericalInputGrad = numericalGradient(
        (x) => {
          const tempGraph = new ComputationGraphImpl();
          const tempInputNode = tempGraph.input(x, 'input', true);
          const tempGammaNode = tempGraph.input(gamma, 'gamma', true);
          const tempBetaNode = tempGraph.input(beta, 'beta', true);

          const tempGnNodeId = tempGraph.operation(
            TensorOpType.GROUP_NORM,
            [tempInputNode, tempGammaNode, tempBetaNode],
            { axis: [1, 2], groups: 4 }
          );

          tempGraph.execute();

          // Compute loss as sum(output * outputGrad)
          let sum = 0;
          const output = tempGraph.getNode(tempGnNodeId).output!;
          for (let i = 0; i < output.size; i++) {
            sum += output.get(i) * outputGrad.get(i);
          }
          return sum;
        },
        input
      );

      // Compare analytical and numerical gradients
      const analyticalInputGrad = graph.getNode(inputNode).gradient!;

      // Check if gradients are close
      expect(gradientError(analyticalInputGrad, numericalInputGrad)).toBeLessThan(1e-4);
    });
  });
});
