/**
 * Tensor Operations
 *
 * This file implements mathematical operations for tensors in the Neural Computation Framework.
 * It provides element-wise operations, matrix operations, reduction operations, and activation functions.
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
import { createTensor, shapeUtils, trackPerformance } from './tensor';

// Memory pool for reusing tensor data buffers
const memoryPool: Map<string, ArrayBuffer[]> = new Map();

/**
 * Get a buffer from the memory pool or create a new one
 * @param size Size in bytes
 * @param dtype Data type
 */
function getBufferFromPool(size: number, dtype: DataType): ArrayBuffer {
    const key = `${dtype}-${size}`;
    const pool = memoryPool.get(key) || [];

    if (pool.length > 0) {
        return pool.pop()!;
    }

    // Create a new buffer if none available in the pool
    const bytesPerElement = getBytesPerElement(dtype);
    return new ArrayBuffer(size * bytesPerElement);
}

/**
 * Return a buffer to the memory pool
 * @param buffer Buffer to return
 * @param dtype Data type
 */
function returnBufferToPool(buffer: ArrayBuffer, dtype: DataType): void {
    const key = `${dtype}-${buffer.byteLength}`;
    const pool = memoryPool.get(key) || [];
    pool.push(buffer);
    memoryPool.set(key, pool);
}

/**
 * Get the number of bytes per element for a data type
 * @param dtype Data type
 */
function getBytesPerElement(dtype: DataType): number {
    switch (dtype) {
        case 'float32':
        case 'int32':
            return 4;
        case 'float64':
        case 'int64':
            return 8;
        case 'int16':
        case 'uint16':
            return 2;
        case 'uint8':
        case 'bool':
            return 1;
        default:
            throw new Error(`Unsupported data type: ${dtype}`);
    }
}

/**
 * Create a typed array view of a buffer
 * @param buffer ArrayBuffer
 * @param dtype Data type
 */
function createTypedArrayView(buffer: ArrayBuffer, dtype: DataType): any {
    switch (dtype) {
        case 'float32':
            return new Float32Array(buffer);
        case 'float64':
            return new Float64Array(buffer);
        case 'int32':
            return new Int32Array(buffer);
        case 'int16':
            return new Int16Array(buffer);
        case 'uint8':
            return new Uint8Array(buffer);
        case 'uint16':
            return new Uint16Array(buffer);
        default:
            throw new Error(`Unsupported data type: ${dtype}`);
    }
}

/**
 * Apply an element-wise binary operation to two tensors
 * @param a First tensor
 * @param b Second tensor
 * @param op Operation function
 * @param opType Operation type for tracking
 */
function elementWiseBinaryOp(
    a: Tensor,
    b: Tensor,
    op: (a: number, b: number) => number,
    opType: TensorOpType
): TensorOpResult {
    const start = globalThis.performance.now();

    // Check if shapes are broadcastable
    if (!shapeUtils.areBroadcastable(a.shape, b.shape)) {
        throw new Error(`Cannot broadcast shapes [${a.shape}] and [${b.shape}]`);
    }

    // Get the broadcasted shape
    const resultShape = shapeUtils.broadcastShapes(a.shape, b.shape);
    const resultSize = shapeUtils.calculateSize(resultShape);

    // Determine result data type (use higher precision)
    const resultDtype = a.dtype === 'float64' || b.dtype === 'float64' ? 'float64' : 'float32';

    // Create result tensor
    const resultValues = new Array(resultSize);

    // Calculate strides for broadcasting
    const aStrides = calculateBroadcastStrides(a.shape, resultShape);
    const bStrides = calculateBroadcastStrides(b.shape, resultShape);
    const resultStrides = shapeUtils.calculateStrides(resultShape);

    // Apply operation to each element
    const resultIndices = new Array(resultShape.length).fill(0);
    for (let i = 0; i < resultSize; i++) {
        // Calculate indices for this position
        for (let dim = 0; dim < resultShape.length; dim++) {
            resultIndices[dim] = Math.floor(i / resultStrides[dim]) % resultShape[dim];
        }

        // Calculate indices for a and b tensors
        const aIndices = resultIndices.slice(-a.shape.length);
        const bIndices = resultIndices.slice(-b.shape.length);

        // Get values from a and b
        const aValue = a.get(...aIndices);
        const bValue = b.get(...bIndices);

        // Apply operation
        resultValues[i] = op(aValue, bValue);
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: resultShape,
        dtype: resultDtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        opType,
        resultTensor,
        { a, b }
    );
}

