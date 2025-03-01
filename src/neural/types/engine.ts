/**
 * Neural Computation Engine Configuration Types
 *
 * This file defines the configuration options for the neural computation engine,
 * including resource allocation, caching strategies, and performance settings.
 */

import { DataType, TensorCacheConfig } from './tensor';
import { ExecutionStrategy, MemoryStrategy, GraphOptimization } from './computation';

/**
 * Configuration for the neural computation engine
 */
export interface EngineConfig {
    /** Compute resource configuration */
    compute: ComputeConfig;

    /** Memory management configuration */
    memory: MemoryConfig;

    /** Caching configuration */
    cache: CacheConfig;

    /** Performance configuration */
    performance: PerformanceConfig;

    /** Logging and debugging configuration */
    logging: LoggingConfig;

    /** Integration configuration */
    integration: IntegrationConfig;

    /** Default data type for tensor operations */
    defaultDataType: DataType;

    /** Whether to validate operations before execution */
    validateOperations: boolean;

    /** Whether the engine is in debug mode */
    debug: boolean;
}

/**
 * Configuration for compute resources
 */
export interface ComputeConfig {
    /** Default device to use for computation */
    defaultDevice: 'cpu' | 'gpu' | 'auto';

    /** Maximum CPU usage percentage (0-100) */
    maxCpuUsage: number;

    /** Whether to use WebGL acceleration when available */
    useWebGL: boolean;

    /** Whether to use Web Workers for parallel computation */
    useWorkers: boolean;

    /** Maximum number of Web Workers to create */
    maxWorkers: number;

    /** Batch size for operations that support batching */
    batchSize: number;

    /** Precision for numerical operations */
    precision: 'high' | 'medium' | 'low';

    /** Whether to prioritize accuracy over speed */
    prioritizeAccuracy: boolean;

    /** Operation execution timeout in milliseconds */
    operationTimeout: number;

    /** Strategy for executing operations */
    executionStrategy: ExecutionStrategy;

    /** Device placement strategy */
    placementStrategy: 'auto' | 'performance' | 'memory' | 'balanced';

    /** Whether to allow computation fallback to CPU */
    allowFallback: boolean;
}

/**
 * Configuration for memory management
 */
export interface MemoryConfig {
    /** Maximum memory usage in bytes (0 for unlimited) */
    maxMemoryMB: number;

    /** Maximum GPU memory usage in bytes (0 for unlimited) */
    maxGpuMemoryMB: number;

    /** Memory management strategy */
    strategy: MemoryStrategy;

    /** Whether to automatically garbage collect */
    autoGarbageCollect: boolean;

    /** Memory pressure threshold (0-1) to trigger garbage collection */
    gcThreshold: number;

    /** Whether to track tensor allocations */
    trackAllocations: boolean;

    /** Whether to use reference counting for memory management */
    useRefCounting: boolean;

    /** Memory growth strategy */
    growthStrategy: 'conservative' | 'aggressive' | 'balanced';

    /** Whether to pre-allocate memory for known operations */
    preAllocate: boolean;

    /** Whether to recycle tensor buffers */
    recycleTensors: boolean;

    /** Maximum size of recycled tensor pool in bytes */
    maxRecyclePoolSizeMB: number;
}

/**
 * Configuration for caching
 */
export interface CacheConfig {
    /** Whether to enable caching */
    enabled: boolean;

    /** Tensor caching configuration */
    tensorCache: TensorCacheConfig;

    /** Whether to cache computation graph results */
    cacheGraphResults: boolean;

    /** Maximum size of graph result cache in bytes */
    graphCacheSizeMB: number;

    /** Whether to use persistent caching across sessions */
    persistentCache: boolean;

    /** Location for persistent cache */
    persistentCachePath: string;

    /** Whether to pre-warm the cache with common operations */
    preWarmCache: boolean;

    /** Time-to-live for all cached items in milliseconds */
    globalTtl: number;

    /** Policy for cache eviction when full */
    evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'random' | 'priority';

    /** Whether to automatically manage cache sizing */
    autoSizeCache: boolean;

    /** Whether to use predictive caching */
    predictiveCaching: boolean;
}

/**
 * Configuration for performance optimization
 */
export interface PerformanceConfig {
    /** Whether to enable performance optimization */
    enableOptimizations: boolean;

    /** Whether to enable automatic code fusion */
    enableCodeFusion: boolean;

    /** Whether to enable automatic layout optimization */
    enableLayoutOptimization: boolean;

    /** Whether to enable lazy execution */
    lazyExecution: boolean;

    /** Whether to enable operation batching */
    batchOperations: boolean;

    /** Graph optimizations to apply */
    graphOptimizations: GraphOptimization[];

