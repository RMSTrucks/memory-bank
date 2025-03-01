/**
 * Normalization Types
 *
 * This file defines types and interfaces for normalization operations in the Neural Computation Framework.
 * It includes parameters for batch normalization, layer normalization, instance normalization, and group normalization.
 */

import { Tensor } from './tensor';

/**
 * Parameters for batch normalization
 */
export interface BatchNormParams {
  /** Small constant added to variance for numerical stability */
  epsilon?: number;
  /** Momentum for the moving average */
  momentum?: number;
  /** Axes to normalize over */
  axis?: number[];
  /** Whether to center the normalized values */
  center?: boolean;
  /** Whether to scale the normalized values */
  scale?: boolean;
  /** Shift parameter (beta) */
  beta?: Tensor;
  /** Scale parameter (gamma) */
  gamma?: Tensor;
  /** Running mean for inference */
  movingMean?: Tensor;
  /** Running variance for inference */
  movingVariance?: Tensor;
  /** Whether in training mode */
  training?: boolean;
}

/**
 * Parameters for layer normalization
 */
export interface LayerNormParams {
  /** Small constant added to variance for numerical stability */
  epsilon?: number;
  /** Axes to normalize over */
  axis?: number[];
  /** Whether to center the normalized values */
  center?: boolean;
  /** Whether to scale the normalized values */
  scale?: boolean;
  /** Shift parameter (beta) */
  beta?: Tensor;
  /** Scale parameter (gamma) */
  gamma?: Tensor;
}

/**
 * Parameters for instance normalization
 */
export interface InstanceNormParams {
  /** Small constant added to variance for numerical stability */
  epsilon?: number;
  /** Axes to normalize over */
  axis?: number[];
  /** Whether to center the normalized values */
  center?: boolean;
  /** Whether to scale the normalized values */
  scale?: boolean;
  /** Shift parameter (beta) */
  beta?: Tensor;
  /** Scale parameter (gamma) */
  gamma?: Tensor;
}

/**
 * Parameters for group normalization
 */
export interface GroupNormParams {
  /** Small constant added to variance for numerical stability */
  epsilon?: number;
  /** Number of groups to divide the channels into */
  groups: number;
  /** Axes to normalize over */
  axis?: number[];
  /** Whether to center the normalized values */
  center?: boolean;
  /** Whether to scale the normalized values */
  scale?: boolean;
  /** Shift parameter (beta) */
  beta?: Tensor;
  /** Scale parameter (gamma) */
  gamma?: Tensor;
}

/**
 * Cache for batch normalization backward pass
 */
export interface BatchNormCache {
  input: Tensor;
  gamma?: Tensor;
  beta?: Tensor;
  mean: Tensor;
  variance: Tensor;
  normalized: Tensor;
  axis: number[];
  epsilon: number;
}

/**
 * Cache for layer normalization backward pass
 */
export interface LayerNormCache {
  input: Tensor;
  gamma?: Tensor;
  beta?: Tensor;
  mean: Tensor;
  variance: Tensor;
  normalized: Tensor;
  axis: number[];
  epsilon: number;
}

/**
 * Cache for instance normalization backward pass
 */
export interface InstanceNormCache {
  input: Tensor;
  gamma?: Tensor;
  beta?: Tensor;
  mean: Tensor;
  variance: Tensor;
  normalized: Tensor;
  axis: number[];
  epsilon: number;
}

/**
 * Cache for group normalization backward pass
 */
export interface GroupNormCache {
  input: Tensor;
  gamma?: Tensor;
  beta?: Tensor;
  mean: Tensor;
  variance: Tensor;
  normalized: Tensor;
  groups: number;
  axis: number[];
  epsilon: number;
  groupedShape: number[];
}

/**
 * Calculate axes for normalization
 * @param inputShape Shape of the input tensor
 * @param axis Axes to normalize over
 * @param defaultAxis Default axes if not specified
 */
export function calculateNormalizationAxes(
  inputShape: number[],
  axis?: number[],
  defaultAxis?: number[]
): number[] {
  if (axis) {
    // Convert negative axes to positive
    return axis.map(a => a < 0 ? inputShape.length + a : a);
  }

  if (defaultAxis) {
    return defaultAxis;
  }

  // Default: normalize over all except the first dimension (batch)
  return Array.from({ length: inputShape.length - 1 }, (_, i) => i + 1);
}

/**
 * Calculate default axes for different normalization types
 * @param inputShape Shape of the input tensor
 * @param normType Type of normalization
 */
export function getDefaultAxes(
  inputShape: number[],
  normType: 'batch' | 'layer' | 'instance' | 'group'
): number[] {
  switch (normType) {
    case 'batch':
      // Normalize over all except batch and channel dimensions
      return inputShape.length === 4
        ? [1, 2] // [batch, height, width, channels]
        : Array.from({ length: inputShape.length - 2 }, (_, i) => i + 1);

    case 'layer':
      // Normalize over all except batch dimension
      return Array.from({ length: inputShape.length - 1 }, (_, i) => i + 1);

    case 'instance':
      // Normalize over spatial dimensions
      return inputShape.length === 4
        ? [1, 2] // [batch, height, width, channels]
        : Array.from({ length: inputShape.length - 2 }, (_, i) => i + 1);

    case 'group':
      // Normalize over spatial dimensions
      return inputShape.length === 4
        ? [1, 2] // [batch, height, width, channels]
        : Array.from({ length: inputShape.length - 2 }, (_, i) => i + 1);

    default:
      throw new Error(`Unknown normalization type: ${normType}`);
  }
}
