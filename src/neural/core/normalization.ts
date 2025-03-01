/**
 * Normalization Operations
 *
 * This file implements normalization operations for the Neural Computation Framework.
 * It provides batch normalization, layer normalization, instance normalization, and group normalization.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DataType,
  Shape,
  Tensor,
  TensorOpType,
  TensorOpResult,
  TensorOpPerformance
} from '../types/tensor';
import {
  BatchNormParams,
  LayerNormParams,
  InstanceNormParams,
  GroupNormParams,
  BatchNormCache,
  LayerNormCache,
  InstanceNormCache,
  GroupNormCache,
  calculateNormalizationAxes,
  getDefaultAxes
} from '../types/normalization';
import { createTensor, zeros, ones, trackPerformance } from './tensor';
import * as ops from './operations';

/**
 * Batch Normalization
 *
 * Normalizes the activations of the previous layer at each batch.
 *
 * @param input Input tensor
 * @param params Batch normalization parameters
 */
export function batchNorm(
  input: Tensor,
  params: BatchNormParams = {}
): TensorOpResult {
  const start = globalThis.performance.now();

  // Extract parameters with defaults
  const epsilon = params.epsilon ?? 1e-5;
  const momentum = params.momentum ?? 0.9;
  const axis = calculateNormalizationAxes(input.shape, params.axis, getDefaultAxes(input.shape, 'batch'));
  const center = params.center ?? true;
  const scale = params.scale ?? true;
  const training = params.training ?? true;

  // Initialize gamma and beta if not provided
  const gamma = params.gamma ?? (scale ? ones(getParamShape(input.shape, axis)) : undefined);
  const beta = params.beta ?? (center ? zeros(getParamShape(input.shape, axis)) : undefined);

  // Initialize moving statistics if not provided
  const movingMean = params.movingMean ?? zeros(getParamShape(input.shape, axis));
  const movingVariance = params.movingVariance ?? ones(getParamShape(input.shape, axis));

  // Compute mean and variance
  let mean: Tensor;
  let variance: Tensor;

  if (training) {
    // In training mode, compute mean and variance from the current batch
    mean = ops.mean(input, axis, true).tensor;

    // Compute variance: mean((x - mean)^2)
    const centered = ops.subtract(input, mean).tensor;
    const squared = ops.multiply(centered, centered).tensor;
    variance = ops.mean(squared, axis, true).tensor;

    // Update moving statistics
    if (params.movingMean && params.movingVariance) {
      // movingMean = momentum * movingMean + (1 - momentum) * mean
      const momentumTensor = createTensor({
        shape: [],
        dtype: input.dtype,
        values: [momentum]
      });

      const oneMinusMomentum = createTensor({
        shape: [],
        dtype: input.dtype,
        values: [1 - momentum]
      });

      const newMovingMean = ops.add(
        ops.multiply(momentumTensor, params.movingMean).tensor,
        ops.multiply(oneMinusMomentum, mean).tensor
      ).tensor;

      // movingVariance = momentum * movingVariance + (1 - momentum) * variance
      const newMovingVariance = ops.add(
        ops.multiply(momentumTensor, params.movingVariance).tensor,
        ops.multiply(oneMinusMomentum, variance).tensor
      ).tensor;

      // Update the moving statistics
      params.movingMean.set(newMovingMean.toArray());
      params.movingVariance.set(newMovingVariance.toArray());
    }
  } else {
    // In inference mode, use the moving statistics
    mean = movingMean;
    variance = movingVariance;
  }

  // Normalize: (x - mean) / sqrt(variance + epsilon)
  const centered = ops.subtract(input, mean).tensor;

  const variancePlusEpsilon = ops.add(
    variance,
    createTensor({
      shape: variance.shape,
      dtype: variance.dtype,
      values: new Array(variance.size).fill(epsilon)
    })
  ).tensor;

  const stdDev = ops.sqrt(variancePlusEpsilon).tensor;
  const normalized = ops.divide(centered, stdDev).tensor;

  // Scale and shift: gamma * normalized + beta
  let output = normalized;

  if (scale && gamma) {
    output = ops.multiply(output, gamma).tensor;
  }

  if (center && beta) {
    output = ops.add(output, beta).tensor;
  }

  // Create cache for backward pass
  const cache: BatchNormCache = {
    input,
    gamma,
    beta,
    mean,
    variance,
    normalized,
    axis,
    epsilon
  };

  // Track performance
  return trackPerformance(
    start,
    TensorOpType.BATCH_NORM,
    output,
    { input, gamma, beta },
    { ...params, cache }
  );
}