    /** Whether to enable operation pruning */
    pruneOperations: boolean;

    /** Whether to optimize memory access patterns */
    optimizeMemoryAccess: boolean;

    /** Whether to enable just-in-time compilation */
    enableJIT: boolean;

    /** Whether to adapt execution strategy based on workload */
    adaptiveExecution: boolean;

    /** Whether to collect performance metrics */
    collectMetrics: boolean;

    /** Performance profiling level */
    profilingLevel: 'none' | 'basic' | 'detailed' | 'comprehensive';

    /** Whether to automatically tune performance settings */
    autoTune: boolean;

    /** Target optimization time balance (0 = fastest execution, 1 = lowest memory) */
    optimizationBalance: number;
}

/**
 * Configuration for logging and debugging
 */
export interface LoggingConfig {
    /** Logging level */
    level: 'none' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

    /** Whether to log performance metrics */
    logPerformance: boolean;

    /** Whether to log memory usage */
    logMemory: boolean;

    /** Whether to log tensor operations */
    logOperations: boolean;

    /** Whether to log cache operations */
    logCache: boolean;

    /** Whether to log computation graph changes */
    logGraph: boolean;

    /** Whether to enable execution visualization */
    enableVisualization: boolean;

    /** Maximum log size in bytes */
    maxLogSizeBytes: number;

    /** Whether to log to file */
    logToFile: boolean;

    /** Log file path */
    logFilePath: string;

    /** Whether to enable debug information in errors */
    verboseErrors: boolean;
}

/**
 * Configuration for integration with other systems
 */
export interface IntegrationConfig {
    /** Whether to enable event system integration */
    enableEventSystem: boolean;

    /** Event system connection options */
    eventSystem: {
        /** Event bus topic for neural operations */
        topic: string;
        /** Whether to buffer events */
        bufferEvents: boolean;
        /** Maximum buffer size */
        maxBufferSize: number;
    };

    /** Whether to enable vector system integration */
    enableVectorSystem: boolean;

    /** Vector system connection options */
    vectorSystem: {
        /** Whether to synchronize vector operations */
        syncOperations: boolean;
        /** Batch size for vector operations */
        batchSize: number;
    };

    /** Whether to enable neural pattern system integration */
    enablePatternSystem: boolean;

    /** Pattern system connection options */
    patternSystem: {
        /** Whether to apply detected patterns to optimize computations */
        applyOptimizations: boolean;
        /** Threshold for pattern confidence to apply optimizations */
        confidenceThreshold: number;
    };

    /** Whether to enable monitoring system integration */
    enableMonitoring: boolean;

    /** Monitoring system options */
    monitoring: {
        /** Metrics collection interval in milliseconds */
        metricsInterval: number;
        /** Whether to report detailed operation metrics */
        detailedMetrics: boolean;
    };
}

/**
 * Default engine configuration
 */
export const defaultEngineConfig: EngineConfig = {
    compute: {
        defaultDevice: 'auto',
        maxCpuUsage: 90,
        useWebGL: true,
        useWorkers: true,
        maxWorkers: 4,
        batchSize: 64,
        precision: 'medium',
        prioritizeAccuracy: true,
        operationTimeout: 30000,
        executionStrategy: ExecutionStrategy.LAZY,
        placementStrategy: 'balanced',
        allowFallback: true
    },
    memory: {
        maxMemoryMB: 0, // Unlimited
        maxGpuMemoryMB: 0, // Unlimited
        strategy: MemoryStrategy.ADAPTIVE,
        autoGarbageCollect: true,
        gcThreshold: 0.8,
        trackAllocations: true,
        useRefCounting: true,
        growthStrategy: 'balanced',
        preAllocate: true,
        recycleTensors: true,
        maxRecyclePoolSizeMB: 100
    },
    cache: {
        enabled: true,
        tensorCache: {
            maxSize: 100 * 1024 * 1024, // 100MB
            evictionPolicy: 'lru',
            ttl: 300000, // 5 minutes
            predictiveCaching: true,
            cacheByDefault: true
        },
        cacheGraphResults: true,
        graphCacheSizeMB: 50,
        persistentCache: false,
        persistentCachePath: './cache',
        preWarmCache: false,
        globalTtl: 600000, // 10 minutes
        evictionPolicy: 'lru',
        autoSizeCache: true,
        predictiveCaching: true
    },
    performance: {
        enableOptimizations: true,
        enableCodeFusion: true,
        enableLayoutOptimization: true,
        lazyExecution: true,
        batchOperations: true,
        graphOptimizations: [
            GraphOptimization.COMMON_SUBEXPRESSION_ELIMINATION,
            GraphOptimization.OPERATION_FUSION,
            GraphOptimization.DEAD_CODE_ELIMINATION,
            GraphOptimization.MEMORY_OPTIMIZATION
        ],
        pruneOperations: true,
        optimizeMemoryAccess: true,
        enableJIT: false,
        adaptiveExecution: true,
        collectMetrics: true,
        profilingLevel: 'basic',
        autoTune: false,
        optimizationBalance: 0.5
    },
    logging: {
        level: 'info',
        logPerformance: true,
        logMemory: true,
        logOperations: false,
        logCache: false,
        logGraph: false,
        enableVisualization: false,
        maxLogSizeBytes: 10 * 1024 * 1024, // 10MB
        logToFile: false,
        logFilePath: './logs/neural-engine.log',
        verboseErrors: true
    },
    integration: {
        enableEventSystem: true,
        eventSystem: {
            topic: 'neural.computations',
            bufferEvents: true,
            maxBufferSize: 1000
        },
        enableVectorSystem: true,
        vectorSystem: {
            syncOperations: false,
            batchSize: 32
        },
        enablePatternSystem: true,
        patternSystem: {
            applyOptimizations: true,
            confidenceThreshold: 0.8
        },
        enableMonitoring: true,
        monitoring: {
            metricsInterval: 10000, // 10 seconds
            detailedMetrics: false
        }
    },
    defaultDataType: 'float32',
    validateOperations: true,
    debug: false
};

