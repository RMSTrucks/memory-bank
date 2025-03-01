/**
 * Normalization Gradient Functions
 *
 * This file provides gradient functions for normalization operations in the Neural Computation Framework.
 * It includes gradients for batch normalization, layer normalization, instance normalization, and group normalization.
 */

import { Tensor, TensorOpType } from '../types/tensor';
import { createTensor, zeros, ones } from './tensor';
import * as ops from './operations';
import {
  BatchNormCache,
  LayerNormCache,
  InstanceNormCache,
  GroupNormCache
} from '../types/normalization';
import { registerGradientFunction } from './gradients';

/**
 * Gradient for batch normalization
 *
 * Computes gradients with respect to input, gamma, and beta.
 *
 * Mathematical derivation:
 * Let y = gamma * (x - mean) / sqrt(var + epsilon) + beta
 *
 * dL/dx = dL/dy * dy/dx
 * dy/dx = gamma / sqrt(var + epsilon) - gamma * (x - mean) / (N * sqrt(var + epsilon)^3) * d(var)/dx
 * d(var)/dx = 2 * (x - mean) / N
 *
 * Simplifying:
 * dL/dx = (1/sqrt(var + epsilon)) * [
 *   dL/dy * gamma
 *   - (1/N) * sum(dL/dy * gamma)
 *   - (x - mean) / (var + epsilon) * sum(dL/dy * gamma * (x - mean))
 * ]
 *
 * dL/dgamma = sum(dL/dy * (x - mean) / sqrt(var + epsilon))
 * dL/dbeta = sum(dL/dy)
 */
registerGradientFunction(TensorOpType.BATCH_NORM, (outputGrad, input, output, params) => {
  // Extract cache from params
  const cache = params.cache as BatchNormCache;
  const { mean, variance, normalized, gamma, axis, epsilon } = cache;

  // Calculate gradients with respect to gamma and beta
  let gammaGrad: Tensor | null = null;

  if (gamma) {
    // dL/dgamma = sum(dL/dy * normalized)
    gammaGrad = ops.sum(ops.multiply(outputGrad, normalized).tensor, axis, false).tensor;
  }

  // dL/dbeta = sum(dL/dy)
  const betaGrad = ops.sum(outputGrad, axis, false).tensor;

  // Calculate gradient with respect to normalized input
  // dL/dnormalized = dL/dy * gamma
  let normalizedGrad = outputGrad;
  if (gamma) {
    normalizedGrad = ops.multiply(outputGrad, gamma).tensor;
  }

  // Calculate gradient with respect to input
  // Get batch size (N) - number of elements being normalized
  let N = 1;
  for (const ax of axis) {
    N *= input.shape[ax];
  }

  // Calculate standard deviation
  const stdDev = ops.sqrt(ops.add(variance, createTensor({
    shape: variance.shape,
    dtype: variance.dtype,
    values: new Array(variance.size).fill(epsilon)
  })).tensor).tensor;

  // Term 1: dL/dx_normalized * (1/stdDev)
  const term1 = ops.divide(normalizedGrad, stdDev).tensor;

  // Term 2: sum(dL/dx_normalized) * (-1/N) * (1/stdDev)
  const sumNormalizedGrad = ops.sum(normalizedGrad, axis, true).tensor;
  const term2Factor = ops.multiply(
    createTensor({ shape: [], dtype: input.dtype, values: [-1/N] }),
    ops.divide(sumNormalizedGrad, stdDev).tensor
  ).tensor;

  // Apply term2Factor to all elements (equivalent to broadcasting)
  const ones = createTensor({
    shape: input.shape,
    dtype: input.dtype,
    values: new Array(input.size).fill(1)
  });
  const term2 = ops.multiply(term2Factor, ones).tensor;

  // Term 3: sum(dL/dx_normalized * normalized) * (-normalized/N) * (1/variance)
  const sumNormalizedGradTimesNormalized = ops.sum(
    ops.multiply(normalizedGrad, normalized).tensor,
    axis,
    true
  ).tensor;

  const term3Factor = ops.multiply(
    ops.multiply(
      createTensor({ shape: [], dtype: input.dtype, values: [-1/N] }),
      normalized
    ).tensor,
    ops.divide(sumNormalizedGradTimesNormalized, variance).tensor
  ).tensor;

  // Combine terms to get input gradient
  const inputGrad = ops.add(
    ops.add(term1, term2).tensor,
    term3Factor
  ).tensor;

  // Return gradients
  if (gamma && gammaGrad) {
    return [inputGrad, gammaGrad, betaGrad];
  } else {
    return [inputGrad, betaGrad];
  }
});

