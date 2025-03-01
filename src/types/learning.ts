import { Pattern, KnowledgeNode, Analysis } from './knowledge';

/**
 * Types for the Learning System
 */

export type LearningMode =
    | 'pattern'     // Learning from pattern detection
    | 'workflow'    // Learning from workflow execution
    | 'temporal'    // Learning from temporal relationships
    | 'efficiency'  // Learning from performance metrics
    | 'integration' // Learning from system integration
    | 'predictive'; // Learning for predictions

export interface LearningContext {
    mode: LearningMode;
    confidence: number;
    iteration: number;
    timestamp: Date;
    metadata: Record<string, unknown>;
}

export interface LearningResult {
    success: boolean;
    confidence: number;
    impact: number;
    improvements: Improvement[];
    metadata: Record<string, unknown>;
}

export interface Improvement {
    type: string;
    description: string;
    impact: number;
    confidence: number;
    applied: boolean;
    result?: LearningResult;
}

export interface PatternLearning {
    pattern: Pattern;
    frequency: number;
    confidence: number;
    impact: number;
    evolution: {
        timestamp: Date;
        confidence: number;
        impact: number;
    }[];
}

export interface WorkflowLearning {
    nodeId: string;
    patterns: PatternLearning[];
    efficiency: number;
    bottlenecks: string[];
    improvements: Improvement[];
}

export interface TemporalLearning {
    sequence: string[];
    duration: number;
    variance: number;
    dependencies: {
        source: string;
        target: string;
        strength: number;
    }[];
    optimizations: Improvement[];
}

export interface EfficiencyLearning {
    metric: string;
    current: number;
    target: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    factors: {
        name: string;
        impact: number;
    }[];
    improvements: Improvement[];
}

export interface IntegrationLearning {
    components: string[];
    interactions: {
        source: string;
        target: string;
        frequency: number;
        efficiency: number;
    }[];
    bottlenecks: string[];
    improvements: Improvement[];
}

export interface PredictiveLearning {
    context: string;
    predictions: {
        outcome: string;
        confidence: number;
        factors: string[];
    }[];
    accuracy: number;
    improvements: Improvement[];
}

export interface LearningSystem {
    // Core learning operations
    learn(context: LearningContext, data: unknown): Promise<LearningResult>;
    improve(nodeId: string, improvements: Improvement[]): Promise<LearningResult>;
    validate(result: LearningResult): Promise<boolean>;

    // Pattern learning
    learnPattern(pattern: Pattern): Promise<PatternLearning>;
    improvePattern(pattern: Pattern): Promise<Improvement[]>;
    validatePattern(pattern: Pattern): Promise<boolean>;

    // Workflow learning
    learnWorkflow(nodeId: string): Promise<WorkflowLearning>;
    improveWorkflow(nodeId: string): Promise<Improvement[]>;
    validateWorkflow(nodeId: string): Promise<boolean>;

    // Temporal learning
    learnTemporal(sequence: string[]): Promise<TemporalLearning>;
    improveTemporal(sequence: string[]): Promise<Improvement[]>;
    validateTemporal(sequence: string[]): Promise<boolean>;

    // Efficiency learning
    learnEfficiency(metric: string): Promise<EfficiencyLearning>;
    improveEfficiency(metric: string): Promise<Improvement[]>;
    validateEfficiency(metric: string): Promise<boolean>;

    // Integration learning
    learnIntegration(components: string[]): Promise<IntegrationLearning>;
    improveIntegration(components: string[]): Promise<Improvement[]>;
    validateIntegration(components: string[]): Promise<boolean>;

    // Predictive learning
    learnPredictive(context: string): Promise<PredictiveLearning>;
    improvePredictive(context: string): Promise<Improvement[]>;
    validatePredictive(context: string): Promise<boolean>;

    // Analysis operations
    analyze(nodeId: string): Promise<Analysis>;
    suggest(nodeId: string): Promise<Improvement[]>;
    validate(nodeId: string): Promise<boolean>;
}

export interface LearningMetrics {
    patterns: {
        total: number;
        confidence: number;
        impact: number;
        improvements: number;
    };
    workflows: {
        total: number;
        efficiency: number;
        bottlenecks: number;
        improvements: number;
    };
    temporal: {
        sequences: number;
        efficiency: number;
        optimizations: number;
    };
    efficiency: {
        metrics: number;
        improvements: number;
        trend: number;
    };
    integration: {
        components: number;
        interactions: number;
        bottlenecks: number;
    };
    predictive: {
        contexts: number;
        accuracy: number;
        improvements: number;
    };
}

export interface LearningConfig {
    modes: LearningMode[];
    thresholds: {
        confidence: number;
        impact: number;
        improvement: number;
    };
    intervals: {
        learning: number;
        validation: number;
        improvement: number;
    };
    limits: {
        patterns: number;
        improvements: number;
        iterations: number;
    };
}