/**
 * Calculate strides for broadcasting
 * @param shape Original shape
 * @param broadcastShape Target shape after broadcasting
 */
function calculateBroadcastStrides(shape: Shape, broadcastShape: Shape): number[] {
    const rankDiff = broadcastShape.length - shape.length;
    const strides = new Array(broadcastShape.length).fill(0);

    let stride = 1;
    for (let i = shape.length - 1; i >= 0; i--) {
        if (shape[i] === 1) {
            // For dimensions of size 1, stride is 0 (broadcast)
            strides[i + rankDiff] = 0;
        } else {
            strides[i + rankDiff] = stride;
            stride *= shape[i];
        }
    }

    return strides;
}

/**
 * Add two tensors element-wise
 * @param a First tensor
 * @param b Second tensor
 */
export function add(a: Tensor, b: Tensor): TensorOpResult {
    return elementWiseBinaryOp(
        a,
        b,
        (x, y) => x + y,
        TensorOpType.ADD
    );
}

/**
 * Subtract two tensors element-wise
 * @param a First tensor
 * @param b Second tensor
 */
export function subtract(a: Tensor, b: Tensor): TensorOpResult {
    return elementWiseBinaryOp(
        a,
        b,
        (x, y) => x - y,
        TensorOpType.SUBTRACT
    );
}

/**
 * Multiply two tensors element-wise
 * @param a First tensor
 * @param b Second tensor
 */
export function multiply(a: Tensor, b: Tensor): TensorOpResult {
    return elementWiseBinaryOp(
        a,
        b,
        (x, y) => x * y,
        TensorOpType.MULTIPLY
    );
}

/**
 * Divide two tensors element-wise
 * @param a First tensor
 * @param b Second tensor
 */
export function divide(a: Tensor, b: Tensor): TensorOpResult {
    return elementWiseBinaryOp(
        a,
        b,
        (x, y) => {
            if (y === 0) {
                console.warn('Division by zero encountered');
                return x > 0 ? Infinity : x < 0 ? -Infinity : NaN;
            }
            return x / y;
        },
        TensorOpType.DIVIDE
    );
}

/**
 * Matrix multiplication of two tensors
 * @param a First tensor
 * @param b Second tensor
 */
