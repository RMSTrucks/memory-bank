/**
 * Gradient Functions for Automatic Differentiation
 *
 * This file provides gradient functions for various tensor operations.
 * These functions are used by the automatic differentiation system to
 * compute gradients during backpropagation.
 */

import { Tensor, TensorOpType } from '../types/tensor';
import { createTensor, zeros, ones } from './tensor';
import * as ops from './operations';

/**
 * Type for gradient functions
 * Takes gradient of output and input tensors, returns gradient of inputs
 * Also allows for additional parameters like axes, keepDims, etc.
 */
export type GradientFunction = (
  outputGrad: Tensor,
  ...args: any[]
) => Tensor | Tensor[];

/**
 * Map of operation types to gradient functions
 */
const gradientFunctions = new Map<TensorOpType, GradientFunction>();

/**
 * Get gradient function for an operation type
 * @param opType Operation type
 */
export function getGradientFunction(opType: TensorOpType): GradientFunction | undefined {
  return gradientFunctions.get(opType);
}

/**
 * Register a gradient function for an operation type
 * @param opType Operation type
 * @param gradFn Gradient function
 */
export function registerGradientFunction(opType: TensorOpType, gradFn: GradientFunction): void {
  gradientFunctions.set(opType, gradFn);
}

// Gradient for addition: dx = dy, dy = dx
registerGradientFunction(TensorOpType.ADD, (outputGrad, x, y) => {
  // For broadcasting, we need to sum along broadcasted dimensions
  const gradX = outputGrad.shape.length < x.shape.length
    ? ops.sum(outputGrad, Array.from({ length: x.shape.length - outputGrad.shape.length }, (_, i) => i)).tensor
    : outputGrad;

  const gradY = outputGrad.shape.length < y.shape.length
    ? ops.sum(outputGrad, Array.from({ length: y.shape.length - outputGrad.shape.length }, (_, i) => i)).tensor
    : outputGrad;

  return [gradX, gradY];
});

// Gradient for subtraction: dx = dy, dy = -dx
registerGradientFunction(TensorOpType.SUBTRACT, (outputGrad, x, y) => {
  // For broadcasting, we need to sum along broadcasted dimensions
  const gradX = outputGrad.shape.length < x.shape.length
    ? ops.sum(outputGrad, Array.from({ length: x.shape.length - outputGrad.shape.length }, (_, i) => i)).tensor
    : outputGrad;

  const negGrad = ops.multiply(outputGrad, createTensor({
    shape: [],
    dtype: outputGrad.dtype,
    values: [-1]
  })).tensor;

  const gradY = negGrad.shape.length < y.shape.length
    ? ops.sum(negGrad, Array.from({ length: y.shape.length - negGrad.shape.length }, (_, i) => i)).tensor
    : negGrad;

  return [gradX, gradY];
});

// Gradient for multiplication: dx = dy * y, dy = dx * x
registerGradientFunction(TensorOpType.MULTIPLY, (outputGrad, x, y) => {
  const gradX = ops.multiply(outputGrad, y).tensor;
  const gradY = ops.multiply(outputGrad, x).tensor;
  return [gradX, gradY];
});

// Gradient for division: dx = dy / y, dy = -dx * x / (y^2)
registerGradientFunction(TensorOpType.DIVIDE, (outputGrad, x, y) => {
  const gradX = ops.divide(outputGrad, y).tensor;

  const ySquared = ops.multiply(y, y).tensor;
  const xOverYSquared = ops.divide(x, ySquared).tensor;
  const negGrad = ops.multiply(outputGrad, createTensor({
    shape: [],
    dtype: outputGrad.dtype,
    values: [-1]
  })).tensor;

  const gradY = ops.multiply(negGrad, xOverYSquared).tensor;

  return [gradX, gradY];
});

