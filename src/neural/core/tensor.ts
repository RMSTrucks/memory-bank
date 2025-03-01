/**
 * Tensor Implementation
 *
 * This file implements the core tensor operations for the Neural Computation Framework.
 * It provides functionality for creating, manipulating, and transforming tensors.
 */

import { v4 as uuidv4 } from 'uuid';
import {
    DataType,
    Shape,
    Tensor,
    TensorOptions,
    TypedArray,
    TensorOpType,
    TensorOpResult,
    TensorOpPerformance
} from '../types/tensor';

/**
 * Implementation of the Tensor interface
 */
export class TensorImpl implements Tensor {
    id: string;
    dtype: DataType;
    shape: Shape;
    data: ArrayBuffer | TypedArray;
    size: number;
    rank: number;
    strides: number[];
    memory: {
        managed: boolean;
        createdAt: Date;
        lastAccessed: Date;
        cached: boolean;
        refCount: number;
    };
    metadata?: {
        name?: string;
        description?: string;
        source?: string;
        [key: string]: any;
    };

    /**
     * Create a new Tensor
     * @param options Tensor creation options
     */
    constructor(options: TensorOptions) {
        this.id = uuidv4();
        this.dtype = options.dtype || 'float32';
        this.shape = options.shape || [];
        this.rank = this.shape.length;
        this.strides = calculateStrides(this.shape);
        this.size = calculateSize(this.shape);
        this.data = createTensorData(options.values, this.dtype, this.size);

        this.memory = {
            managed: true,
            createdAt: new Date(),
            lastAccessed: new Date(),
            cached: options.cached || false,
            refCount: 1,
        };

        if (options.metadata) {
            this.metadata = { ...options.metadata };
        }
    }

    /**
     * Get a value at the specified indices
     * @param indices Array of indices
     */
    get(...indices: number[]): number {
        this.updateLastAccessed();
        const offset = this.getOffset(indices);
        return this.getValueAt(offset);
    }

    /**
     * Set a value at the specified indices
     * @param indices Array of indices
     * @param value Value to set
     */
    set(value: number, ...indices: number[]): void {
        this.updateLastAccessed();
        const offset = this.getOffset(indices);
        this.setValueAt(offset, value);
    }

    /**
     * Get the linear offset for the given indices
     * @param indices Array of indices
     */
    private getOffset(indices: number[]): number {
        if (indices.length !== this.rank) {
            throw new Error(`Expected ${this.rank} indices, but got ${indices.length}`);
        }

        let offset = 0;
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] < 0 || indices[i] >= this.shape[i]) {
                throw new Error(`Index ${indices[i]} is out of bounds for dimension ${i} with size ${this.shape[i]}`);
            }
            offset += indices[i] * this.strides[i];
        }
        return offset;
    }

    /**
     * Get the value at the specified offset
     * @param offset Linear offset
     */
    private getValueAt(offset: number): number {
        if (this.data instanceof ArrayBuffer) {
            return getValueFromBuffer(this.data, offset, this.dtype);
        } else {
            return this.data[offset];
        }
    }

    /**
     * Set the value at the specified offset
     * @param offset Linear offset
     * @param value Value to set
     */
    private setValueAt(offset: number, value: number): void {
        if (this.data instanceof ArrayBuffer) {
            setValueInBuffer(this.data, offset, value, this.dtype);
        } else {
            this.data[offset] = value;
        }
    }

    /**
     * Update the last accessed timestamp
     */
    private updateLastAccessed(): void {
        this.memory.lastAccessed = new Date();
    }

    /**
     * Increment the reference count
     */
    retain(): void {
        this.memory.refCount++;
    }

    /**
     * Decrement the reference count
     * @returns Whether the tensor should be disposed
     */
    release(): boolean {
        this.memory.refCount--;
        return this.memory.refCount <= 0;
    }

    /**
     * Reshape the tensor to a new shape
     * @param newShape New shape
     */
    reshape(newShape: Shape): Tensor {
        const newSize = calculateSize(newShape);
        if (newSize !== this.size) {
            throw new Error(`Cannot reshape tensor of size ${this.size} to shape [${newShape}] with size ${newSize}`);
        }

        const reshapedTensor = new TensorImpl({
            dtype: this.dtype,
            shape: newShape,
            values: this.toArray()
        });

        if (this.metadata) {
            reshapedTensor.metadata = { ...this.metadata };
        }

        return reshapedTensor;
    }

    /**
     * Convert the tensor to a JavaScript array
     */
    toArray(): number[] {
        const result: number[] = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            result[i] = this.getValueAt(i);
        }
        return result;
    }

    /**
     * Create a deep copy of the tensor
     */
    clone(): Tensor {
        const clonedTensor = new TensorImpl({
            dtype: this.dtype,
            shape: [...this.shape],
            values: this.toArray()
        });

        if (this.metadata) {
            clonedTensor.metadata = { ...this.metadata };
        }

        return clonedTensor;
    }

    /**
     * Convert the tensor to a specific data type
     * @param dtype Target data type
     */
    asType(dtype: DataType): Tensor {
        if (dtype === this.dtype) {
            return this.clone();
        }

        const convertedTensor = new TensorImpl({
            dtype,
            shape: [...this.shape],
            values: this.toArray()
        });

        if (this.metadata) {
            convertedTensor.metadata = { ...this.metadata };
        }

        return convertedTensor;
    }
}

