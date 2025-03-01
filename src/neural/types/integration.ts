/**
 * Neural Computation Framework Integration Types
 *
 * This file defines the integration points between the Neural Computation Framework
 * and existing systems (Vector DB, Pattern System, Event System, etc.)
 */

import { Tensor } from './tensor';
import { ComputationNode, ComputationGraph, ExecutionResult } from './computation';
import { Vector, VectorMetadata } from '../../../src/types/vector-knowledge';
import { NeuralPattern, PatternMatchResult } from '../../../src/types/neural-patterns';
import { BaseEvent } from '../../../src/types/events';

/**
 * Integration with the Vector Knowledge System
 */
export interface VectorSystemBridge {
    /**
     * Convert a vector to a tensor
     * @param vector The vector to convert
     * @param metadata Optional metadata to include
     */
    vectorToTensor(vector: Vector, metadata?: VectorMetadata): Tensor;

    /**
     * Convert a tensor to a vector
     * @param tensor The tensor to convert
     */
    tensorToVector(tensor: Tensor): Vector;

    /**
     * Perform a vector query using the neural computation framework
     * @param queryTensor The query tensor
     * @param options Query options
     */
    queryWithTensor(
        queryTensor: Tensor,
        options?: {
            namespace?: string;
            topK?: number;
            filter?: Record<string, any>;
            includeMetadata?: boolean;
        }
    ): Promise<Array<{ vector: Vector; tensor: Tensor; score: number; metadata?: VectorMetadata }>>;

    /**
     * Store a tensor in the vector database
     * @param tensor The tensor to store
     * @param metadata Associated metadata
     */
    storeTensor(tensor: Tensor, metadata: VectorMetadata): Promise<string>;

    /**
     * Retrieve tensors from the vector database
     * @param ids Vector IDs to retrieve
     */
    retrieveTensors(ids: string[]): Promise<Map<string, Tensor>>;

    /**
     * Update vector metadata while preserving the association with tensors
     * @param id Vector ID
     * @param metadata New metadata
     */
    updateVectorMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<void>;
}

/**
 * Integration with the Neural Pattern System
 */
export interface PatternSystemBridge {
    /**
     * Apply neural patterns to optimize a computation graph
     * @param graph The computation graph to optimize
     * @param confidenceThreshold Minimum confidence threshold for pattern application
     */
    optimizeWithPatterns(
        graph: ComputationGraph,
        confidenceThreshold?: number
    ): Promise<ComputationGraph>;

    /**
     * Detect patterns in a computation graph
     * @param graph The graph to analyze
     */
    detectPatternsInGraph(graph: ComputationGraph): Promise<PatternMatchResult[]>;

    /**
     * Convert a neural pattern to a computation subgraph
     * @param pattern The pattern to convert
     */
    patternToComputation(pattern: NeuralPattern): ComputationGraph;

    /**
     * Extract a pattern from a computation subgraph
     * @param graph The graph to analyze
     * @param nodeIds Nodes to include in the pattern
     */
    extractPatternFromComputation(
        graph: ComputationGraph,
        nodeIds: string[]
    ): Promise<NeuralPattern>;

    /**
     * Learn from execution results to improve future pattern detection
     * @param graph The graph that was executed
     * @param result The execution result
     */
    learnFromExecution(graph: ComputationGraph, result: ExecutionResult): Promise<void>;

    /**
     * Get patterns relevant to a specific computation node
     * @param node The node to find patterns for
     */
    getPatternsForNode(node: ComputationNode): Promise<NeuralPattern[]>;
}

/**
 * Integration with the Event System
 */
export interface EventSystemBridge {
    /**
     * Emit an event related to neural computation
     * @param eventType Type of event
     * @param payload Event payload
     */
    emitComputationEvent<T = any>(
        eventType: string,
        payload: T
    ): Promise<void>;

    /**
     * Subscribe to neural computation events
     * @param eventType Type of event to listen for
     * @param handler Event handler function
     */
    subscribeToComputationEvents<T = any>(
        eventType: string,
        handler: (event: BaseEvent) => void
    ): () => void;

    /**
     * Convert a computation event to a system event
     * @param eventType Type of computation event
     * @param payload Computation event payload
     */
    mapToSystemEvent<T = any, R = any>(
        eventType: string,
        payload: T
    ): BaseEvent;

