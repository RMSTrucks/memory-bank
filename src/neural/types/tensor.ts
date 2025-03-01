/**
 * Tensor Types
 *
 * This file defines the core data structures for tensor operations in the
 * Neural Computation Framework.
 */

/**
 * Supported numeric data types for tensor values
 */
export type DataType = 'float32' | 'float64' | 'int32' | 'int64' | 'uint8' | 'uint16' | 'int16' | 'bool';

/**
 * Shape of a tensor, represented as an array of dimensions
 * For example, a 2x3 matrix would have shape [2, 3]
 */
export type Shape = number[];

/**
 * Tensor interface representing an n-dimensional array
 */
export interface Tensor {
    /** Unique identifier for the tensor */
    id: string;

    /** Data type of the tensor elements */
    dtype: DataType;

    /** Shape of the tensor */
    shape: Shape;

    /** Raw data of the tensor */
    data: ArrayBuffer | TypedArray;

    /** Number of elements in the tensor */
    size: number;

    /** Number of dimensions in the tensor */
    rank: number;

    /** Strides for navigating the tensor */
    strides: number[];

    /** Memory management information */
    memory: {
        /** Is the tensor managed by the framework */
        managed: boolean;

        /** When the tensor was created */
        createdAt: Date;

        /** Last time the tensor was accessed */
        lastAccessed: Date;

        /** Whether the tensor is persisted in cache */
        cached: boolean;

        /** Reference count for memory management */
        refCount: number;
    };

    /** Optional metadata for the tensor */
    metadata?: {
        /** Name of the tensor */
        name?: string;

        /** Description of the tensor */
        description?: string;

        /** Source of the tensor (e.g., computation, input) */
        source?: string;

        /** Additional key-value pairs */
        [key: string]: any;
    };

    /** Get a value at the specified indices */
    get(...indices: number[]): number;

    /** Set a value at the specified indices */
    set(value: number, ...indices: number[]): void;

    /** Reshape the tensor to a new shape */
    reshape(newShape: Shape): Tensor;

    /** Convert the tensor to a JavaScript array */
    toArray(): number[];

    /** Create a deep copy of the tensor */
    clone(): Tensor;

    /** Convert the tensor to a specific data type */
    asType(dtype: DataType): Tensor;
}

/**
 * Typed array types that can be used for tensor data
 */
export type TypedArray =
    | Float32Array
    | Float64Array
    | Int32Array
    | Int16Array
    | Uint8Array
    | Uint16Array
    | Uint32Array;

/**
 * Shape manipulation utilities
 */
export interface ShapeUtils {
    /** Check if two shapes are compatible for broadcasting */
    areBroadcastable(shape1: Shape, shape2: Shape): boolean;

    /** Get the resulting shape after broadcasting */
    broadcastShapes(shape1: Shape, shape2: Shape): Shape;

    /** Calculate strides for a given shape */
    calculateStrides(shape: Shape): number[];

    /** Get total size of a tensor with the given shape */
    calculateSize(shape: Shape): number;

    /** Reshape a tensor to a new shape */
    reshape(tensor: Tensor, newShape: Shape): Tensor;

    /** Validate that a shape is legitimate */
    validateShape(shape: Shape): boolean;
}

/**
 * Tensor creation options
 */
export interface TensorOptions {
    /** Data type of the tensor */
    dtype?: DataType;

    /** Shape of the tensor */
    shape?: Shape;

    /** Initial values for the tensor */
    values?: number[] | TypedArray;

    /** Metadata for the tensor */
    metadata?: Record<string, any>;

    /** Whether the tensor should be cached */
    cached?: boolean;

    /** Device to store the tensor on */
    device?: 'cpu' | 'gpu';
}

/**
 * Configuration for tensor operations
 */
export interface TensorOperationsConfig {
    /** Default data type for new tensors */
    defaultDtype: DataType;

    /** Whether to validate shapes in operations */
    validateShapes: boolean;

    /** Whether to cache intermediate results */
    cacheIntermediates: boolean;

    /** Maximum cache size in bytes */
    maxCacheSize: number;

    /** Precision for floating point comparisons */
    epsilon: number;

    /** Whether to use WebGL acceleration when available */
    useWebGLAcceleration: boolean;

    /** Whether to parallelize operations where possible */
    parallelizeOperations: boolean;
}

/**
 * Performance metrics for tensor operations
 */
export interface TensorOpPerformance {
    /** Time taken for the operation in milliseconds */
    executionTime: number;

    /** Memory used by the operation in bytes */
    memoryUsed: number;

    /** Whether the result was served from cache */
    fromCache: boolean;

    /** Complexity of the operation (e.g., O(n), O(n²)) */
    computationalComplexity: string;

    /** Device used for the operation */
    device: 'cpu' | 'gpu';
}

/**
 * Types of tensor operations
 */
export enum TensorOpType {
    ADD = 'add',
    SUBTRACT = 'subtract',
    MULTIPLY = 'multiply',
    DIVIDE = 'divide',
    MATMUL = 'matmul',
    TRANSPOSE = 'transpose',
    RESHAPE = 'reshape',
    CONCAT = 'concatenate',
    SLICE = 'slice',
    EXP = 'exp',
    LOG = 'log',
    POW = 'pow',
    SQRT = 'sqrt',
    SUM = 'sum',
    MEAN = 'mean',
    MAX = 'max',
    MIN = 'min',
    ARGMAX = 'argmax',
    ARGMIN = 'argmin',
    SIGMOID = 'sigmoid',
    TANH = 'tanh',
    RELU = 'relu',
    LEAKY_RELU = 'leaky_relu',
    ELU = 'elu',
    GELU = 'gelu',
    SWISH = 'swish',
    SOFTMAX = 'softmax',
    BATCH_NORM = 'batch_norm',
    LAYER_NORM = 'layer_norm',
    INSTANCE_NORM = 'instance_norm',
    GROUP_NORM = 'group_norm',
    DROPOUT = 'dropout',
    CONV2D = 'conv2d',
    MAX_POOL2D = 'max_pool2d',
    AVG_POOL2D = 'avg_pool2d'
}

/**
 * Result of a tensor operation, including performance metrics
 */
export interface TensorOpResult {
    /** The resulting tensor */
    tensor: Tensor;

    /** Type of operation performed */
    opType: TensorOpType;

    /** Performance metrics of the operation */
    performance: TensorOpPerformance;

    /** Input tensors for the operation */
    inputs: {
        [name: string]: Tensor;
    };

    /** Operation-specific parameters */
    params?: Record<string, any>;
}

/**
 * Tensor cache configuration
 */
export interface TensorCacheConfig {
    /** Maximum size of the cache in bytes */
    maxSize: number;

    /** Cache eviction policy */
    evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'priority';

    /** Time-to-live for cached tensors in milliseconds */
    ttl: number;

    /** Enable predictive caching of likely-to-be-used tensors */
    predictiveCaching: boolean;

    /** Whether to cache tensors by default */
    cacheByDefault: boolean;
}