/**
 * Resource requirements for a computation
 */
export interface ComputeResourceRequirements {
    /** Estimated memory usage in bytes */
    estimatedMemoryBytes: number;

    /** Estimated GPU memory usage in bytes */
    estimatedGpuMemoryBytes: number;

    /** Estimated computation time in milliseconds */
    estimatedComputeTimeMs: number;

    /** Required precision */
    requiredPrecision: 'high' | 'medium' | 'low';

    /** Preferred device */
    preferredDevice: 'cpu' | 'gpu' | 'any';

    /** Whether the computation is parallelizable */
    parallelizable: boolean;

    /** Resource priority (higher means more important) */
    priority: number;
}

/**
 * Resource allocation for a computation
 */
export interface ResourceAllocation {
    /** Allocated device */
    device: 'cpu' | 'gpu';

    /** Allocated memory in bytes */
    memoryBytes: number;

    /** Allocated execution workers */
    workerCount: number;

    /** Execution priority */
    priority: number;

    /** Execution mode */
    mode: 'sync' | 'async' | 'deferred';

    /** Time allocation was made */
    allocationTime: Date;

    /** Allocation expiration time */
    expirationTime?: Date;

    /** Allocation unique ID */
    id: string;
}

/**
 * Resource manager interface
 */
export interface ResourceManager {
    /** Allocate resources for a computation */
    allocate(requirements: ComputeResourceRequirements): Promise<ResourceAllocation>;

    /** Release allocated resources */
    release(allocation: ResourceAllocation): Promise<void>;

    /** Get current resource usage */
    getUsage(): Promise<ResourceUsage>;

    /** Check if resources are available */
    checkAvailability(requirements: ComputeResourceRequirements): Promise<boolean>;

    /** Reserve resources for future use */
    reserve(requirements: ComputeResourceRequirements, duration: number): Promise<ResourceAllocation>;

    /** Set resource limits */
    setLimits(limits: ResourceLimits): Promise<void>;

    /** Get current resource limits */
    getLimits(): Promise<ResourceLimits>;
}

/**
 * Current resource usage
 */
export interface ResourceUsage {
    /** CPU usage percentage (0-100) */
    cpuUsage: number;

    /** Memory usage in bytes */
    memoryUsage: number;

    /** GPU usage percentage (0-100) */
    gpuUsage: number;

    /** GPU memory usage in bytes */
    gpuMemoryUsage: number;

    /** Number of active workers */
    activeWorkers: number;

    /** Number of pending operations */
    pendingOperations: number;

    /** Current cache size in bytes */
    cacheSize: number;

    /** Time of usage measurement */
    timestamp: Date;
}

/**
 * Resource limits
 */
export interface ResourceLimits {
    /** Maximum CPU usage percentage (0-100) */
    maxCpuUsage: number;

    /** Maximum memory usage in bytes */
    maxMemoryBytes: number;

    /** Maximum GPU usage percentage (0-100) */
    maxGpuUsage: number;

    /** Maximum GPU memory usage in bytes */
    maxGpuMemoryBytes: number;

    /** Maximum number of workers */
    maxWorkers: number;

    /** Maximum number of concurrent operations */
    maxConcurrentOperations: number;

    /** Maximum cache size in bytes */
    maxCacheBytes: number;
}