/**
 * Gradient for layer normalization
 *
 * Computes gradients with respect to input, gamma, and beta.
 *
 * Layer normalization is similar to batch normalization but normalizes
 * across features rather than batch. The gradient computation follows
 * a similar pattern but with different axis handling.
 */
registerGradientFunction(TensorOpType.LAYER_NORM, (outputGrad, input, output, params) => {
  // Extract cache from params
  const cache = params.cache as LayerNormCache;
  const { mean, variance, normalized, gamma, axis, epsilon } = cache;

  // Calculate gradients with respect to gamma and beta
  let gammaGrad: Tensor | null = null;

  if (gamma) {
    // dL/dgamma = sum(dL/dy * normalized)
    gammaGrad = ops.sum(ops.multiply(outputGrad, normalized).tensor, axis, false).tensor;
  }

  // dL/dbeta = sum(dL/dy)
  const betaGrad = ops.sum(outputGrad, axis, false).tensor;

  // Calculate gradient with respect to normalized input
  let normalizedGrad = outputGrad;
  if (gamma) {
    normalizedGrad = ops.multiply(outputGrad, gamma).tensor;
  }

  // Calculate gradient with respect to input
  // Get feature size (M) - number of elements being normalized
  let M = 1;
  for (const ax of axis) {
    M *= input.shape[ax];
  }

  // Calculate standard deviation
  const stdDev = ops.sqrt(ops.add(variance, createTensor({
    shape: variance.shape,
    dtype: variance.dtype,
    values: new Array(variance.size).fill(epsilon)
  })).tensor).tensor;

  // Term 1: dL/dx_normalized * (1/stdDev)
  const term1 = ops.divide(normalizedGrad, stdDev).tensor;

  // Term 2: sum(dL/dx_normalized) * (-1/M) * (1/stdDev)
  const sumNormalizedGrad = ops.sum(normalizedGrad, axis, true).tensor;
  const term2Factor = ops.multiply(
    createTensor({ shape: [], dtype: input.dtype, values: [-1/M] }),
    ops.divide(sumNormalizedGrad, stdDev).tensor
  ).tensor;

  // Apply term2Factor to all elements (equivalent to broadcasting)
  const ones = createTensor({
    shape: input.shape,
    dtype: input.dtype,
    values: new Array(input.size).fill(1)
  });
  const term2 = ops.multiply(term2Factor, ones).tensor;

  // Term 3: sum(dL/dx_normalized * normalized) * (-normalized/M) * (1/variance)
  const sumNormalizedGradTimesNormalized = ops.sum(
    ops.multiply(normalizedGrad, normalized).tensor,
    axis,
    true
  ).tensor;

  const term3Factor = ops.multiply(
    ops.multiply(
      createTensor({ shape: [], dtype: input.dtype, values: [-1/M] }),
      normalized
    ).tensor,
    ops.divide(sumNormalizedGradTimesNormalized, variance).tensor
  ).tensor;

  // Combine terms to get input gradient
  const inputGrad = ops.add(
    ops.add(term1, term2).tensor,
    term3Factor
  ).tensor;

  // Return gradients
  if (gamma && gammaGrad) {
    return [inputGrad, gammaGrad, betaGrad];
  } else {
    return [inputGrad, betaGrad];
  }
});