/**
 * Layer Normalization
 *
 * Normalizes the activations of the previous layer for each given example in a batch independently.
 *
 * @param input Input tensor
 * @param params Layer normalization parameters
 */
export function layerNorm(
  input: Tensor,
  params: LayerNormParams = {}
): TensorOpResult {
  const start = globalThis.performance.now();

  // Extract parameters with defaults
  const epsilon = params.epsilon ?? 1e-5;
  const axis = calculateNormalizationAxes(input.shape, params.axis, getDefaultAxes(input.shape, 'layer'));
  const center = params.center ?? true;
  const scale = params.scale ?? true;

  // Initialize gamma and beta if not provided
  const gamma = params.gamma ?? (scale ? ones(getParamShape(input.shape, axis)) : undefined);
  const beta = params.beta ?? (center ? zeros(getParamShape(input.shape, axis)) : undefined);

  // Compute mean and variance
  const mean = ops.mean(input, axis, true).tensor;

  // Compute variance: mean((x - mean)^2)
  const centered = ops.subtract(input, mean).tensor;
  const squared = ops.multiply(centered, centered).tensor;
  const variance = ops.mean(squared, axis, true).tensor;

  // Normalize: (x - mean) / sqrt(variance + epsilon)
  const variancePlusEpsilon = ops.add(
    variance,
    createTensor({
      shape: variance.shape,
      dtype: variance.dtype,
      values: new Array(variance.size).fill(epsilon)
    })
  ).tensor;

  const stdDev = ops.sqrt(variancePlusEpsilon).tensor;
  const normalized = ops.divide(centered, stdDev).tensor;

  // Scale and shift: gamma * normalized + beta
  let output = normalized;

  if (scale && gamma) {
    output = ops.multiply(output, gamma).tensor;
  }

  if (center && beta) {
    output = ops.add(output, beta).tensor;
  }

  // Create cache for backward pass
  const cache: LayerNormCache = {
    input,
    gamma,
    beta,
    mean,
    variance,
    normalized,
    axis,
    epsilon
  };

  // Track performance
  return trackPerformance(
    start,
    TensorOpType.LAYER_NORM,
    output,
    { input, gamma, beta },
    { ...params, cache }
  );
}

/**
 * Instance Normalization
 *
 * Normalizes the activations of the previous layer for each channel in each example in a batch independently.
 *
 * @param input Input tensor
 * @param params Instance normalization parameters
 */
export function instanceNorm(
  input: Tensor,
  params: InstanceNormParams = {}
): TensorOpResult {
  const start = globalThis.performance.now();

  // Extract parameters with defaults
  const epsilon = params.epsilon ?? 1e-5;
  const axis = calculateNormalizationAxes(input.shape, params.axis, getDefaultAxes(input.shape, 'instance'));
  const center = params.center ?? true;
  const scale = params.scale ?? true;

  // Initialize gamma and beta if not provided
  const gamma = params.gamma ?? (scale ? ones(getParamShape(input.shape, axis)) : undefined);
  const beta = params.beta ?? (center ? zeros(getParamShape(input.shape, axis)) : undefined);

  // Compute mean and variance for each instance
  const mean = ops.mean(input, axis, true).tensor;

  // Compute variance: mean((x - mean)^2)
  const centered = ops.subtract(input, mean).tensor;
  const squared = ops.multiply(centered, centered).tensor;
  const variance = ops.mean(squared, axis, true).tensor;

  // Normalize: (x - mean) / sqrt(variance + epsilon)
  const variancePlusEpsilon = ops.add(
    variance,
    createTensor({
      shape: variance.shape,
      dtype: variance.dtype,
      values: new Array(variance.size).fill(epsilon)
    })
  ).tensor;

  const stdDev = ops.sqrt(variancePlusEpsilon).tensor;
  const normalized = ops.divide(centered, stdDev).tensor;

  // Scale and shift: gamma * normalized + beta
  let output = normalized;

  if (scale && gamma) {
    output = ops.multiply(output, gamma).tensor;
  }

  if (center && beta) {
    output = ops.add(output, beta).tensor;
  }

  // Create cache for backward pass
  const cache: InstanceNormCache = {
    input,
    gamma,
    beta,
    mean,
    variance,
    normalized,
    axis,
    epsilon
  };

  // Track performance
  return trackPerformance(
    start,
    TensorOpType.INSTANCE_NORM,
    output,
    { input, gamma, beta },
    { ...params, cache }
  );
}