    /**
     * Create a computation event handler that responds to system events
     * @param systemEventType Type of system event to listen for
     * @param handler Handler function for computation events
     */
    createSystemEventHandler<T = any>(
        systemEventType: string,
        handler: (payload: T, context: any) => Promise<void>
    ): void;
}

/**
 * Integration with the Knowledge Graph
 */
export interface KnowledgeGraphBridge {
    /**
     * Store computation results in the knowledge graph
     * @param result The execution result to store
     * @param context Contextual information about the computation
     */
    storeComputationResult(
        result: ExecutionResult,
        context: {
            purpose: string;
            domain: string;
            timestamp: Date;
            source: string;
            tags: string[];
        }
    ): Promise<string>;

    /**
     * Retrieve relevant computations from the knowledge graph
     * @param query Query parameters for relevant computations
     */
    retrieveRelevantComputations(
        query: {
            purpose?: string;
            domain?: string;
            tags?: string[];
            timeRange?: { start: Date; end: Date };
            limit?: number;
        }
    ): Promise<Array<{ result: ExecutionResult; context: any }>>;

    /**
     * Link a computation to related knowledge entities
     * @param computationId ID of the computation
     * @param entityIds IDs of the related entities
     * @param relationshipType Type of relationship
     */
    linkComputationToEntities(
        computationId: string,
        entityIds: string[],
        relationshipType: string
    ): Promise<void>;

    /**
     * Get knowledge entities related to a computation
     * @param computationId ID of the computation
     * @param relationshipTypes Types of relationships to include
     */
    getRelatedEntities(
        computationId: string,
        relationshipTypes?: string[]
    ): Promise<Array<{ entity: any; relationshipType: string }>>;
}

/**
 * Integration with the Monitoring System
 */
export interface MonitoringBridge {
    /**
     * Record performance metrics for a neural computation
     * @param metrics Performance metrics to record
     */
    recordPerformanceMetrics(metrics: {
        operationType: string;
        executionTimeMs: number;
        memoryUsageBytes: number;
        deviceType: 'cpu' | 'gpu';
        cacheHit: boolean;
        timestamp: Date;
        nodeCount?: number;
        operationCount?: number;
        inputSizes?: number[];
        outputSizes?: number[];
    }): void;

    /**
     * Record resource usage for the neural computation engine
     * @param usage Resource usage to record
     */
    recordResourceUsage(usage: {
        cpuUsagePercent: number;
        memoryUsageBytes: number;
        gpuUsagePercent?: number;
        gpuMemoryUsageBytes?: number;
        activeTensors: number;
        cacheSize: number;
        timestamp: Date;
    }): void;

    /**
     * Start a monitoring session for a computation
     * @param name Name of the computation
     * @param metadata Additional metadata for the session
     */
    startComputationSession(
        name: string,
        metadata?: Record<string, any>
    ): { sessionId: string; startTime: Date };

    /**
     * End a monitoring session
     * @param sessionId ID of the session to end
     * @param result Result of the computation
     */
    endComputationSession(
        sessionId: string,
        result: {
            success: boolean;
            executionTimeMs: number;
            error?: Error;
            metrics?: Record<string, any>;
        }
    ): void;

    /**
     * Record an error that occurred during computation
     * @param error The error that occurred
     * @param context Context of the error
     */
    recordComputationError(
        error: Error,
        context: {
            operationType?: string;
            nodeId?: string;
            inputs?: any[];
            attempt?: number;
            timestamp: Date;
        }
    ): void;

    /**
     * Get aggregated performance metrics
     * @param timeRange Time range to get metrics for
     * @param groupBy Dimension to group metrics by
     */
    getAggregatedMetrics(
        timeRange: { start: Date; end: Date },
        groupBy?: 'operationType' | 'deviceType' | 'hour' | 'day'
    ): Promise<Array<{ key: string; metrics: Record<string, number> }>>;
}

/**
 * Unified bridge to all integrated systems
 */
export interface SystemBridge {
    /** Vector system integration */
    vector: VectorSystemBridge;

    /** Pattern system integration */
    pattern: PatternSystemBridge;

    /** Event system integration */
    event: EventSystemBridge;

    /** Knowledge graph integration */
    knowledge: KnowledgeGraphBridge;

    /** Monitoring system integration */
    monitoring: MonitoringBridge;

    /** Initialize all system bridges */
    initialize(): Promise<void>;

    /** Check if all systems are available */
    checkAvailability(): Promise<Record<string, boolean>>;

    /** Get system statistics */
    getStatistics(): Promise<Record<string, any>>;
}