export function matmul(a: Tensor, b: Tensor): TensorOpResult {
    const start = globalThis.performance.now();

    // Check dimensions
    if (a.rank < 2 || b.rank < 2) {
        throw new Error('Tensors must have at least 2 dimensions for matmul');
    }

    // Check that the last dimension of a matches the second-to-last dimension of b
    if (a.shape[a.rank - 1] !== b.shape[b.rank - 2]) {
        throw new Error(`Incompatible dimensions for matmul: [${a.shape}] and [${b.shape}]`);
    }

    // Determine result shape
    const resultShape = [...a.shape.slice(0, -1), b.shape[b.rank - 1]];
    const resultSize = shapeUtils.calculateSize(resultShape);

    // Determine result data type (use higher precision)
    const resultDtype = a.dtype === 'float64' || b.dtype === 'float64' ? 'float64' : 'float32';

    // Create result tensor
    const resultValues = new Array(resultSize);

    // Get dimensions for the matrix multiplication
    const M = a.shape[a.rank - 2];
    const N = b.shape[b.rank - 1];
    const K = a.shape[a.rank - 1];

    // Calculate batch dimensions
    const aBatchDims = a.shape.slice(0, -2);
    const bBatchDims = b.shape.slice(0, -2);

    // Check if batch dimensions are compatible
    const batchDims = [];
    const maxBatchRank = Math.max(aBatchDims.length, bBatchDims.length);
    for (let i = 0; i < maxBatchRank; i++) {
        const aDim = i < aBatchDims.length ? aBatchDims[aBatchDims.length - i - 1] : 1;
        const bDim = i < bBatchDims.length ? bBatchDims[bBatchDims.length - i - 1] : 1;

        if (aDim !== bDim && aDim !== 1 && bDim !== 1) {
            throw new Error(`Incompatible batch dimensions for matmul: [${a.shape}] and [${b.shape}]`);
        }

        batchDims.unshift(Math.max(aDim, bDim));
    }

    // Calculate total number of batch operations
    const batchSize = batchDims.reduce((acc, dim) => acc * dim, 1);

    // Perform matrix multiplication for each batch
    for (let batch = 0; batch < batchSize; batch++) {
        // Calculate batch indices
        const batchIndices = [];
        let batchIndex = batch;
        for (const dim of batchDims) {
            batchIndices.push(batchIndex % dim);
            batchIndex = Math.floor(batchIndex / dim);
        }

        // Calculate batch offsets for a and b
        const aOffset = calculateBatchOffset(batchIndices, aBatchDims);
        const bOffset = calculateBatchOffset(batchIndices, bBatchDims);

        // Perform matrix multiplication for this batch
        for (let i = 0; i < M; i++) {
            for (let j = 0; j < N; j++) {
                let sum = 0;
                for (let k = 0; k < K; k++) {
                    const aIndices = [...batchIndices.slice(0, aBatchDims.length), i, k];
                    const bIndices = [...batchIndices.slice(0, bBatchDims.length), k, j];

                    const aValue = a.get(...aIndices);
                    const bValue = b.get(...bIndices);

                    sum += aValue * bValue;
                }

                // Calculate result index
                const resultIndex = calculateResultIndex(batch, i, j, M, N, batchSize);
                resultValues[resultIndex] = sum;
            }
        }
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: resultShape,
        dtype: resultDtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.MATMUL,
        resultTensor,
        { a, b }
    );
}

/**
 * Calculate batch offset for matrix multiplication
 * @param batchIndices Batch indices
 * @param batchDims Batch dimensions
 */
function calculateBatchOffset(batchIndices: number[], batchDims: number[]): number {
    let offset = 0;
    let stride = 1;

    for (let i = batchDims.length - 1; i >= 0; i--) {
        const index = i < batchIndices.length ? batchIndices[i] : 0;
        offset += index * stride;
        stride *= batchDims[i];
    }

    return offset;
}

/**
 * Calculate result index for matrix multiplication
 * @param batch Batch index
 * @param i Row index
 * @param j Column index
 * @param M Number of rows
 * @param N Number of columns
 * @param batchSize Total number of batches
 */
function calculateResultIndex(
    batch: number,
    i: number,
    j: number,
    M: number,
    N: number,
    batchSize: number
): number {
    return batch * M * N + i * N + j;
}

/**
 * Transpose a tensor
 * @param tensor Input tensor
 * @param axes Optional permutation of axes
 */
export function transpose(tensor: Tensor, axes?: number[]): TensorOpResult {
    const start = globalThis.performance.now();

    // Default permutation is to reverse the axes
    if (!axes) {
        axes = [];
        for (let i = tensor.rank - 1; i >= 0; i--) {
            axes.push(i);
        }
    }

    // Check that permutation is valid
    if (axes.length !== tensor.rank) {
        throw new Error(`Permutation ${axes} does not match tensor rank ${tensor.rank}`);
    }

    // Check that permutation contains all axes
    const sorted = [...axes].sort((a, b) => a - b);
    for (let i = 0; i < tensor.rank; i++) {
        if (sorted[i] !== i) {
            throw new Error(`Invalid permutation ${axes}`);
        }
    }

    // Calculate new shape and strides
    const newShape = [];
    for (const axis of axes) {
        newShape.push(tensor.shape[axis]);
    }

    // Create result tensor
    const resultSize = shapeUtils.calculateSize(newShape);
    const resultValues = new Array(resultSize);

    // Calculate strides for input and output tensors
    const inputStrides = tensor.strides;
    const outputStrides = shapeUtils.calculateStrides(newShape);

    // Perform transposition
    const inputIndices = new Array(tensor.rank).fill(0);
    for (let i = 0; i < resultSize; i++) {
        // Calculate output indices
        const outputIndices = [];
        let remaining = i;
        for (let j = 0; j < newShape.length; j++) {
            outputIndices.push(Math.floor(remaining / outputStrides[j]));
            remaining %= outputStrides[j];
        }

        // Map output indices to input indices using the permutation
        for (let j = 0; j < tensor.rank; j++) {
            inputIndices[axes[j]] = outputIndices[j];
        }

        // Get value from input tensor
        resultValues[i] = tensor.get(...inputIndices);
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: newShape,
        dtype: tensor.dtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.TRANSPOSE,
        resultTensor,
        { tensor }
    );
}

