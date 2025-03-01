/**
 * Computation Types
 *
 * This file defines the types for the Dynamic Computation Graph,
 * which enables efficient tensor operations with automatic differentiation.
 */

import { Tensor, TensorOpType, TensorOpPerformance } from './tensor';

/**
 * Unique identifier for computation nodes
 */
export type NodeId = string;

/**
 * Node in the computation graph
 */
export interface ComputationNode {
    /** Unique identifier for the node */
    id: NodeId;

    /** Type of operation this node represents */
    opType: TensorOpType | 'input' | 'constant' | 'variable' | 'output';

    /** Inputs to this node (references to other nodes) */
    inputs: NodeId[];

    /** Output tensors from this node */
    output: Tensor | null;

    /** Gradient tensors for backpropagation */
    gradient?: Tensor | null;

    /** Whether this node's value is cached */
    cached: boolean;

    /** Whether this node requires gradients for backpropagation */
    requiresGrad: boolean;

    /** Parameters for the operation */
    params?: Record<string, any>;

    /** Performance metrics for this node's execution */
    performance?: TensorOpPerformance;

    /** Metadata for this node */
    metadata?: {
        /** Human-readable name */
        name?: string;

        /** Description of the node's purpose */
        description?: string;

        /** When the node was created */
        createdAt: Date;

        /** When the node was last executed */
        lastExecuted?: Date;

        /** Source of the node (e.g., layer name in neural network) */
        source?: string;

        /** Fused operations for this node */
        fusedOperations?: NodeId[];

        /** Additional metadata */
        [key: string]: any;
    };
}

/**
 * Edge connecting two nodes in the computation graph
 */
export interface ComputationEdge {
    /** Source node ID */
    from: NodeId;

    /** Destination node ID */
    to: NodeId;

    /** Optional weight or importance of this edge */
    weight?: number;

    /** Whether this edge carries gradients for backpropagation */
    gradientEdge: boolean;
}

/**
 * Dynamic Computation Graph
 */
export interface ComputationGraph {
    /** All nodes in the graph */
    nodes: Map<NodeId, ComputationNode>;

    /** All edges in the graph */
    edges: ComputationEdge[];

    /** Input nodes of the graph */
    inputs: NodeId[];

    /** Output nodes of the graph */
    outputs: NodeId[];

    /** Variable nodes that can be optimized */
    variables: NodeId[];

    /** Constant nodes (static values) */
    constants: NodeId[];

    /** Whether the graph is currently executing */
    isExecuting: boolean;

    /** Whether the graph is currently computing gradients */
    isComputingGradients: boolean;

    /** Graph execution metadata */
    metadata: {
        /** When the graph was created */
        createdAt: Date;

        /** Last time the graph was executed */
        lastExecuted?: Date;

        /** Number of executions */
        executionCount: number;

        /** Execution time statistics */
        executionStats: {
            /** Average execution time in milliseconds */
            averageTime: number;

            /** Minimum execution time in milliseconds */
            minTime: number;

            /** Maximum execution time in milliseconds */
            maxTime: number;

            /** Total execution time in milliseconds */
            totalTime: number;
        };
    };

    /**
     * Create an input node in the graph
     * @param tensor Input tensor
     * @param name Optional name for the node
     * @param requiresGrad Whether the input requires gradients
     */
    input(tensor: Tensor, name?: string, requiresGrad?: boolean): NodeId;

    /**
     * Create a constant node in the graph
     * @param tensor Constant tensor
     * @param name Optional name for the node
     */
    constant(tensor: Tensor, name?: string): NodeId;

    /**
     * Create a variable node in the graph
     * @param tensor Variable tensor
     * @param name Optional name for the node
     */
    variable(tensor: Tensor, name?: string): NodeId;

    /**
     * Add an operation node to the graph
     * @param opType Operation type
     * @param inputIds Input node IDs
     * @param params Operation parameters
     * @param name Optional name for the node
     * @param requiresGrad Whether the operation requires gradients
     */
    operation(
        opType: TensorOpType,
        inputIds: NodeId[],
        params?: Record<string, any>,
        name?: string,
        requiresGrad?: boolean
    ): NodeId;

    /**
     * Mark a node as an output of the graph
     * @param nodeId Node ID to mark as output
     */
    markOutput(nodeId: NodeId): void;

    /**
     * Get a node by ID
     * @param nodeId Node ID
     */
    getNode(nodeId: NodeId): ComputationNode;

    /**
     * Get a node by name
     * @param name Node name
     */
    getNodeByName(name: string): ComputationNode;

    /**
     * Get output tensor from a node
     * @param nodeId Node ID
     */
    getOutput(nodeId: NodeId): Tensor;

    /**
     * Get gradient tensor from a node
     * @param nodeId Node ID
     */
    getGradient(nodeId: NodeId): Tensor | null | undefined;

    /**
     * Execute the graph
     * @param options Execution options
     */
    execute(options?: Partial<ExecutionOptions>): ExecutionResult;
}

/**
 * Operation function that creates a new node in the computation graph
 */
export type OperationFn = (
    inputs: Tensor[],
    params?: Record<string, any>
) => ComputationNode;

/**
 * Options for computation graph execution
 */
export interface ExecutionOptions {
    /** Whether to use cached values where available */
    useCached: boolean;

    /** Whether to cache the results */
    cacheResults: boolean;

    /** Whether to compute gradients */
    computeGradients: boolean;

    /** Whether to optimize for memory usage */
    optimizeMemory: boolean;

    /** Execute operations asynchronously when possible */
    async: boolean;

    /** Device to execute on */
    device?: 'cpu' | 'gpu';

    /** Node execution priority function */
    priorityFn?: (node: ComputationNode) => number;