/**
 * Gradient for instance normalization
 *
 * Computes gradients with respect to input, gamma, and beta.
 *
 * Instance normalization is similar to layer normalization but operates
 * on each channel independently. The gradient computation follows
 * a similar pattern but with appropriate axis handling.
 */
registerGradientFunction(TensorOpType.INSTANCE_NORM, (outputGrad, input, output, params) => {
  // Extract cache from params
  const cache = params.cache as InstanceNormCache;
  const { mean, variance, normalized, gamma, axis, epsilon } = cache;

  // Calculate gradients with respect to gamma and beta
  let gammaGrad: Tensor | null = null;

  if (gamma) {
    // dL/dgamma = sum(dL/dy * normalized)
    gammaGrad = ops.sum(ops.multiply(outputGrad, normalized).tensor, axis, false).tensor;
  }

  // dL/dbeta = sum(dL/dy)
  const betaGrad = ops.sum(outputGrad, axis, false).tensor;

  // Calculate gradient with respect to normalized input
  let normalizedGrad = outputGrad;
  if (gamma) {
    normalizedGrad = ops.multiply(outputGrad, gamma).tensor;
  }

  // Calculate gradient with respect to input
  // Get instance size (I) - number of elements being normalized per instance
  let I = 1;
  for (const ax of axis) {
    I *= input.shape[ax];
  }

  // Calculate standard deviation
  const stdDev = ops.sqrt(ops.add(variance, createTensor({
    shape: variance.shape,
    dtype: variance.dtype,
    values: new Array(variance.size).fill(epsilon)
  })).tensor).tensor;

  // Term 1: dL/dx_normalized * (1/stdDev)
  const term1 = ops.divide(normalizedGrad, stdDev).tensor;

  // Term 2: sum(dL/dx_normalized) * (-1/I) * (1/stdDev)
  const sumNormalizedGrad = ops.sum(normalizedGrad, axis, true).tensor;
  const term2Factor = ops.multiply(
    createTensor({ shape: [], dtype: input.dtype, values: [-1/I] }),
    ops.divide(sumNormalizedGrad, stdDev).tensor
  ).tensor;

  // Apply term2Factor to all elements (equivalent to broadcasting)
  const ones = createTensor({
    shape: input.shape,
    dtype: input.dtype,
    values: new Array(input.size).fill(1)
  });
  const term2 = ops.multiply(term2Factor, ones).tensor;

  // Term 3: sum(dL/dx_normalized * normalized) * (-normalized/I) * (1/variance)
  const sumNormalizedGradTimesNormalized = ops.sum(
    ops.multiply(normalizedGrad, normalized).tensor,
    axis,
    true
  ).tensor;

  const term3Factor = ops.multiply(
    ops.multiply(
      createTensor({ shape: [], dtype: input.dtype, values: [-1/I] }),
      normalized
    ).tensor,
    ops.divide(sumNormalizedGradTimesNormalized, variance).tensor
  ).tensor;

  // Combine terms to get input gradient
  const inputGrad = ops.add(
    ops.add(term1, term2).tensor,
    term3Factor
  ).tensor;

  // Return gradients
  if (gamma && gammaGrad) {
    return [inputGrad, gammaGrad, betaGrad];
  } else {
    return [inputGrad, betaGrad];
  }
});

/**
 * Gradient for group normalization
 *
 * Computes gradients with respect to input, gamma, and beta.
 *
 * Group normalization divides channels into groups and normalizes
 * within each group. The gradient computation is more complex due
 * to the reshaping operations.
 */