/**
 * Apply a function to each element of a tensor
 * @param tensor Input tensor
 * @param func Function to apply
 * @param opType Operation type for tracking
 */
function elementWiseUnaryOp(
    tensor: Tensor,
    func: (x: number) => number,
    opType: TensorOpType
): TensorOpResult {
    const start = globalThis.performance.now();

    // Create result tensor with same shape
    const resultValues = new Array(tensor.size);

    // Apply function to each element
    for (let i = 0; i < tensor.size; i++) {
        const indices = getIndicesToOffset(i, tensor.strides, tensor.shape);
        const value = tensor.get(...indices);
        resultValues[i] = func(value);
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: [...tensor.shape],
        dtype: tensor.dtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        opType,
        resultTensor,
        { tensor }
    );
}

/**
 * Convert a linear offset to indices
 * @param offset Linear offset
 * @param strides Tensor strides
 * @param shape Tensor shape
 */
function getIndicesToOffset(
    offset: number,
    strides: number[],
    shape: Shape
): number[] {
    const rank = shape.length;
    const indices = new Array(rank);

    for (let i = 0; i < rank; i++) {
        indices[i] = Math.floor(offset / strides[i]);
        offset -= indices[i] * strides[i];
    }

    return indices;
}

/**
 * Apply exponential function to each element
 * @param tensor Input tensor
 */
export function exp(tensor: Tensor): TensorOpResult {
    return elementWiseUnaryOp(
        tensor,
        Math.exp,
        TensorOpType.EXP
    );
}

/**
 * Apply natural logarithm to each element
 * @param tensor Input tensor
 */
export function log(tensor: Tensor): TensorOpResult {
    return elementWiseUnaryOp(
        tensor,
        (x) => {
            if (x <= 0) {
                console.warn('Logarithm of non-positive number');
                return NaN;
            }
            return Math.log(x);
        },
        TensorOpType.LOG
    );
}

/**
 * Apply square root to each element
 * @param tensor Input tensor
 */
export function sqrt(tensor: Tensor): TensorOpResult {
    return elementWiseUnaryOp(
        tensor,
        (x) => {
            if (x < 0) {
                console.warn('Square root of negative number');
                return NaN;
            }
            return Math.sqrt(x);
        },
        TensorOpType.SQRT
    );
}

/**
 * Apply sigmoid function to each element
 * @param tensor Input tensor
 */
export function sigmoid(tensor: Tensor): TensorOpResult {
    return elementWiseUnaryOp(
        tensor,
        (x) => 1 / (1 + Math.exp(-x)),
        TensorOpType.SIGMOID
    );
}

/**
 * Apply hyperbolic tangent function to each element
 * @param tensor Input tensor
 */
export function tanh(tensor: Tensor): TensorOpResult {
    return elementWiseUnaryOp(
        tensor,
        Math.tanh,
        TensorOpType.TANH
    );
}

/**
 * Apply rectified linear unit function to each element
 * @param tensor Input tensor
 */
export function relu(tensor: Tensor): TensorOpResult {
    return elementWiseUnaryOp(
        tensor,
        (x) => Math.max(0, x),
        TensorOpType.RELU
    );
}

/**
 * Apply leaky rectified linear unit function to each element
 * @param tensor Input tensor
 * @param alpha Slope for negative values (default: 0.01)
 */