/**
 * Create a new tensor with the given options
 * @param options Tensor creation options
 */
export function createTensor(options: TensorOptions): Tensor {
    return new TensorImpl(options);
}

/**
 * Create a tensor filled with zeros
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 */
export function zeros(shape: Shape, dtype: DataType = 'float32'): Tensor {
    const size = calculateSize(shape);
    const values = new Array(size).fill(0);
    return createTensor({ shape, dtype, values });
}

/**
 * Create a tensor filled with ones
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 */
export function ones(shape: Shape, dtype: DataType = 'float32'): Tensor {
    const size = calculateSize(shape);
    const values = new Array(size).fill(1);
    return createTensor({ shape, dtype, values });
}

/**
 * Create a tensor with random values
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 * @param min Minimum value (default: 0)
 * @param max Maximum value (default: 1)
 */
export function random(
    shape: Shape,
    dtype: DataType = 'float32',
    min: number = 0,
    max: number = 1
): Tensor {
    const size = calculateSize(shape);
    const range = max - min;
    const values = new Array(size);
    for (let i = 0; i < size; i++) {
        values[i] = min + Math.random() * range;
    }
    return createTensor({ shape, dtype, values });
}

/**
 * Create a tensor with values from an array
 * @param values Source array
 * @param shape Shape of the tensor
 * @param dtype Data type of the tensor
 */
export function fromArray(
    values: number[],
    shape?: Shape,
    dtype: DataType = 'float32'
): Tensor {
    if (!shape) {
        shape = [values.length];
    }

    const size = calculateSize(shape);
    if (size !== values.length) {
        throw new Error(`Shape [${shape}] with size ${size} doesn't match array length ${values.length}`);
    }

    return createTensor({ shape, dtype, values });
}

/**
 * Create a tensor with values arranged in a range
 * @param start Start value
 * @param stop Stop value (exclusive)
 * @param step Step value (default: 1)
 * @param dtype Data type of the tensor
 */
export function range(
    start: number,
    stop: number,
    step: number = 1,
    dtype: DataType = 'float32'
): Tensor {
    const count = Math.max(0, Math.ceil((stop - start) / step));
    const values = new Array(count);
    for (let i = 0; i < count; i++) {
        values[i] = start + i * step;
    }
    return createTensor({ shape: [count], dtype, values });
}

/**
 * Calculate the strides for a given shape
 * @param shape Tensor shape
 */
export function calculateStrides(shape: Shape): number[] {
    const rank = shape.length;
    const strides = new Array(rank);
    let stride = 1;
    for (let i = rank - 1; i >= 0; i--) {
        strides[i] = stride;
        stride *= shape[i];
    }
    return strides;
}

/**
 * Calculate the total size of a tensor with the given shape
 * @param shape Tensor shape
 */
export function calculateSize(shape: Shape): number {
    if (shape.length === 0) {
        return 0;
    }
    return shape.reduce((a, b) => a * b, 1);
}

