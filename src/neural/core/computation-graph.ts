/**
 * Computation Graph Implementation
 *
 * This file implements the dynamic computation graph for the Neural Computation Framework.
 * It provides functionality for building, executing, and optimizing computation graphs.
 */

import { v4 as uuidv4 } from 'uuid';
import {
    ComputationEdge,
    ComputationGraph,
    ComputationNode,
    ExecutionHook,
    ExecutionOptions,
    ExecutionProfile,
    ExecutionResult,
    ExecutionStrategy,
    GraphOptimization,
    GraphOptimizer,
    MemoryStrategy,
    NodeId,
    OperationFn,
    AutogradMode,
    GradientResult,
    FusedOperation
} from '../types/computation';
import { Tensor, TensorOpType, TensorOpResult } from '../types/tensor';
import { createTensor, shapeUtils } from './tensor';
import * as ops from './operations';
import { getGradientFunction } from './gradients';

/**
 * Default execution options
 */
const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
    useCached: true,
    cacheResults: true,
    computeGradients: false,
    optimizeMemory: true,
    async: false,
    device: 'cpu',
    priorityFn: (node) => 0, // Default priority
    executionParams: {}
};

/**
 * Implementation of the Computation Graph
 */
export class ComputationGraphImpl implements ComputationGraph {
    nodes: Map<NodeId, ComputationNode>;
    edges: ComputationEdge[];
    inputs: NodeId[];
    outputs: NodeId[];
    variables: NodeId[];
    constants: NodeId[];
    isExecuting: boolean;
    isComputingGradients: boolean;
    metadata: {
        createdAt: Date;
        lastExecuted?: Date;
        executionCount: number;
        executionStats: {
            averageTime: number;
            minTime: number;
            maxTime: number;
            totalTime: number;
        };
    };

    // Additional properties for graph management
    private nodeNameMap: Map<string, NodeId>;
    private executionHooks: ExecutionHook[];
    private executionStrategy: ExecutionStrategy;
    private memoryStrategy: MemoryStrategy;
    private optimizers: GraphOptimizer[];
    private autogradMode: AutogradMode;
    private fusedOperations: Map<NodeId, FusedOperation[]>;
    private nodeDependencies: Map<NodeId, Set<NodeId>>;

    /**
     * Create a new computation graph
     */
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.inputs = [];
        this.outputs = [];
        this.variables = [];
        this.constants = [];
        this.isExecuting = false;
        this.isComputingGradients = false;
        this.metadata = {
            createdAt: new Date(),
            executionCount: 0,
            executionStats: {
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0,
                totalTime: 0
            }
        };