// Gradient for matrix multiplication: dx = dy @ y.T, dy = x.T @ dx
registerGradientFunction(TensorOpType.MATMUL, (outputGrad, x, y) => {
  const yTransposed = ops.transpose(y).tensor;
  const gradX = ops.matmul(outputGrad, yTransposed).tensor;

  const xTransposed = ops.transpose(x).tensor;
  const gradY = ops.matmul(xTransposed, outputGrad).tensor;

  return [gradX, gradY];
});

// Gradient for transpose: dx = dy.T
registerGradientFunction(TensorOpType.TRANSPOSE, (outputGrad, x) => {
  return ops.transpose(outputGrad).tensor;
});

// Gradient for exponential: dx = dy * exp(x)
registerGradientFunction(TensorOpType.EXP, (outputGrad, x, output) => {
  return ops.multiply(outputGrad, output).tensor;
});

// Gradient for logarithm: dx = dy / x
registerGradientFunction(TensorOpType.LOG, (outputGrad, x) => {
  return ops.divide(outputGrad, x).tensor;
});

// Gradient for sigmoid: dx = dy * sigmoid(x) * (1 - sigmoid(x))
registerGradientFunction(TensorOpType.SIGMOID, (outputGrad, x, output) => {
  const oneMinusOutput = ops.subtract(
    createTensor({
      shape: output.shape,
      dtype: output.dtype,
      values: new Array(output.size).fill(1)
    }),
    output
  ).tensor;

  const sigmoidGrad = ops.multiply(output, oneMinusOutput).tensor;
  return ops.multiply(outputGrad, sigmoidGrad).tensor;
});

// Gradient for tanh: dx = dy * (1 - tanh(x)^2)
registerGradientFunction(TensorOpType.TANH, (outputGrad, x, output) => {
  const outputSquared = ops.multiply(output, output).tensor;

  const oneMinusOutputSquared = ops.subtract(
    createTensor({
      shape: output.shape,
      dtype: output.dtype,
      values: new Array(output.size).fill(1)
    }),
    outputSquared
  ).tensor;

  return ops.multiply(outputGrad, oneMinusOutputSquared).tensor;
});

// Gradient for ReLU: dx = dy if x > 0 else 0
registerGradientFunction(TensorOpType.RELU, (outputGrad, x) => {
  const mask = createTensor({
    shape: x.shape,
    dtype: x.dtype,
    values: Array.from({ length: x.size }, (_, i) => {
      const indices = [];
      let remaining = i;
      for (let j = 0; j < x.shape.length; j++) {
        indices.push(Math.floor(remaining / x.strides[j]));
        remaining %= x.strides[j];
      }
      return x.get(...indices) > 0 ? 1 : 0;
    })
  });

  return ops.multiply(outputGrad, mask).tensor;
});

// Gradient for LeakyReLU: dx = dy if x > 0 else dy * alpha
registerGradientFunction(TensorOpType.LEAKY_RELU, (outputGrad, x, alpha = 0.01) => {
  const mask = createTensor({
    shape: x.shape,
    dtype: x.dtype,
    values: Array.from({ length: x.size }, (_, i) => {
      const indices = [];
      let remaining = i;
      for (let j = 0; j < x.shape.length; j++) {
        indices.push(Math.floor(remaining / x.strides[j]));
        remaining %= x.strides[j];
      }
      return x.get(...indices) > 0 ? 1 : alpha;
    })
  });

  return ops.multiply(outputGrad, mask).tensor;
});

// Gradient for ELU: dx = dy if x > 0 else dy * alpha * exp(x)
registerGradientFunction(TensorOpType.ELU, (outputGrad, x, alpha = 1.0) => {
  const mask = createTensor({
    shape: x.shape,
    dtype: x.dtype,
    values: Array.from({ length: x.size }, (_, i) => {
      const indices = [];
      let remaining = i;
      for (let j = 0; j < x.shape.length; j++) {
        indices.push(Math.floor(remaining / x.strides[j]));
        remaining %= x.strides[j];
      }
      const value = x.get(...indices);
      return value > 0 ? 1 : alpha * Math.exp(value);
    })
  });

  return ops.multiply(outputGrad, mask).tensor;
});