/**
 * Create tensor data storage
 * @param values Initial values
 * @param dtype Data type
 * @param size Total size
 */
function createTensorData(
    values: number[] | TypedArray | undefined,
    dtype: DataType,
    size: number
): ArrayBuffer | TypedArray {
    if (!values) {
        // Create empty tensor data
        return createTypedArray(dtype, size);
    }

    if (Array.isArray(values)) {
        // Convert JavaScript array to typed array
        if (values.length !== size) {
            throw new Error(`Values array length ${values.length} doesn't match tensor size ${size}`);
        }
        const typedArray = createTypedArray(dtype, size);
        for (let i = 0; i < size; i++) {
            typedArray[i] = values[i];
        }
        return typedArray;
    }

    // Direct typed array
    if (values.length !== size) {
        throw new Error(`TypedArray length ${values.length} doesn't match tensor size ${size}`);
    }
    return values;
}

/**
 * Create a typed array for the given data type and size
 * @param dtype Data type
 * @param size Array size
 */
function createTypedArray(dtype: DataType, size: number): TypedArray {
    switch (dtype) {
        case 'float32':
            return new Float32Array(size);
        case 'float64':
            return new Float64Array(size);
        case 'int32':
            return new Int32Array(size);
        case 'int16':
            return new Int16Array(size);
        case 'uint8':
            return new Uint8Array(size);
        case 'uint16':
            return new Uint16Array(size);
        default:
            throw new Error(`Unsupported data type: ${dtype}`);
    }
}

/**
 * Get a value from an ArrayBuffer
 * @param buffer Source buffer
 * @param offset Offset in the buffer
 * @param dtype Data type
 */
function getValueFromBuffer(buffer: ArrayBuffer, offset: number, dtype: DataType): number {
    switch (dtype) {
        case 'float32':
            return new Float32Array(buffer)[offset];
        case 'float64':
            return new Float64Array(buffer)[offset];
        case 'int32':
            return new Int32Array(buffer)[offset];
        case 'int16':
            return new Int16Array(buffer)[offset];
        case 'uint8':
            return new Uint8Array(buffer)[offset];
        case 'uint16':
            return new Uint16Array(buffer)[offset];
        default:
            throw new Error(`Unsupported data type: ${dtype}`);
    }
}

/**
 * Set a value in an ArrayBuffer
 * @param buffer Target buffer
 * @param offset Offset in the buffer
 * @param value Value to set
 * @param dtype Data type
 */
function setValueInBuffer(buffer: ArrayBuffer, offset: number, value: number, dtype: DataType): void {
    switch (dtype) {
        case 'float32':
            new Float32Array(buffer)[offset] = value;
            break;
        case 'float64':
            new Float64Array(buffer)[offset] = value;
            break;
        case 'int32':
            new Int32Array(buffer)[offset] = value;
            break;
        case 'int16':
            new Int16Array(buffer)[offset] = value;
            break;
        case 'uint8':
            new Uint8Array(buffer)[offset] = value;
            break;
        case 'uint16':
            new Uint16Array(buffer)[offset] = value;
            break;
        default:
            throw new Error(`Unsupported data type: ${dtype}`);
    }
}

/**
 * Shape utils implementation
 */