        // Initialize additional properties
        this.nodeNameMap = new Map();
        this.executionHooks = [];
        this.executionStrategy = ExecutionStrategy.TOPOLOGICAL;
        this.memoryStrategy = MemoryStrategy.KEEP_ALL;
        this.optimizers = [];
        this.autogradMode = AutogradMode.NONE;
        this.fusedOperations = new Map();
        this.nodeDependencies = new Map();
    }

    /**
     * Create an input node in the graph
     * @param tensor Input tensor
     * @param name Optional name for the node
     * @param requiresGrad Whether the input requires gradients
     */
    input(tensor: Tensor, name?: string, requiresGrad: boolean = false): NodeId {
        const id = uuidv4();
        const node: ComputationNode = {
            id,
            opType: 'input',
            inputs: [],
            output: tensor,
            gradient: requiresGrad ? null : undefined,
            cached: true,
            requiresGrad,
            metadata: {
                name,
                description: 'Input tensor',
                createdAt: new Date()
            }
        };

        this.nodes.set(id, node);
        this.inputs.push(id);

        if (name) {
            this.nodeNameMap.set(name, id);
        }

        return id;
    }

    /**
     * Create a constant node in the graph
     * @param tensor Constant tensor
     * @param name Optional name for the node
     */
    constant(tensor: Tensor, name?: string): NodeId {
        const id = uuidv4();
        const node: ComputationNode = {
            id,
            opType: 'constant',
            inputs: [],
            output: tensor,
            cached: true,
            requiresGrad: false,
            metadata: {
                name,
                description: 'Constant tensor',
                createdAt: new Date()
            }
        };

        this.nodes.set(id, node);
        this.constants.push(id);

        if (name) {
            this.nodeNameMap.set(name, id);
        }

        return id;
    }

    /**
     * Create a variable node in the graph
     * @param tensor Variable tensor
     * @param name Optional name for the node
     */
    variable(tensor: Tensor, name?: string): NodeId {
        const id = uuidv4();
        const node: ComputationNode = {
            id,
            opType: 'variable',
            inputs: [],
            output: tensor,
            gradient: null,
            cached: true,
            requiresGrad: true,
            metadata: {
                name,
                description: 'Variable tensor',
                createdAt: new Date()
            }
        };

        this.nodes.set(id, node);
        this.variables.push(id);

        if (name) {
            this.nodeNameMap.set(name, id);
        }

        return id;
    }

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
        requiresGrad: boolean = true
    ): NodeId {
        // Validate inputs
        for (const inputId of inputIds) {
            if (!this.nodes.has(inputId)) {
                throw new Error(`Node with ID ${inputId} not found in the graph`);
            }
        }

        const id = uuidv4();
        const node: ComputationNode = {
            id,
            opType,
            inputs: inputIds,
            output: null,
            gradient: requiresGrad ? null : undefined,
            cached: false,
            requiresGrad,
            params,
            metadata: {
                name,
                description: `Operation: ${opType}`,
                createdAt: new Date()
            }
        };

        this.nodes.set(id, node);

        // Add edges
        for (const inputId of inputIds) {
            this.edges.push({
                from: inputId,
                to: id,
                gradientEdge: requiresGrad,
            });

            // Track dependencies for lazy evaluation
            if (!this.nodeDependencies.has(inputId)) {
                this.nodeDependencies.set(inputId, new Set<NodeId>());
            }
            this.nodeDependencies.get(inputId)!.add(id);
        }

        if (name) {
            this.nodeNameMap.set(name, id);
        }

        return id;
    }

    /**
     * Mark a node as an output
     * @param nodeId Node ID
     */
    markOutput(nodeId: NodeId): void {
        if (!this.outputs.includes(nodeId)) {
            this.outputs.push(nodeId);
        }
    }

    /**
     * Reset all gradients in the graph
     */
    resetGradients(): void {
        for (const nodeId of this.nodes.keys()) {
            const node = this.nodes.get(nodeId)!;
            node.gradient = null;
        }
    }

    /**
     * Get a node by ID
     * @param nodeId Node ID
     */
    getNode(nodeId: NodeId): ComputationNode {
        const node = this.nodes.get(nodeId);
        if (!node) {
            throw new Error(`Node with ID ${nodeId} not found in the graph`);
        }
        return node;
    }

    /**
     * Get a node by name
     * @param name Node name
     */
    getNodeByName(name: string): ComputationNode {
        const nodeId = this.nodeNameMap.get(name);
        if (!nodeId) {
            throw new Error(`Node with name ${name} not found in the graph`);
        }
        return this.getNode(nodeId);
    }

    /**
     * Get output tensor from a node
     * @param nodeId Node ID
     */
    getOutput(nodeId: NodeId): Tensor {
        const node = this.getNode(nodeId);
        if (!node.output) {
            throw new Error(`Node ${nodeId} has no output tensor`);
        }
        return node.output;
    }

    /**
     * Get gradient tensor from a node
     * @param nodeId Node ID
     */
    getGradient(nodeId: NodeId): Tensor | null {
        const node = this.getNode(nodeId);
        return node.gradient as Tensor | null;
    }

    /**
     * Add an execution hook
     * @param hook Execution hook
     */
    addExecutionHook(hook: ExecutionHook): void {
        this.executionHooks.push(hook);
    }

    /**
     * Remove an execution hook
     * @param hook Execution hook to remove
     */
    removeExecutionHook(hook: ExecutionHook): void {
        const index = this.executionHooks.indexOf(hook);
        if (index !== -1) {
            this.executionHooks.splice(index, 1);
        }
    }

    /**
     * Set the execution strategy
     * @param strategy Execution strategy
     */
    setExecutionStrategy(strategy: ExecutionStrategy): void {
        this.executionStrategy = strategy;
    }

    /**
     * Set the memory management strategy
     * @param strategy Memory management strategy
     */
    setMemoryStrategy(strategy: MemoryStrategy): void {
        this.memoryStrategy = strategy;
    }

    /**
     * Add a graph optimizer
     * @param optimizer Graph optimizer
     */
    addOptimizer(optimizer: GraphOptimizer): void {
        this.optimizers.push(optimizer);
    }

    /**
     * Set the automatic differentiation mode
     * @param mode Automatic differentiation mode
     */
    setAutogradMode(mode: AutogradMode): void {
        this.autogradMode = mode;
    }

    /**
     * Execute the graph
     * @param options Execution options
     */
    execute(options: Partial<ExecutionOptions> = {}): ExecutionResult {
        // Merge options with defaults
        const execOptions: ExecutionOptions = {
            ...DEFAULT_EXECUTION_OPTIONS,
            ...options
        };

        // Start execution
        this.isExecuting = true;
        const startTime = globalThis.performance.now();

        // Call beforeExecution hooks
        for (const hook of this.executionHooks) {
            if (hook.beforeExecution) {
                hook.beforeExecution(this, execOptions);
            }
        }

        try {
            // Optimize the graph if needed
            if (this.optimizers.length > 0) {
                this.optimizeGraph();
            }

            // Determine execution order
            const executionOrder = this.determineExecutionOrder(execOptions);

            // Execute nodes in order
            const outputs = new Map<NodeId, Tensor>();
            const executionLog: string[] = [];
            let forwardTime = 0;

            // Forward pass
            const forwardStartTime = globalThis.performance.now();
            for (const nodeId of executionOrder) {
                const node = this.getNode(nodeId);

                // Call beforeNodeExecution hooks
                for (const hook of this.executionHooks) {
                    if (hook.beforeNodeExecution) {
                        hook.beforeNodeExecution(node);
                    }
                }

                // Execute the node
                this.executeNode(node, execOptions);

                // Call afterNodeExecution hooks
                for (const hook of this.executionHooks) {
                    if (hook.afterNodeExecution && node.output) {
                        hook.afterNodeExecution(node, node.output);
                    }
                }

                // Add to outputs if this is an output node
                if (this.outputs.includes(nodeId) && node.output) {
                    outputs.set(nodeId, node.output);
                }

                // Add to execution log
                executionLog.push(`Executed node ${nodeId} (${node.opType})`);
            }
            forwardTime = globalThis.performance.now() - forwardStartTime;

            // Backward pass if needed
            let gradients: Map<NodeId, Tensor> | undefined;
            let backwardTime: number | undefined;

            if (execOptions.computeGradients) {
                const backwardStartTime = globalThis.performance.now();
                const gradientResult = this.computeGradients(executionOrder);
                gradients = gradientResult.gradients;
                backwardTime = globalThis.performance.now() - backwardStartTime;
            }

            // Calculate performance metrics
            const endTime = globalThis.performance.now();
            const executionTime = endTime - startTime;

            // Update graph metadata
            this.metadata.lastExecuted = new Date();
            this.metadata.executionCount++;
            this.metadata.executionStats.totalTime += executionTime;
            this.metadata.executionStats.minTime = Math.min(this.metadata.executionStats.minTime, executionTime);
            this.metadata.executionStats.maxTime = Math.max(this.metadata.executionStats.maxTime, executionTime);
            this.metadata.executionStats.averageTime = this.metadata.executionStats.totalTime / this.metadata.executionCount;

            // Calculate cache hit rate
            const cacheHits = executionOrder.filter(id => {
                const node = this.getNode(id);
                return node.cached && node.output !== null;
            }).length;
            const cacheHitRate = executionOrder.length > 0 ? cacheHits / executionOrder.length : 0;

            // Create execution result
            const result: ExecutionResult = {
                outputs,
                gradients,
                performance: {
                    executionTime,
                    forwardTime,
                    backwardTime,
                    memoryUsed: this.estimateMemoryUsage(),
                    cacheHitRate,
                    operationsExecuted: executionOrder.length
                },
                executionLog
            };

            // Call afterExecution hooks
            for (const hook of this.executionHooks) {
                if (hook.afterExecution) {
                    hook.afterExecution(this, result);
                }
            }

            return result;
        } catch (error) {
            // Call onError hooks
            for (const hook of this.executionHooks) {
                if (hook.onError) {
                    hook.onError(error as Error);
                }
            }
            throw error;
        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * Compute gradients for the graph
     * @param executionOrder Order of nodes from forward pass
     */
    private computeGradients(executionOrder: NodeId[]): GradientResult {
        this.isComputingGradients = true;
        const startTime = globalThis.performance.now();

        try {
            // Initialize gradients for output nodes
            for (const outputId of this.outputs) {
                const node = this.getNode(outputId);
                if (node.requiresGrad && node.output) {
                    // Initialize with ones of the same shape
                    node.gradient = createTensor({
                        shape: node.output.shape,
                        dtype: node.output.dtype,
                        values: new Array(node.output.size).fill(1)
                    });
                }
            }

            // Backward pass in reverse order
            const gradients = new Map<NodeId, Tensor>();
            const reverseOrder = [...executionOrder].reverse();

            for (const nodeId of reverseOrder) {
                const node = this.getNode(nodeId);

                // Skip nodes that don't require gradients
                if (!node.requiresGrad || !node.gradient) {
                    continue;
                }

                // Add to gradients map
                gradients.set(nodeId, node.gradient);

                // Propagate gradients to inputs
                this.propagateGradients(node);
            }

            // Calculate performance metrics
            const endTime = globalThis.performance.now();
            const backwardTime = endTime - startTime;

            return {
                gradients,
                performance: {
                    backwardTime,
                    memoryUsed: this.estimateMemoryUsage(),
                    operationsExecuted: reverseOrder.length
                }
            };
        } finally {
            this.isComputingGradients = false;
        }
    }

    /**
     * Optimize the graph based on registered optimizers
     */
    private optimizeGraph(): void {
        if (this.optimizers.length === 0) {
            return;
        }

        // Apply each optimizer in order
        for (const optimizer of this.optimizers) {
            optimizer.optimize(this);
        }

        // Update dependencies after optimization
        this.updateDependencies();
    }

    /**
     * Determine the execution order of nodes based on the execution strategy
     * @param options Execution options
     */
    private determineExecutionOrder(options: ExecutionOptions): NodeId[] {
        switch (this.executionStrategy) {
            case ExecutionStrategy.TOPOLOGICAL:
                return this.topologicalSort();
            case ExecutionStrategy.EAGER:
                // For eager execution, we still need a valid order
                return this.topologicalSort();
            case ExecutionStrategy.LAZY:
                return this.lazyEvaluationOrder();
            case ExecutionStrategy.PARALLEL:
                // For parallel execution, we still need a valid order
                return this.topologicalSort();
            default:
                return this.topologicalSort();
        }
    }

    /**
     * Execute a single node
     * @param node Node to execute
     * @param options Execution options
     */
    private executeNode(node: ComputationNode, options: ExecutionOptions): void {
        // Skip if already cached and using cache
        if (node.cached && node.output !== null && options.useCached) {
            return;
        }

        // Skip input, constant, and variable nodes (they already have outputs)
        if (node.opType === 'input' || node.opType === 'constant' || node.opType === 'variable') {
            return;
        }

        // Get input tensors
        const inputTensors = node.inputs.map(id => this.getOutput(id));

        // Execute operation based on type
        let result: TensorOpResult;

        switch (node.opType) {
            case TensorOpType.ADD:
                result = ops.add(inputTensors[0], inputTensors[1]);
                break;
            case TensorOpType.SUBTRACT:
                result = ops.subtract(inputTensors[0], inputTensors[1]);
                break;
            case TensorOpType.MULTIPLY:
                result = ops.multiply(inputTensors[0], inputTensors[1]);
                break;
            case TensorOpType.DIVIDE:
                result = ops.divide(inputTensors[0], inputTensors[1]);
                break;
            case TensorOpType.MATMUL:
                result = ops.matmul(inputTensors[0], inputTensors[1]);
                break;
            case TensorOpType.TRANSPOSE:
                result = ops.transpose(inputTensors[0]);
                break;
            case TensorOpType.EXP:
                result = ops.exp(inputTensors[0]);
                break;
            case TensorOpType.LOG:
                result = ops.log(inputTensors[0]);
                break;
            case TensorOpType.SIGMOID:
                result = ops.sigmoid(inputTensors[0]);
                break;
            case TensorOpType.TANH:
                result = ops.tanh(inputTensors[0]);
                break;
            case TensorOpType.RELU:
                result = ops.relu(inputTensors[0]);
                break;
            case TensorOpType.SOFTMAX:
                result = ops.softmax(inputTensors[0]);
                break;
            case TensorOpType.SUM:
                if (node.params && typeof node.params === 'object') {
                    const axes = Array.isArray(node.params.axes) ? node.params.axes : undefined;
                    const keepDims = typeof node.params.keepDims === 'boolean' ? node.params.keepDims : false;
                    result = ops.sum(inputTensors[0], axes, keepDims);
                } else {
                    result = ops.sum(inputTensors[0]);
                }
                break;
            case TensorOpType.MEAN:
                if (node.params && typeof node.params === 'object') {
                    const axes = Array.isArray(node.params.axes) ? node.params.axes : undefined;
                    const keepDims = typeof node.params.keepDims === 'boolean' ? node.params.keepDims : false;
                    result = ops.mean(inputTensors[0], axes, keepDims);
                } else {
                    result = ops.mean(inputTensors[0]);
                }
                break;
            case TensorOpType.MAX:
                if (node.params && typeof node.params === 'object') {
                    const axes = Array.isArray(node.params.axes) ? node.params.axes : undefined;
                    const keepDims = typeof node.params.keepDims === 'boolean' ? node.params.keepDims : false;
                    result = ops.max(inputTensors[0], axes, keepDims);
                } else {
                    result = ops.max(inputTensors[0]);
                }
                break;
            case TensorOpType.MIN:
                if (node.params && typeof node.params === 'object') {
                    const axes = Array.isArray(node.params.axes) ? node.params.axes : undefined;
                    const keepDims = typeof node.params.keepDims === 'boolean' ? node.params.keepDims : false;
                    result = ops.min(inputTensors[0], axes, keepDims);
                } else {
                    result = ops.min(inputTensors[0]);
                }
                break;
            default:
                throw new Error(`Unsupported operation type: ${node.opType}`);
        }

        // Store the result
        node.output = result.tensor;
        node.cached = options.cacheResults;
    }

    /**
     * Perform a topological sort of the graph
     */
    private topologicalSort(): NodeId[] {
        const visited = new Set<NodeId>();
        const temp = new Set<NodeId>();
        const order: NodeId[] = [];

        // Visit function for DFS
        const visit = (nodeId: string): void => {
            // Skip if already visited
            if (visited.has(nodeId)) {
                return;
            }

            // Check for cycles
            if (temp.has(nodeId)) {
                throw new Error('Cycle detected in computation graph');
            }

            // Mark as temporarily visited
            temp.add(nodeId);

            // Visit all dependencies
            const outgoingEdges = this.edges.filter(edge => edge.from === nodeId);
            for (const edge of outgoingEdges) {
                visit(edge.to);
            }

            // Mark as visited
            temp.delete(nodeId);
            visited.add(nodeId);
            order.unshift(nodeId);
        };

        // Visit all nodes
        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                visit(nodeId);
            }
        }

        return order;
    }

    /**
     * Sort nodes by priority
     * @param priorityFn Function to determine node priority
     */
    private prioritySort(priorityFn: (node: ComputationNode) => number): NodeId[] {
        // First get a valid topological ordering
        const topOrder = this.topologicalSort();

        // Then sort by priority within topological constraints
        const nodeWithPriority = topOrder.map(id => ({
            id,
            priority: priorityFn(this.getNode(id))
        }));

        // Sort by priority (higher priority first)
        nodeWithPriority.sort((a, b) => b.priority - a.priority);

        return nodeWithPriority.map(n => n.id);
    }

    /**
     * Determine execution order for lazy evaluation
     */
    private lazyEvaluationOrder(): NodeId[] {
        // Start with output nodes
        const order: NodeId[] = [];
        const visited = new Set<NodeId>();

        // Helper function to add a node and its dependencies
        const addNodeAndDependencies = (nodeId: string): void => {
            if (visited.has(nodeId)) {
                return;
            }

            // Add dependencies first
            const node = this.getNode(nodeId);
            for (const inputId of node.inputs) {
                addNodeAndDependencies(inputId);
            }

            // Add this node
            if (!visited.has(nodeId)) {
                order.push(nodeId);
                visited.add(nodeId);
            }
        };

        // Add all output nodes and their dependencies
        for (const outputId of this.outputs) {
            addNodeAndDependencies(outputId);
        }

        return order;
    }

    /**
     * Update node dependencies after graph modifications
     */
    private updateDependencies(): void {
        // Clear existing dependencies
        this.nodeDependencies.clear();

        // Rebuild dependencies from edges
        for (const edge of this.edges) {
            if (!this.nodeDependencies.has(edge.from)) {
                this.nodeDependencies.set(edge.from, new Set<NodeId>());
            }
            this.nodeDependencies.get(edge.from)!.add(edge.to);
        }
    }

    /**
     * Get bytes per element for a given data type
     * @param dtype Data type
     */
    private bytesPerElement(dtype: string): number {
        switch (dtype) {
            case 'float32':
                return 4;
            case 'float64':
                return 8;
            case 'int32':
                return 4;
            case 'int16':
                return 2;
            case 'int8':
                return 1;
            case 'uint8':
                return 1;
            case 'bool':
                return 1;
            default:
                return 4; // Default to float32
        }
    }

    /**
     * Estimate memory usage of the graph
     */
    private estimateMemoryUsage(): number {
        let totalMemory = 0;

        // Estimate memory for each node's output tensor
        for (const node of this.nodes.values()) {
            if (node.output) {
                // Estimate based on tensor size and data type
                const bytesPerElement = this.bytesPerElement(node.output.dtype);
                totalMemory += node.output.size * bytesPerElement;
            }

            // Add memory for gradient if present
            if (node.gradient) {
                const bytesPerElement = this.bytesPerElement(node.gradient.dtype);
                totalMemory += node.gradient.size * bytesPerElement;
            }
        }

        return totalMemory;
    }