// Gradient for GELU: dx = dy * 0.5 * (1 + tanh(sqrt(2/π) * (x + 0.044715 * x^3)) +
//                        x * sech^2(sqrt(2/π) * (x + 0.044715 * x^3)) * sqrt(2/π) * (1 + 0.134145 * x^2))
registerGradientFunction(TensorOpType.GELU, (outputGrad, x, approximate = false) => {
  const mask = createTensor({
    shape: x.shape,
    dtype: x.dtype,
    values: Array.from({ length: x.size }, (_, i) => {
      const indices = [];
      let remaining = i;
      for (let j = 0; j < x.shape.length; j++) {
        indices.push(Math.floor(remaining / x.strides[j]));
        remaining %= x.strides[j];
      }
      const value = x.get(...indices);

      if (approximate) {
        // Approximate GELU gradient
        const x2 = value * value;
        const x3 = x2 * value;
        const sqrt2OverPi = Math.sqrt(2 / Math.PI);
        const inner = sqrt2OverPi * (value + 0.044715 * x3);
        const tanh_inner = Math.tanh(inner);

        // sech^2(x) = 1 - tanh^2(x)
        const sech_squared = 1 - tanh_inner * tanh_inner;

        return 0.5 * (1 + tanh_inner + value * sech_squared * sqrt2OverPi * (1 + 0.134145 * x2));
      } else {
        // Exact GELU gradient
        const xOverSqrt2 = value / Math.sqrt(2);
        const erf_val = erf(xOverSqrt2);
        const exp_val = Math.exp(-0.5 * value * value);

        return 0.5 * (1 + erf_val) + value * exp_val / Math.sqrt(2 * Math.PI);
      }
    })
  });

  return ops.multiply(outputGrad, mask).tensor;
});

// Gradient for Swish/SiLU: dx = dy * (sigmoid(beta * x) + x * beta * sigmoid(beta * x) * (1 - sigmoid(beta * x)))
registerGradientFunction(TensorOpType.SWISH, (outputGrad, x, beta = 1.0) => {
  const mask = createTensor({
    shape: x.shape,
    dtype: x.dtype,
    values: Array.from({ length: x.size }, (_, i) => {
      const indices = [];
      let remaining = i;
      for (let j = 0; j < x.shape.length; j++) {
        indices.push(Math.floor(remaining / x.strides[j]));
        remaining %= x.strides[j];
      }
      const value = x.get(...indices);

      // Calculate sigmoid(beta * x)
      const betaX = beta * value;
      const sigmoid_val = 1 / (1 + Math.exp(-betaX));

      // Swish gradient: sigmoid(beta * x) + x * beta * sigmoid(beta * x) * (1 - sigmoid(beta * x))
      return sigmoid_val + value * beta * sigmoid_val * (1 - sigmoid_val);
    })
  });

  return ops.multiply(outputGrad, mask).tensor;
});

/**
 * Error function (erf) implementation
 * Used for GELU gradient calculation
 * @param x Input value
 */