export function leakyRelu(tensor: Tensor, alpha: number = 0.01): TensorOpResult {
    const start = globalThis.performance.now();

    // Create result tensor with same shape
    const resultValues = new Array(tensor.size);

    // Apply function to each element
    for (let i = 0; i < tensor.size; i++) {
        const indices = getIndicesToOffset(i, tensor.strides, tensor.shape);
        const value = tensor.get(...indices);
        resultValues[i] = value > 0 ? value : alpha * value;
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: [...tensor.shape],
        dtype: tensor.dtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.LEAKY_RELU,
        resultTensor,
        { tensor },
        { alpha }
    );
}

/**
 * Apply exponential linear unit function to each element
 * @param tensor Input tensor
 * @param alpha Scale for negative values (default: 1.0)
 */
export function elu(tensor: Tensor, alpha: number = 1.0): TensorOpResult {
    const start = globalThis.performance.now();

    // Create result tensor with same shape
    const resultValues = new Array(tensor.size);

    // Apply function to each element
    for (let i = 0; i < tensor.size; i++) {
        const indices = getIndicesToOffset(i, tensor.strides, tensor.shape);
        const value = tensor.get(...indices);
        resultValues[i] = value > 0 ? value : alpha * (Math.exp(value) - 1);
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: [...tensor.shape],
        dtype: tensor.dtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.ELU,
        resultTensor,
        { tensor },
        { alpha }
    );
}

/**
 * Apply Gaussian Error Linear Unit (GELU) function to each element
 * @param tensor Input tensor
 * @param approximate Whether to use the approximate formula (default: false)
 */
export function gelu(tensor: Tensor, approximate: boolean = false): TensorOpResult {
    const start = globalThis.performance.now();

    // Create result tensor with same shape
    const resultValues = new Array(tensor.size);

    // Apply function to each element
    for (let i = 0; i < tensor.size; i++) {
        const indices = getIndicesToOffset(i, tensor.strides, tensor.shape);
        const value = tensor.get(...indices);

        if (approximate) {
            // Approximate GELU: 0.5 * x * (1 + tanh(sqrt(2/π) * (x + 0.044715 * x^3)))
            const x3 = value * value * value;
            const inner = Math.sqrt(2 / Math.PI) * (value + 0.044715 * x3);
            resultValues[i] = 0.5 * value * (1 + Math.tanh(inner));
        } else {
            // Exact GELU: 0.5 * x * (1 + erf(x/sqrt(2)))
            const xOverSqrt2 = value / Math.sqrt(2);
            resultValues[i] = 0.5 * value * (1 + erf(xOverSqrt2));
        }
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: [...tensor.shape],
        dtype: tensor.dtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.GELU,
        resultTensor,
        { tensor },
        { approximate }
    );
}

/**
 * Apply Swish/SiLU (Sigmoid Linear Unit) function to each element
 * @param tensor Input tensor
 * @param beta Scale parameter (default: 1.0)
 */
export function swish(tensor: Tensor, beta: number = 1.0): TensorOpResult {
    const start = globalThis.performance.now();

    // Create result tensor with same shape
    const resultValues = new Array(tensor.size);

    // Apply function to each element
    for (let i = 0; i < tensor.size; i++) {
        const indices = getIndicesToOffset(i, tensor.strides, tensor.shape);
        const value = tensor.get(...indices);
        const sigmoidValue = 1 / (1 + Math.exp(-beta * value));
        resultValues[i] = value * sigmoidValue;
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: [...tensor.shape],
        dtype: tensor.dtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.SWISH,
        resultTensor,
        { tensor },
        { beta }
    );
}

/**
 * Error function (erf) implementation
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

/**
 * Apply softmax function along specified axis
 * @param tensor Input tensor
 * @param axis Axis along which to apply softmax (default: -1)
 */