export const shapeUtils = {
    /**
     * Check if two shapes are compatible for broadcasting
     * @param shape1 First shape
     * @param shape2 Second shape
     */
    areBroadcastable(shape1: Shape, shape2: Shape): boolean {
        const len1 = shape1.length;
        const len2 = shape2.length;
        const maxLen = Math.max(len1, len2);

        for (let i = 0; i < maxLen; i++) {
            const dim1 = i < len1 ? shape1[len1 - i - 1] : 1;
            const dim2 = i < len2 ? shape2[len2 - i - 1] : 1;

            if (dim1 !== 1 && dim2 !== 1 && dim1 !== dim2) {
                return false;
            }
        }
        return true;
    },

    /**
     * Get the resulting shape after broadcasting
     * @param shape1 First shape
     * @param shape2 Second shape
     */
    broadcastShapes(shape1: Shape, shape2: Shape): Shape {
        if (!this.areBroadcastable(shape1, shape2)) {
            throw new Error(`Cannot broadcast shapes [${shape1}] and [${shape2}]`);
        }

        const len1 = shape1.length;
        const len2 = shape2.length;
        const maxLen = Math.max(len1, len2);
        const result = new Array(maxLen);

        for (let i = 0; i < maxLen; i++) {
            const dim1 = i < len1 ? shape1[len1 - i - 1] : 1;
            const dim2 = i < len2 ? shape2[len2 - i - 1] : 1;
            result[maxLen - i - 1] = Math.max(dim1, dim2);
        }

        return result;
    },

    /**
     * Calculate strides for a given shape
     * @param shape Tensor shape
     */
    calculateStrides(shape: Shape): number[] {
        return calculateStrides(shape);
    },

    /**
     * Get total size of a tensor with the given shape
     * @param shape Tensor shape
     */
    calculateSize(shape: Shape): number {
        return calculateSize(shape);
    },

    /**
     * Reshape a tensor to a new shape
     * @param tensor Tensor to reshape
     * @param newShape New shape
     */
    reshape(tensor: Tensor, newShape: Shape): Tensor {
        if (tensor instanceof TensorImpl) {
            return tensor.reshape(newShape);
        }
        // Handle non-TensorImpl instances
        const newSize = calculateSize(newShape);
        if (newSize !== tensor.size) {
            throw new Error(`Cannot reshape tensor of size ${tensor.size} to shape [${newShape}] with size ${newSize}`);
        }

        // Create a new tensor with the desired shape
        const values = new Array(tensor.size);
        for (let i = 0; i < tensor.size; i++) {
            const idx = getIndicesToOffset(i, tensor.strides, tensor.shape);
            values[i] = tensor.get(...idx);
        }

        return createTensor({
            dtype: tensor.dtype,
            shape: newShape,
            values
        });
    },

    /**
     * Validate that a shape is legitimate
     * @param shape Shape to validate
     */
    validateShape(shape: Shape): boolean {
        if (!Array.isArray(shape)) {
            return false;
        }

        for (let i = 0; i < shape.length; i++) {
            const dim = shape[i];
            if (!Number.isInteger(dim) || dim < 0) {
                return false;
            }
        }

        return true;
    }
};

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
 * Track performance of tensor operations
 * @param start Start time in milliseconds
 * @param opType Operation type
 * @param tensor Result tensor
 * @param inputs Input tensors
 * @param params Operation parameters
 * @param fromCache Whether the result was from cache
 */
export function trackPerformance(
    start: number,
    opType: TensorOpType,
    tensor: Tensor,
    inputs: { [name: string]: Tensor },
    params?: Record<string, any>,
    fromCache: boolean = false
): TensorOpResult {
    const end = globalThis.performance.now();
    const executionTime = end - start;

    // Estimate memory usage (very simplistic)
    const sizeInBytes = tensor.size * (tensor.dtype === 'float64' ? 8 : 4);

    const perfMetrics: TensorOpPerformance = {
        executionTime,
        memoryUsed: sizeInBytes,
        fromCache,
        computationalComplexity: estimateComplexity(opType, tensor, inputs),
        device: 'cpu' // For now, we only support CPU
    };

    return {
        tensor,
        opType,
        performance: perfMetrics,
        inputs,
        params
    };
}

/**
 * Estimate computational complexity of an operation
 * @param opType Operation type
 * @param result Result tensor
 * @param inputs Input tensors
 */
function estimateComplexity(
    opType: TensorOpType,
    result: Tensor,
    inputs: { [name: string]: Tensor }
): string {
    switch (opType) {
        case TensorOpType.MATMUL:
            return 'O(n³)';
        case TensorOpType.ADD:
        case TensorOpType.SUBTRACT:
        case TensorOpType.MULTIPLY:
        case TensorOpType.DIVIDE:
        case TensorOpType.EXP:
        case TensorOpType.LOG:
        case TensorOpType.SIGMOID:
        case TensorOpType.TANH:
        case TensorOpType.RELU:
            return 'O(n)';
        case TensorOpType.TRANSPOSE:
            return 'O(n²)';
        case TensorOpType.SOFTMAX:
            return 'O(n log n)';
        default:
            return 'O(n)';
    }
}