    /** Additional execution parameters */
    executionParams?: Record<string, any>;
}

/**
 * Result of a graph execution
 */
export interface ExecutionResult {
    /** Map of output nodes to their tensors */
    outputs: Map<NodeId, Tensor>;

    /** Map of nodes to their gradients (if computed) */
    gradients?: Map<NodeId, Tensor>;

    /** Performance information */
    performance: {
        /** Total execution time in milliseconds */
        executionTime: number;

        /** Time spent computing forward pass */
        forwardTime: number;

        /** Time spent computing gradients */
        backwardTime?: number;

        /** Memory usage in bytes */
        memoryUsed: number;

        /** Percentage of operations that used cached values */
        cacheHitRate: number;

        /** Number of operations executed */
        operationsExecuted: number;
    };

    /** Execution log for debugging */
    executionLog?: string[];
}

/**
 * Execution strategy for the computation graph
 */
export enum ExecutionStrategy {
    /** Execute the graph in topological order */
    TOPOLOGICAL = 'topological',

    /** Execute the graph eagerly as operations are added */
    EAGER = 'eager',

    /** Execute only what's needed for requested outputs */
    LAZY = 'lazy',

    /** Execute operations in parallel where possible */
    PARALLEL = 'parallel'
}

/**
 * Memory management strategy for the computation graph
 */
export enum MemoryStrategy {
    /** Keep all intermediate tensors in memory */
    KEEP_ALL = 'keep_all',

    /** Free tensors as soon as they're no longer needed */
    AGGRESSIVE_FREE = 'aggressive_free',

    /** Recompute tensors instead of storing them */
    RECOMPUTE = 'recompute',

    /** Balance keeping and recomputing based on memory pressure */
    ADAPTIVE = 'adaptive'
}

/**
 * Computation graph optimizer for improving execution efficiency
 */
export interface GraphOptimizer {
    /** Name of the optimizer */
    name: string;

    /** Optimize the computation graph */
    optimize(graph: ComputationGraph): ComputationGraph;

    /** Get performance metrics from the optimizer */
    getMetrics(): {
        /** Number of nodes removed */
        nodesRemoved: number;

        /** Number of nodes added */
        nodesAdded: number;

        /** Number of edges removed */
        edgesRemoved: number;

        /** Number of edges added */
        edgesAdded: number;

        /** Estimated memory saved in bytes */
        estimatedMemorySaved: number;

        /** Estimated speedup factor */
        estimatedSpeedup: number;
    };
}

/**
 * Built-in graph optimizations
 */
export enum GraphOptimization {
    /** Eliminate common subexpressions */
    COMMON_SUBEXPRESSION_ELIMINATION = 'common_subexpression_elimination',

    /** Combine multiple operations into one when possible */
    OPERATION_FUSION = 'operation_fusion',

    /** Eliminate unnecessary operations */
    DEAD_CODE_ELIMINATION = 'dead_code_elimination',

    /** Rearrange operations to minimize memory usage */
    MEMORY_OPTIMIZATION = 'memory_optimization',

    /** Rearrange operations to enable parallelism */
    PARALLELIZE_OPERATIONS = 'parallelize_operations'
}

/**
 * Hook into computation graph execution lifecycle
 */
export interface ExecutionHook {
    /** Called before graph execution */
    beforeExecution?: (graph: ComputationGraph, options: ExecutionOptions) => void;

    /** Called after graph execution */
    afterExecution?: (graph: ComputationGraph, result: ExecutionResult) => void;

    /** Called before a node is executed */
    beforeNodeExecution?: (node: ComputationNode) => void;

    /** Called after a node is executed */
    afterNodeExecution?: (node: ComputationNode, output: Tensor) => void;

    /** Called when an error occurs during execution */
    onError?: (error: Error, node?: ComputationNode) => void;
}

/**
 * Profile information for computation graph execution
 */
export interface ExecutionProfile {
    /** Start time of execution */
    startTime: Date;

    /** End time of execution */
    endTime: Date;

    /** Total execution time in milliseconds */
    totalTime: number;

    /** Memory usage before execution in bytes */
    initialMemory: number;

    /** Peak memory usage during execution in bytes */
    peakMemory: number;

    /** Final memory usage after execution in bytes */
    finalMemory: number;

    /** Per-node execution times in milliseconds */
    nodeExecutionTimes: Map<NodeId, number>;

    /** Per-node memory usage in bytes */
    nodeMemoryUsage: Map<NodeId, number>;

    /** Total cache hits during execution */
    cacheHits: number;

    /** Total cache misses during execution */
    cacheMisses: number;

    /** Number of operations executed */
    operationsExecuted: number;

    /** Number of tensors created */
    tensorsCreated: number;

    /** Number of tensors freed */
    tensorsFreed: number;
}

/**
 * Auto-differentiation mode
 */
export enum AutogradMode {
    /** No gradients are computed */
    NONE = 'none',

    /** Gradients are computed for all variables */
    ALL = 'all',

    /** Gradients are computed only for specified variables */
    SELECTIVE = 'selective'
}

/**
 * Result of gradient computation
 */
export interface GradientResult {
    /** Map of node IDs to their gradient tensors */
    gradients: Map<NodeId, Tensor>;

    /** Performance information */
    performance: {
        /** Total time spent computing gradients in milliseconds */
        backwardTime: number;

        /** Memory used for gradient computation in bytes */
        memoryUsed: number;

        /** Number of gradient operations executed */
        operationsExecuted: number;
    };
}

/**
 * Fused operation information
 */
export interface FusedOperation {
    /** ID of the operation node */
    nodeId: NodeId;

    /** Type of operation */
    opType: TensorOpType;

    /** Parameters for the operation */
    params?: Record<string, any>;
}