export function softmax(tensor: Tensor, axis: number = -1): TensorOpResult {
    const start = globalThis.performance.now();

    // Normalize axis
    if (axis < 0) {
        axis += tensor.rank;
    }

    // Check that axis is valid
    if (axis < 0 || axis >= tensor.rank) {
        throw new Error(`Invalid axis ${axis} for tensor of rank ${tensor.rank}`);
    }

    // Create result tensor with same shape
    const resultValues = new Array(tensor.size);

    // Calculate size of each softmax operation
    const axisSize = tensor.shape[axis];
    const outerSize = tensor.shape.slice(0, axis).reduce((acc, dim) => acc * dim, 1);
    const innerSize = tensor.shape.slice(axis + 1).reduce((acc, dim) => acc * dim, 1);

    // Perform softmax for each slice along the specified axis
    for (let outer = 0; outer < outerSize; outer++) {
        for (let inner = 0; inner < innerSize; inner++) {
            // Find maximum value in this slice (for numerical stability)
            let maxVal = -Infinity;
            for (let i = 0; i < axisSize; i++) {
                const index = calculateSoftmaxIndex(outer, i, inner, axisSize, innerSize);
                const indices = getIndicesToOffset(index, tensor.strides, tensor.shape);
                const value = tensor.get(...indices);
                maxVal = Math.max(maxVal, value);
            }

            // Calculate exponentials and sum
            let sum = 0;
            const expValues = new Array(axisSize);
            for (let i = 0; i < axisSize; i++) {
                const index = calculateSoftmaxIndex(outer, i, inner, axisSize, innerSize);
                const indices = getIndicesToOffset(index, tensor.strides, tensor.shape);
                const value = tensor.get(...indices);
                const expVal = Math.exp(value - maxVal);
                expValues[i] = expVal;
                sum += expVal;
            }

            // Normalize
            for (let i = 0; i < axisSize; i++) {
                const index = calculateSoftmaxIndex(outer, i, inner, axisSize, innerSize);
                resultValues[index] = expValues[i] / sum;
            }
        }
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: [...tensor.shape],
        dtype: tensor.dtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.SOFTMAX,
        resultTensor,
        { tensor },
        { axis }
    );
}

/**
 * Calculate index for softmax operation
 * @param outer Outer index
 * @param axis Axis index
 * @param inner Inner index
 * @param axisSize Size of the axis
 * @param innerSize Size of inner dimensions
 */
function calculateSoftmaxIndex(
    outer: number,
    axis: number,
    inner: number,
    axisSize: number,
    innerSize: number
): number {
    return outer * axisSize * innerSize + axis * innerSize + inner;
}

/**
 * Reduce a tensor along specified axes
 * @param tensor Input tensor
 * @param axes Axes to reduce along
 * @param keepDims Whether to keep reduced dimensions
 * @param reducer Reduction function
 * @param opType Operation type for tracking
 */