function erf(x: number): number {
  // Constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Gradient for softmax: complex, depends on implementation
registerGradientFunction(TensorOpType.SOFTMAX, (outputGrad, x, output, axis?: number) => {
  // Simplified version: assumes outputGrad is already multiplied by downstream gradient
  // In reality, this is more complex and depends on the loss function

  // Sum of output gradients
  const sumGrad = ops.sum(outputGrad, axis !== undefined ? [axis] : undefined, true).tensor;

  // Multiply by output
  const outputGradTimesOutput = ops.multiply(outputGrad, output).tensor;

  // Subtract weighted sum
  const weightedSum = ops.multiply(sumGrad, output).tensor;
  const grad = ops.subtract(outputGradTimesOutput, weightedSum).tensor;

  return grad;
});

// Import convolution operations and types
import {
  PaddingType,
  DataFormat,
  Conv2DParams,
  MaxPool2DParams,
  AvgPool2DParams,
  calculateConv2DOutputShape,
  calculatePoolingOutputShape,
  calculatePadding,
  im2col,
  col2im
} from '../types/convolution';
import * as convOps from './convolution';

// Gradient for 2D convolution
registerGradientFunction(TensorOpType.CONV2D, (outputGrad, input, filters, output, params?: any) => {
  // Extract parameters
  const {
    strides = [1, 1],
    padding = 'valid',
    dataFormat = 'NHWC',
    dilationRate = [1, 1],
    useBias = false,
    groups = 1
  } = params || {};

  // Extract dimensions
  const inputShape = input.shape;
  const filterShape = filters.shape;
  const outputGradShape = outputGrad.shape;

  // Extract dimensions based on data format
  let inputBatch: number, inputHeight: number, inputWidth: number, inputChannels: number;
  let outputHeight: number, outputWidth: number, outputChannels: number;

  if (dataFormat === 'NHWC') {
    [inputBatch, inputHeight, inputWidth, inputChannels] = inputShape;
    [, outputHeight, outputWidth, outputChannels] = outputGradShape;
  } else { // 'NCHW'
    [inputBatch, inputChannels, inputHeight, inputWidth] = inputShape;
    [, outputChannels, outputHeight, outputWidth] = outputGradShape;
  }

  const [filterHeight, filterWidth, filterInputChannels, filterOutputChannels] = filterShape;

  // Calculate padding values
  const [paddingTop, paddingBottom] = calculatePadding(
    inputHeight,
    filterHeight,
    strides[0],
    padding,
    dilationRate[0]
  );

  const [paddingLeft, paddingRight] = calculatePadding(
    inputWidth,
    filterWidth,
    strides[1],
    padding,
    dilationRate[1]
  );

  // Gradient with respect to input
  // For input gradient, we need to perform a transposed convolution (deconvolution)
  // We can implement this by:
  // 1. Padding the output gradient
  // 2. Flipping the filters
  // 3. Performing a convolution with different strides

  // Flip filters for transposed convolution
  const flippedFiltersData = filters.toArray();
  const flippedFilters = createTensor({
    shape: [filterHeight, filterWidth, outputChannels, inputChannels],
    dtype: filters.dtype,
    values: flippedFiltersData.slice().reverse()
  });

  // Compute input gradient using transposed convolution
  const inputGrad = convOps.conv2d(
    outputGrad,
    flippedFilters,
    strides,
    padding === 'valid' ? 'full' : (padding === 'full' ? 'valid' : padding),
    dataFormat,
    dilationRate,
    false,
    undefined,
    groups
  ).tensor;

  // Gradient with respect to filters
  // For filter gradient, we need to convolve the input with the output gradient
  // We can implement this by:
  // 1. Reshaping input and output gradient
  // 2. Performing a correlation operation

  // Reshape input and output gradient for filter gradient computation
  const inputReshaped = createTensor({
    shape: [inputBatch * inputHeight * inputWidth, inputChannels],
    dtype: input.dtype,
    values: input.toArray()
  });

  // Get output batch size from outputGrad shape
  const outputBatch = dataFormat === 'NHWC' ? outputGradShape[0] : outputGradShape[0];

  const outputGradReshaped = createTensor({
    shape: [outputBatch * outputHeight * outputWidth, outputChannels],
    dtype: outputGrad.dtype,
    values: outputGrad.toArray()
  });

  // Compute filter gradient using correlation
  const filterGrad = ops.matmul(
    ops.transpose(inputReshaped).tensor,
    outputGradReshaped
  ).tensor;

  // Reshape filter gradient to match filter shape
  const filterGradReshaped = createTensor({
    shape: filterShape,
    dtype: filters.dtype,
    values: filterGrad.toArray()
  });

  // Gradient with respect to bias (if used)
  let biasGrad: Tensor | undefined;
  if (useBias && params.bias) {
    // Sum output gradient along batch, height, and width dimensions
    const sumAxes = dataFormat === 'NHWC' ? [0, 1, 2] : [0, 2, 3];
    biasGrad = ops.sum(outputGrad, sumAxes).tensor;
  }

  // Return gradients
  if (useBias && biasGrad) {
    return [inputGrad, filterGradReshaped, biasGrad];
  } else {
    return [inputGrad, filterGradReshaped];
  }
});

// Gradient for 2D max pooling
registerGradientFunction(TensorOpType.MAX_POOL2D, (outputGrad, input, output, params?: any) => {
  // Extract parameters
  const {
    poolSize = [2, 2],
    strides = [2, 2],
    padding = 'valid',
    dataFormat = 'NHWC'
  } = params || {};

  // Extract dimensions
  const inputShape = input.shape;
  const outputShape = output.shape;

  // Extract dimensions based on data format
  let inputBatch: number, inputHeight: number, inputWidth: number, inputChannels: number;
  let outputHeight: number, outputWidth: number;

  if (dataFormat === 'NHWC') {
    [inputBatch, inputHeight, inputWidth, inputChannels] = inputShape;
    [, outputHeight, outputWidth] = outputShape;
  } else { // 'NCHW'
    [inputBatch, inputChannels, inputHeight, inputWidth] = inputShape;
    [, , outputHeight, outputWidth] = outputShape;
  }

  // Calculate padding values
  const [paddingTop, paddingBottom] = calculatePadding(
    inputHeight,
    poolSize[0],
    strides[0],
    padding
  );

  const [paddingLeft, paddingRight] = calculatePadding(
    inputWidth,
    poolSize[1],
    strides[1],
    padding
  );

  // Initialize input gradient with zeros
  const inputGrad = zeros(inputShape);

  // Convert input, output, and outputGrad to arrays for easier manipulation
  const inputData = input.toArray();
  const outputData = output.toArray();
  const outputGradData = outputGrad.toArray();

  // For max pooling gradient, we need to propagate the gradient only to the
  // elements that were selected as the maximum during the forward pass
  for (let b = 0; b < inputBatch; b++) {
    for (let h = 0; h < outputHeight; h++) {
      for (let w = 0; w < outputWidth; w++) {
        for (let c = 0; c < inputChannels; c++) {
          // Calculate input region for this output pixel
          const hStart = h * strides[0] - paddingTop;
          const wStart = w * strides[1] - paddingLeft;
          const hEnd = Math.min(hStart + poolSize[0], inputHeight);
          const wEnd = Math.min(wStart + poolSize[1], inputWidth);
          const hStartClamped = Math.max(0, hStart);
          const wStartClamped = Math.max(0, wStart);

          // Get output value and gradient
          let outputVal, outputGradVal;
          if (dataFormat === 'NHWC') {
            outputVal = outputData[b * outputHeight * outputWidth * inputChannels +
                                  h * outputWidth * inputChannels +
                                  w * inputChannels +
                                  c];
            outputGradVal = outputGradData[b * outputHeight * outputWidth * inputChannels +
                                          h * outputWidth * inputChannels +
                                          w * inputChannels +
                                          c];
          } else { // 'NCHW'
            outputVal = outputData[b * inputChannels * outputHeight * outputWidth +
                                  c * outputHeight * outputWidth +
                                  h * outputWidth +
                                  w];
            outputGradVal = outputGradData[b * inputChannels * outputHeight * outputWidth +
                                          c * outputHeight * outputWidth +
                                          h * outputWidth +
                                          w];
          }

          // Find the position of the maximum value in the input region
          let maxPos: [number, number] | null = null;
          let maxVal = -Infinity;

          for (let ih = hStartClamped; ih < hEnd; ih++) {
            for (let iw = wStartClamped; iw < wEnd; iw++) {
              let inputVal;
              if (dataFormat === 'NHWC') {
                inputVal = inputData[b * inputHeight * inputWidth * inputChannels +
                                    ih * inputWidth * inputChannels +
                                    iw * inputChannels +
                                    c];
              } else { // 'NCHW'
                inputVal = inputData[b * inputChannels * inputHeight * inputWidth +
                                    c * inputHeight * inputWidth +
                                    ih * inputWidth +
                                    iw];
              }

              if (inputVal > maxVal) {
                maxVal = inputVal;
                maxPos = [ih, iw];
              }
            }
          }

          // Propagate gradient to the maximum position
          if (maxPos) {
            const [maxH, maxW] = maxPos;
            let inputGradIndex;
            if (dataFormat === 'NHWC') {
              inputGradIndex = b * inputHeight * inputWidth * inputChannels +
                              maxH * inputWidth * inputChannels +
                              maxW * inputChannels +
                              c;
            } else { // 'NCHW'
              inputGradIndex = b * inputChannels * inputHeight * inputWidth +
                              c * inputHeight * inputWidth +
                              maxH * inputWidth +
                              maxW;
            }

            // Add gradient to the maximum position
            const inputGradData = inputGrad.toArray();
            inputGradData[inputGradIndex] += outputGradVal;

            // Update input gradient
            inputGrad.set(inputGradData[inputGradIndex], ...maxPos, c);
          }
        }
      }
    }
  }

  return inputGrad;
});

// Gradient for 2D average pooling
registerGradientFunction(TensorOpType.AVG_POOL2D, (outputGrad, input, output, params?: any) => {
  // Extract parameters
  const {
    poolSize = [2, 2],
    strides = [2, 2],
    padding = 'valid',
    dataFormat = 'NHWC'
  } = params || {};

  // Extract dimensions
  const inputShape = input.shape;
  const outputShape = output.shape;

  // Extract dimensions based on data format
  let inputBatch: number, inputHeight: number, inputWidth: number, inputChannels: number;
  let outputHeight: number, outputWidth: number;

  if (dataFormat === 'NHWC') {
    [inputBatch, inputHeight, inputWidth, inputChannels] = inputShape;
    [, outputHeight, outputWidth] = outputShape;
  } else { // 'NCHW'
    [inputBatch, inputChannels, inputHeight, inputWidth] = inputShape;
    [, , outputHeight, outputWidth] = outputShape;
  }

  // Calculate padding values
  const [paddingTop, paddingBottom] = calculatePadding(
    inputHeight,
    poolSize[0],
    strides[0],
    padding
  );

  const [paddingLeft, paddingRight] = calculatePadding(
    inputWidth,
    poolSize[1],
    strides[1],
    padding
  );

  // Initialize input gradient with zeros
  const inputGrad = zeros(inputShape);
  const inputGradData = inputGrad.toArray();
  const outputGradData = outputGrad.toArray();

  // For average pooling gradient, we need to distribute the gradient evenly
  // to all elements in the pooling window
  for (let b = 0; b < inputBatch; b++) {
    for (let h = 0; h < outputHeight; h++) {
      for (let w = 0; w < outputWidth; w++) {
        for (let c = 0; c < inputChannels; c++) {
          // Calculate input region for this output pixel
          const hStart = h * strides[0] - paddingTop;
          const wStart = w * strides[1] - paddingLeft;
          const hEnd = Math.min(hStart + poolSize[0], inputHeight);
          const wEnd = Math.min(wStart + poolSize[1], inputWidth);
          const hStartClamped = Math.max(0, hStart);
          const wStartClamped = Math.max(0, wStart);

          // Calculate number of elements in the pooling window
          const windowSize = (hEnd - hStartClamped) * (wEnd - wStartClamped);

          // Get output gradient value
          let outputGradVal;
          if (dataFormat === 'NHWC') {
            outputGradVal = outputGradData[b * outputHeight * outputWidth * inputChannels +
                                          h * outputWidth * inputChannels +
                                          w * inputChannels +
                                          c];
          } else { // 'NCHW'
            outputGradVal = outputGradData[b * inputChannels * outputHeight * outputWidth +
                                          c * outputHeight * outputWidth +
                                          h * outputWidth +
                                          w];
          }

          // Distribute gradient evenly to all elements in the pooling window
          const gradPerElement = outputGradVal / windowSize;

          for (let ih = hStartClamped; ih < hEnd; ih++) {
            for (let iw = wStartClamped; iw < wEnd; iw++) {
              let inputGradIndex;
              if (dataFormat === 'NHWC') {
                inputGradIndex = b * inputHeight * inputWidth * inputChannels +
                                ih * inputWidth * inputChannels +
                                iw * inputChannels +
                                c;
              } else { // 'NCHW'
                inputGradIndex = b * inputChannels * inputHeight * inputWidth +
                                c * inputHeight * inputWidth +
                                ih * inputWidth +
                                iw;
              }

              // Add gradient to the input position
              inputGradData[inputGradIndex] += gradPerElement;
            }
          }
        }
      }
    }
  }

  // Create input gradient tensor
  return createTensor({
    shape: inputShape,
    dtype: input.dtype,
    values: inputGradData
  });
});

// Gradient for sum: dx = dy expanded to shape of x
registerGradientFunction(TensorOpType.SUM, (outputGrad, x, axes?: number[], keepDims?: boolean) => {
  // If no axes specified, sum over all axes
  if (!axes) {
    axes = Array.from({ length: x.shape.length }, (_, i) => i);
  }

  // If keepDims is false, we need to reshape outputGrad
  let reshapedGrad = outputGrad;
  if (!keepDims) {
    const newShape = [...x.shape];
    for (const axis of axes) {
      newShape[axis] = 1;
    }

    // Create a new tensor with the reshaped dimensions
    const values = Array.from({ length: outputGrad.size }, (_, i) => outputGrad.get(i));
    reshapedGrad = createTensor({
      shape: newShape,
      dtype: outputGrad.dtype,
      values: values
    });
  }

  // Broadcast to original shape
  const ones = createTensor({
    shape: x.shape,
    dtype: x.dtype,
    values: new Array(x.size).fill(1)
  });

  return ops.multiply(reshapedGrad, ones).tensor;
});

// Gradient for mean: dx = dy / N expanded to shape of x
registerGradientFunction(TensorOpType.MEAN, (outputGrad, x, axes?: number[], keepDims?: boolean) => {
  // If no axes specified, mean over all axes
  if (!axes) {
    axes = Array.from({ length: x.shape.length }, (_, i) => i);
  }

  // Calculate N = product of dimensions along reduction axes
  let N = 1;
  for (const axis of axes) {
    N *= x.shape[axis];
  }

  // Scale gradient by 1/N
  const scaleFactor = createTensor({
    shape: [],
    dtype: outputGrad.dtype,
    values: [1 / N]
  });
  const scaledGrad = ops.multiply(outputGrad, scaleFactor).tensor;

  // If keepDims is false, we need to reshape scaledGrad
  let reshapedGrad = scaledGrad;
  if (!keepDims) {
    const newShape = [...x.shape];
    for (const axis of axes) {
      newShape[axis] = 1;
    }

    // Create a new tensor with the reshaped dimensions
    const values = Array.from({ length: scaledGrad.size }, (_, i) => scaledGrad.get(i));
    reshapedGrad = createTensor({
      shape: newShape,
      dtype: scaledGrad.dtype,
      values: values
    });
  }

  // Broadcast to original shape
  const ones = createTensor({
    shape: x.shape,
    dtype: x.dtype,
    values: new Array(x.size).fill(1)
  });

  return ops.multiply(reshapedGrad, ones).tensor;
});