/**
 * Group Normalization
 *
 * Divides the channels into groups and normalizes the activations independently within each group.
 *
 * @param input Input tensor
 * @param params Group normalization parameters
 */
export function groupNorm(
  input: Tensor,
  params: GroupNormParams
): TensorOpResult {
  const start = globalThis.performance.now();

  // Extract parameters with defaults
  const epsilon = params.epsilon ?? 1e-5;
  const groups = params.groups;
  const axis = calculateNormalizationAxes(input.shape, params.axis, getDefaultAxes(input.shape, 'group'));
  const center = params.center ?? true;
  const scale = params.scale ?? true;

  // Initialize gamma and beta if not provided
  const gamma = params.gamma ?? (scale ? ones(getParamShape(input.shape, axis)) : undefined);
  const beta = params.beta ?? (center ? zeros(getParamShape(input.shape, axis)) : undefined);

  // Validate groups
  if (input.shape.length < 2) {
    throw new Error('Input tensor must have at least 2 dimensions for group normalization');
  }

  // Assume the last dimension is the channel dimension
  const channelDim = input.shape.length - 1;
  const numChannels = input.shape[channelDim];

  if (numChannels % groups !== 0) {
    throw new Error(`Number of channels (${numChannels}) must be divisible by number of groups (${groups})`);
  }

  const channelsPerGroup = numChannels / groups;

  // Reshape input to separate groups
  const groupedShape = [...input.shape];
  groupedShape[channelDim] = groups;
  groupedShape.push(channelsPerGroup);

  // Reshape input to [batch, ..., groups, channels_per_group]
  const reshapedInput = createTensor({
    shape: groupedShape,
    dtype: input.dtype,
    values: input.toArray()
  });

  // Compute mean and variance for each group
  const groupAxis = [...axis, groupedShape.length - 1]; // Add the channels_per_group dimension
  const mean = ops.mean(reshapedInput, groupAxis, true).tensor;

  // Compute variance: mean((x - mean)^2)
  const centered = ops.subtract(reshapedInput, mean).tensor;
  const squared = ops.multiply(centered, centered).tensor;
  const variance = ops.mean(squared, groupAxis, true).tensor;

  // Normalize: (x - mean) / sqrt(variance + epsilon)
  const variancePlusEpsilon = ops.add(
    variance,
    createTensor({
      shape: variance.shape,
      dtype: variance.dtype,
      values: new Array(variance.size).fill(epsilon)
    })
  ).tensor;

  const stdDev = ops.sqrt(variancePlusEpsilon).tensor;
  const normalized = ops.divide(centered, stdDev).tensor;

  // Reshape back to original shape
  const reshapedOutput = createTensor({
    shape: input.shape,
    dtype: input.dtype,
    values: normalized.toArray()
  });

  // Scale and shift: gamma * normalized + beta
  let output = reshapedOutput;

  if (scale && gamma) {
    output = ops.multiply(output, gamma).tensor;
  }

  if (center && beta) {
    output = ops.add(output, beta).tensor;
  }

  // Create cache for backward pass
  const cache: GroupNormCache = {
    input,
    gamma,
    beta,
    mean,
    variance,
    normalized: reshapedOutput,
    groups,
    axis,
    epsilon,
    groupedShape
  };

  // Track performance
  return trackPerformance(
    start,
    TensorOpType.GROUP_NORM,
    output,
    { input, gamma, beta },
    { ...params, cache }
  );
}

/**
 * Get the shape of the parameters (gamma and beta) for normalization
 * @param inputShape Shape of the input tensor
 * @param axis Axes to normalize over
 */
function getParamShape(inputShape: number[], axis: number[]): number[] {
  const paramShape = Array(inputShape.length).fill(1);

  for (let i = 0; i < inputShape.length; i++) {
    if (!axis.includes(i)) {
      paramShape[i] = inputShape[i];
    }
  }

  return paramShape;
}