function reduceOp(
    tensor: Tensor,
    axes: number[] | undefined,
    keepDims: boolean,
    reducer: (values: number[]) => number,
    opType: TensorOpType
): TensorOpResult {
    const start = globalThis.performance.now();

    // Normalize axes
    if (axes === undefined) {
        // Reduce all axes
        axes = [];
        for (let i = 0; i < tensor.rank; i++) {
            axes.push(i);
        }
    } else {
        // Normalize negative axes
        axes = axes.map(axis => axis < 0 ? axis + tensor.rank : axis);

        // Check that axes are valid
        for (const axis of axes) {
            if (axis < 0 || axis >= tensor.rank) {
                throw new Error(`Invalid axis ${axis} for tensor of rank ${tensor.rank}`);
            }
        }

        // Sort axes in ascending order
        axes.sort((a, b) => a - b);
    }

    // Calculate result shape
    const resultShape: number[] = [];
    for (let i = 0; i < tensor.rank; i++) {
        if (!axes.includes(i)) {
            resultShape.push(tensor.shape[i]);
        } else if (keepDims) {
            resultShape.push(1);
        }
    }

    // Handle scalar result
    if (resultShape.length === 0 && keepDims) {
        resultShape.push(1);
    }

    // Create result tensor
    const resultSize = Math.max(1, shapeUtils.calculateSize(resultShape));
    const resultValues = new Array(resultSize).fill(0);
    const resultDtype = tensor.dtype;

    // Collect values to reduce for each output element
    const collectValues = (outputIndex: number, inputIndices: number[], dim: number): void => {
        if (dim === tensor.rank) {
            // We have a complete set of indices, get the value
            const value = tensor.get(...inputIndices);

            // Add to the appropriate output element
            const outputIndices: number[] = [];
            let outIdx = 0;
            for (let i = 0, j = 0; i < tensor.rank; i++) {
                if (!axes.includes(i)) {
                    outputIndices.push(inputIndices[i]);
                    outIdx += outputIndices[j] * (j === 0 ? 1 : resultShape.slice(0, j).reduce((a, b) => a * b, 1));
                    j++;
                }
            }

            // If we're reducing all dimensions, there's only one output element
            if (resultSize === 1) {
                (resultValues[outputIndex] as number[]).push(value);
            } else {
                if (!resultValues[outIdx]) {
                    resultValues[outIdx] = [] as number[];
                }
                (resultValues[outIdx] as number[]).push(value);
            }
        } else {
            // Recursively collect values for this dimension
            const dimSize = tensor.shape[dim];
            for (let i = 0; i < dimSize; i++) {
                inputIndices[dim] = i;
                collectValues(outputIndex, inputIndices, dim + 1);
            }
        }
    };

    // Initialize result values as arrays to collect values for reduction
    for (let i = 0; i < resultSize; i++) {
        resultValues[i] = [] as number[];
    }

    // Collect values for reduction
    collectValues(0, new Array(tensor.rank).fill(0), 0);

    // Apply reducer to each output element
    for (let i = 0; i < resultSize; i++) {
        resultValues[i] = reducer(resultValues[i]);
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: resultShape,
        dtype: resultDtype,
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        opType,
        resultTensor,
        { tensor }
    );
}

/**
 * Sum values along specified axes
 * @param tensor Input tensor
 * @param axes Axes to sum along
 * @param keepDims Whether to keep reduced dimensions
 */
export function sum(tensor: Tensor, axes?: number[] | number, keepDims: boolean = false): TensorOpResult {
    // Convert single axis to array
    if (typeof axes === 'number') {
        axes = [axes];
    }

    return reduceOp(
        tensor,
        axes,
        keepDims,
        (values) => values.reduce((a, b) => a + b, 0),
        TensorOpType.SUM
    );
}

/**
 * Calculate mean along specified axes
 * @param tensor Input tensor
 * @param axes Axes to average along
 * @param keepDims Whether to keep reduced dimensions
 */
export function mean(tensor: Tensor, axes?: number[] | number, keepDims: boolean = false): TensorOpResult {
    // Convert single axis to array
    if (typeof axes === 'number') {
        axes = [axes];
    }

    return reduceOp(
        tensor,
        axes,
        keepDims,
        (values) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        TensorOpType.MEAN
    );
}

/**
 * Find maximum values along specified axes
 * @param tensor Input tensor
 * @param axes Axes to find maximum along
 * @param keepDims Whether to keep reduced dimensions
 */
export function max(tensor: Tensor, axes?: number[] | number, keepDims: boolean = false): TensorOpResult {
    // Convert single axis to array
    if (typeof axes === 'number') {
        axes = [axes];
    }

    return reduceOp(
        tensor,
        axes,
        keepDims,
        (values) => values.length > 0 ? Math.max(...values) : -Infinity,
        TensorOpType.MAX
    );
}

/**
 * Find minimum values along specified axes
 * @param tensor Input tensor
 * @param axes Axes to find minimum along
 * @param keepDims Whether to keep reduced dimensions
 */
export function min(tensor: Tensor, axes?: number[] | number, keepDims: boolean = false): TensorOpResult {
    // Convert single axis to array
    if (typeof axes === 'number') {
        axes = [axes];
    }

    return reduceOp(
        tensor,
        axes,
        keepDims,
        (values) => values.length > 0 ? Math.min(...values) : Infinity,
        TensorOpType.MIN
    );
}

/**
 * Find indices of maximum values along specified axis
 * @param tensor Input tensor
 * @param axis Axis to find argmax along
 */