registerGradientFunction(TensorOpType.GROUP_NORM, (outputGrad, input, output, params) => {
  // Extract cache from params
  const cache = params.cache as GroupNormCache;
  const {
    mean,
    variance,
    normalized,
    gamma,
    axis,
    epsilon,
    groups,
    groupedShape
  } = cache;

  // Calculate gradients with respect to gamma and beta
  let gammaGrad: Tensor | null = null;

  if (gamma) {
    // dL/dgamma = sum(dL/dy * normalized)
    gammaGrad = ops.sum(ops.multiply(outputGrad, normalized).tensor, axis, false).tensor;
  }

  // dL/dbeta = sum(dL/dy)
  const betaGrad = ops.sum(outputGrad, axis, false).tensor;

  // Calculate gradient with respect to normalized input
  let normalizedGrad = outputGrad;
  if (gamma) {
    normalizedGrad = ops.multiply(outputGrad, gamma).tensor;
  }

  // Reshape normalizedGrad to match groupedShape
  // This is the inverse of the reshaping done in the forward pass
  const channelDim = input.shape.length - 1;
  const channelsPerGroup = input.shape[channelDim] / groups;

  // Reshape normalizedGrad to [batch, ..., groups, channels_per_group]
  const reshapedNormalizedGrad = createTensor({
    shape: groupedShape,
    dtype: normalizedGrad.dtype,
    values: normalizedGrad.toArray()
  });

  // Calculate gradient with respect to input in the grouped space
  // Get group size (G) - number of elements being normalized per group
  let G = 1;
  for (const ax of axis) {
    G *= groupedShape[ax];
  }
  G *= channelsPerGroup; // Include channels_per_group dimension

  // Calculate standard deviation
  const stdDev = ops.sqrt(ops.add(variance, createTensor({
    shape: variance.shape,
    dtype: variance.dtype,
    values: new Array(variance.size).fill(epsilon)
  })).tensor).tensor;

  // Get the reshaped input from the cache
  const reshapedInput = createTensor({
    shape: groupedShape,
    dtype: input.dtype,
    values: input.toArray()
  });

  // Calculate centered input in grouped space
  const centered = ops.subtract(reshapedInput, mean).tensor;

  // Normalize centered input
  const groupNormalized = ops.divide(centered, stdDev).tensor;

  // Calculate gradients in grouped space
  // Term 1: dL/dx_normalized * (1/stdDev)
  const term1 = ops.divide(reshapedNormalizedGrad, stdDev).tensor;

  // Group axis includes the channels_per_group dimension
  const groupAxis = [...axis, groupedShape.length - 1];

  // Term 2: sum(dL/dx_normalized) * (-1/G) * (1/stdDev)
  const sumNormalizedGrad = ops.sum(reshapedNormalizedGrad, groupAxis, true).tensor;
  const term2Factor = ops.multiply(
    createTensor({ shape: [], dtype: input.dtype, values: [-1/G] }),
    ops.divide(sumNormalizedGrad, stdDev).tensor
  ).tensor;

  // Apply term2Factor to all elements (equivalent to broadcasting)
  const ones = createTensor({
    shape: groupedShape,
    dtype: reshapedInput.dtype,
    values: new Array(reshapedInput.size).fill(1)
  });
  const term2 = ops.multiply(term2Factor, ones).tensor;

  // Term 3: sum(dL/dx_normalized * normalized) * (-normalized/G) * (1/variance)
  const sumNormalizedGradTimesNormalized = ops.sum(
    ops.multiply(reshapedNormalizedGrad, groupNormalized).tensor,
    groupAxis,
    true
  ).tensor;

  const term3Factor = ops.multiply(
    ops.multiply(
      createTensor({ shape: [], dtype: input.dtype, values: [-1/G] }),
      groupNormalized
    ).tensor,
    ops.divide(sumNormalizedGradTimesNormalized, variance).tensor
  ).tensor;

  // Combine terms to get input gradient in grouped space
  const groupedInputGrad = ops.add(
    ops.add(term1, term2).tensor,
    term3Factor
  ).tensor;

  // Reshape back to original input shape
  const inputGrad = createTensor({
    shape: input.shape,
    dtype: input.dtype,
    values: groupedInputGrad.toArray()
  });

  // Return gradients
  if (gamma && gammaGrad) {
    return [inputGrad, gammaGrad, betaGrad];
  } else {
    return [inputGrad, betaGrad];
  }
});

// Export the module to ensure it's included in the build
export const initNormalizationGradients = () => {
  // This function doesn't need to do anything, it's just to ensure
  // the module is not tree-shaken away during build
  return true;
};
