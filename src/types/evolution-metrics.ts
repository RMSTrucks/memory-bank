import { EventEmitter } from 'events';

/**
 * Represents the quality metrics for pattern evolution
 */
export interface QualityMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confidence: number;
}

/**
 * Represents performance metrics for pattern evolution
 */
export interface PerformanceMetrics {
    executionTime: number;
    memoryUsage: number;
    cpuUtilization: number;
    latency: number;
    throughput: number;
}

/**
 * Represents stability metrics for pattern evolution
 */
export interface StabilityMetrics {
    errorRate: number;
    failureRate: number;
    recoveryTime: number;
    uptime: number;
    reliability: number;
}

/**
 * Represents evolution metrics for pattern changes
 */
export interface EvolutionMetrics {
    generationCount: number;
    mutationRate: number;
    selectionPressure: number;
    adaptationRate: number;
    convergenceRate: number;
}

/**
 * Represents validation metrics for pattern evolution
 */
export interface ValidationMetrics {
    validationScore: number;
    coverageRate: number;
    errorMargin: number;
    confidenceInterval: {
        min: number;
        max: number;
    };
    stabilityScore: number;
}

/**
 * Represents the complete set of metrics for pattern evolution
 */
export interface PatternEvolutionMetrics {
    quality: QualityMetrics;
    performance: PerformanceMetrics;
    stability: StabilityMetrics;
    evolution: EvolutionMetrics;
    validation: ValidationMetrics;
    timestamp: Date;
}

/**
 * Events emitted during pattern evolution
 */
export interface EvolutionEvents {
    'evolution.started': (patternId: string) => void;
    'evolution.progress': (patternId: string, progress: number) => void;
    'evolution.completed': (patternId: string, metrics: PatternEvolutionMetrics) => void;
    'evolution.failed': (patternId: string, error: Error) => void;
    'metrics.updated': (patternId: string, metrics: PatternEvolutionMetrics) => void;
    'quality.threshold': (patternId: string, metrics: QualityMetrics) => void;
    'performance.degraded': (patternId: string, metrics: PerformanceMetrics) => void;
    'stability.warning': (patternId: string, metrics: StabilityMetrics) => void;
}

/**
 * Extended EventEmitter for evolution events
 */
export interface EvolutionEventEmitter extends EventEmitter {
    on<K extends keyof EvolutionEvents>(
        event: K,
        listener: EvolutionEvents[K]
    ): this;
    emit<K extends keyof EvolutionEvents>(
        event: K,
        ...args: Parameters<EvolutionEvents[K]>
    ): boolean;
}

/**
 * Configuration options for pattern evolution
 */
export interface EvolutionConfig {
    qualityThresholds: {
        minAccuracy: number;
        minPrecision: number;
        minRecall: number;
        minF1Score: number;
        minConfidence: number;
    };
    performanceThresholds: {
        maxExecutionTime: number;
        maxMemoryUsage: number;
        maxCpuUtilization: number;
        maxLatency: number;
        minThroughput: number;
    };
    stabilityThresholds: {
        maxErrorRate: number;
        maxFailureRate: number;
        maxRecoveryTime: number;
        minUptime: number;
        minReliability: number;
    };
    evolutionParameters: {
        maxGenerations: number;
        targetMutationRate: number;
        selectionPressure: number;
        adaptationRate: number;
        convergenceThreshold: number;
    };
    validationThresholds: {
        minValidationScore: number;
        minCoverageRate: number;
        maxErrorMargin: number;
        confidenceInterval: {
            min: number;
            max: number;
        };
        minStabilityScore: number;
    };
}

/**
 * Result of a pattern evolution operation
 */
export interface EvolutionResult {
    success: boolean;
    metrics: PatternEvolutionMetrics;
    changes: Array<{
        type: string;
        description: string;
        impact: {
            quality: Partial<QualityMetrics>;
            performance: Partial<PerformanceMetrics>;
            stability: Partial<StabilityMetrics>;
        };
    }>;
    warnings: string[];
    errors: string[];
}

/**
 * Status of pattern evolution
 */
export interface EvolutionStatus {
    state: 'idle' | 'evolving' | 'validating' | 'failed' | 'completed';
    progress: number;
    currentGeneration: number;
    currentMetrics: PatternEvolutionMetrics;
    startTime: Date;
    lastUpdate: Date;
    error?: Error;
}