export function argmax(tensor: Tensor, axis: number = 0): TensorOpResult {
    const start = globalThis.performance.now();

    // Normalize axis
    if (axis < 0) {
        axis += tensor.rank;
    }

    // Check that axis is valid
    if (axis < 0 || axis >= tensor.rank) {
        throw new Error(`Invalid axis ${axis} for tensor of rank ${tensor.rank}`);
    }

    // Calculate result shape
    const resultShape = [...tensor.shape];
    resultShape.splice(axis, 1);

    // Handle scalar result
    if (resultShape.length === 0) {
        resultShape.push(1);
    }

    // Create result tensor
    const resultSize = shapeUtils.calculateSize(resultShape);
    const resultValues = new Array(resultSize);

    // Calculate size of each argmax operation
    const axisSize = tensor.shape[axis];
    const outerSize = tensor.shape.slice(0, axis).reduce((acc, dim) => acc * dim, 1);
    const innerSize = tensor.shape.slice(axis + 1).reduce((acc, dim) => acc * dim, 1);

    // Find argmax for each slice along the specified axis
    for (let outer = 0; outer < outerSize; outer++) {
        for (let inner = 0; inner < innerSize; inner++) {
            let maxVal = -Infinity;
            let maxIdx = -1;

            for (let i = 0; i < axisSize; i++) {
                const index = outer * axisSize * innerSize + i * innerSize + inner;
                const indices = getIndicesToOffset(index, tensor.strides, tensor.shape);
                const value = tensor.get(...indices);

                if (value > maxVal) {
                    maxVal = value;
                    maxIdx = i;
                }
            }

            // Calculate result index
            const resultIndex = outer * innerSize + inner;
            resultValues[resultIndex] = maxIdx;
        }
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: resultShape,
        dtype: 'int32',
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.ARGMAX,
        resultTensor,
        { tensor },
        { axis }
    );
}

/**
 * Find indices of minimum values along specified axis
 * @param tensor Input tensor
 * @param axis Axis to find argmin along
 */
export function argmin(tensor: Tensor, axis: number = 0): TensorOpResult {
    const start = globalThis.performance.now();

    // Normalize axis
    if (axis < 0) {
        axis += tensor.rank;
    }

    // Check that axis is valid
    if (axis < 0 || axis >= tensor.rank) {
        throw new Error(`Invalid axis ${axis} for tensor of rank ${tensor.rank}`);
    }

    // Calculate result shape
    const resultShape = [...tensor.shape];
    resultShape.splice(axis, 1);

    // Handle scalar result
    if (resultShape.length === 0) {
        resultShape.push(1);
    }

    // Create result tensor
    const resultSize = shapeUtils.calculateSize(resultShape);
    const resultValues = new Array(resultSize);

    // Calculate size of each argmin operation
    const axisSize = tensor.shape[axis];
    const outerSize = tensor.shape.slice(0, axis).reduce((acc, dim) => acc * dim, 1);
    const innerSize = tensor.shape.slice(axis + 1).reduce((acc, dim) => acc * dim, 1);

    // Find argmin for each slice along the specified axis
    for (let outer = 0; outer < outerSize; outer++) {
        for (let inner = 0; inner < innerSize; inner++) {
            let minVal = Infinity;
            let minIdx = -1;

            for (let i = 0; i < axisSize; i++) {
                const index = outer * axisSize * innerSize + i * innerSize + inner;
                const indices = getIndicesToOffset(index, tensor.strides, tensor.shape);
                const value = tensor.get(...indices);

                if (value < minVal) {
                    minVal = value;
                    minIdx = i;
                }
            }

            // Calculate result index
            const resultIndex = outer * innerSize + inner;
            resultValues[resultIndex] = minIdx;
        }
    }

    // Create result tensor
    const resultTensor = createTensor({
        shape: resultShape,
        dtype: 'int32',
        values: resultValues
    });

    // Track performance
    return trackPerformance(
        start,
        TensorOpType.ARGMIN,
        resultTensor,
        { tensor },
        { axis }
    );
}