/**
 * Propagate gradients from a node to its inputs
 * @param node Node to propagate gradients from
 */
private propagateGradients(node: ComputationNode): void {
  // Skip if no gradient
  if (!node.gradient) {
    return;
  }

  // Skip input, constant, and variable nodes
  if (node.opType === 'input' || node.opType === 'constant' || node.opType === 'variable') {
    return;
  }

  // Get input nodes
  const inputNodes = node.inputs.map(id => this.getNode(id));

  // Get input tensors
  const inputTensors = inputNodes.map(n => n.output!);

  // Get gradient function for this operation
  const gradFn = getGradientFunction(node.opType as TensorOpType);
  if (!gradFn) {
    console.warn(`No gradient function for operation type: ${node.opType}`);
    return;
  }

  try {
    // Call gradient function with appropriate arguments
    let inputGradients: Tensor | Tensor[];

    // Handle different operation types
    switch (node.opType) {
      case TensorOpType.ADD:
      case TensorOpType.SUBTRACT:
      case TensorOpType.MULTIPLY:
      case TensorOpType.DIVIDE:
      case TensorOpType.MATMUL:
        // Binary operations
        inputGradients = gradFn(node.gradient, inputTensors[0], inputTensors[1]);
        break;

      case TensorOpType.TRANSPOSE:
      case TensorOpType.LOG:
      case TensorOpType.RELU:
        // Unary operations without output
        inputGradients = gradFn(node.gradient, inputTensors[0]);
        break;

      case TensorOpType.EXP:
      case TensorOpType.SIGMOID:
      case TensorOpType.TANH:
        // Unary operations that need output
        inputGradients = gradFn(node.gradient, inputTensors[0], node.output!);
        break;

      case TensorOpType.SOFTMAX:
        // Operations with parameters
        inputGradients = gradFn(
          node.gradient,
          inputTensors[0],
          node.output!,
          node.params?.axis
        );
        break;

      case TensorOpType.SUM:
      case TensorOpType.MEAN:
      case TensorOpType.MAX:
      case TensorOpType.MIN:
        // Reduction operations
        inputGradients = gradFn(
          node.gradient,
          inputTensors[0],
          node.params?.axes,
          node.params?.keepDims
        );
        break;

      default:
        console.warn(`Unsupported operation type for gradient: ${node.opType}`);
        return;
    }

    // Distribute gradients to input nodes
    if (Array.isArray(inputGradients)) {
      // Multiple gradients (e.g., binary operations)
      for (let i = 0; i < inputNodes.length; i++) {
        // Skip nodes that don't require gradients
        if (!inputNodes[i].requiresGrad) continue;

        const gradient = inputGradients[i];
        if (!gradient) continue; // Skip null/undefined gradients

        this.accumulateGradient(inputNodes[i], gradient);
      }
    } else {
      // Single gradient (e.g., unary operations)
      // Skip if the input node doesn't require gradients
      if (!inputNodes[0].requiresGrad) return;

      // Skip null/undefined gradients
      if (!inputGradients) return;

      this.accumulateGradient(inputNodes[0], inputGradients);
    }
  } catch (error) {
    console.error(`Error computing gradients for ${node.opType}:`, error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error(`Stack trace: ${error.stack}`);
    }
  }
}

/**
 * Accumulate gradient for a node
 * @param node Node to accumulate gradient for
 * @param gradient Gradient to accumulate
 */
private accumulateGradient(node: ComputationNode, gradient: Tensor): void {
  // If node doesn't have a gradient yet, set it directly
  if (!node.gradient) {
    node.gradient = gradient;
    return;
  }

  try {
    // Validate shapes before accumulating
    if (!this.validateGradientShapes(node.gradient, gradient)) {
      console.warn(`Shape mismatch in gradient accumulation for node ${node.id}`);
      return;
    }

    // Accumulate gradients
    const result = ops.add(node.gradient, gradient);
    node.gradient = result.tensor;
  } catch (error) {
    console.error(`Error accumulating gradient for node ${node.id}:`, error);
  }
}

/**
 * Validate that two tensors have compatible shapes for addition
 * @param a First tensor
 * @param b Second tensor
 */
private validateGradientShapes(a: Tensor, b: Tensor): boolean {
  // Check if shapes are exactly the same
  if (a.shape.length === b.shape.length) {
    return a.shape.every((dim, i) => dim === b.shape[i]);
  }

  // If shapes are different, check if they are broadcastable
  // Broadcasting rules (simplified version of NumPy's rules):
  // 1. If the two arrays differ in their number of dimensions, the shape of the array
  //    with fewer dimensions is padded with ones on its leading (left) side.
  // 2. If the shape of the two arrays does not match in any dimension, the array with
  //    shape equal to 1 in that dimension is stretched to match the other shape.
  // 3. If in any dimension the sizes disagree and neither is equal to 1, an error is raised.

  // First, ensure a has more dimensions than b (swap if needed)
  let shapeA = [...a.shape];
  let shapeB = [...b.shape];

  if (shapeA.length < shapeB.length) {
    // Swap a and b
    [shapeA, shapeB] = [shapeB, shapeA];
  }

  // Pad shapeB with ones on the left
  while (shapeB.length < shapeA.length) {
    shapeB.unshift(1);
  }

  // Check if the shapes are broadcastable
  for (let i = 0; i < shapeA.length; i++) {
    if (shapeA[i] !== shapeB[i] && shapeA[i] !== 1 && shapeB[i] !== 1) {
      return false;
    }
  }

  return true;
}

/**
 * Get the broadcasted shape of two tensors
 * @param a First tensor
 * @param b Second tensor
 */
private getBroadcastedShape(a: Tensor, b: Tensor): number[] {
  // Ensure a has more dimensions than b (swap if needed)
  let shapeA = [...a.shape];
  let shapeB = [...b.shape];

  if (shapeA.length < shapeB.length) {
    // Swap a and b
    [shapeA, shapeB] = [shapeB, shapeA];
  }

  // Pad shapeB with ones on the left
  while (shapeB.length < shapeA.length) {
    shapeB.unshift(1);
  }

  // Calculate the broadcasted shape
  const broadcastedShape = [];
  for (let i = 0; i < shapeA.length; i++) {
    broadcastedShape.push(Math.max(shapeA[i], shapeB[i]));
  }

  return broadcastedShape;
}
}
