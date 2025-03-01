import { Pattern, PatternType } from './patterns';
import { Logger } from '../utils/logger';
import { NeuralPatternDetector } from './neural-patterns';

/**
 * Pattern detector interface
 */
export interface PatternDetector {
    detect(data: unknown): Promise<Pattern[]>;
    analyze(pattern: Pattern): Promise<PatternAnalysis>;
    learn(result: PatternResult): Promise<void>;
    suggest(context: unknown): Promise<Pattern[]>;
}

/**
 * Pattern matcher interface
 */
export interface PatternMatcher {
    match(data: unknown, patterns: Pattern[]): Promise<Pattern[]>;
    score(data: unknown, pattern: Pattern): Promise<number>;
    validate(pattern: Pattern): Promise<boolean>;
}

/**
 * Pattern learner interface
 */
export interface PatternLearner {
    learn(pattern: Pattern): Promise<void>;
    improve(pattern: Pattern): Promise<Pattern>;
    evolve(pattern: Pattern): Promise<Pattern>;
    validate(pattern: Pattern): Promise<boolean>;
}

/**
 * Pattern optimizer interface
 */
export interface PatternOptimizer {
    analyze(pattern: Pattern): Promise<PatternAnalysis>;
    suggest(pattern: Pattern): Promise<string[]>;
    optimize(pattern: Pattern): Promise<Pattern>;
}

/**
 * Pattern repository interface
 */
export interface PatternRepository {
    save(pattern: Pattern): Promise<void>;
    get(id: string): Promise<Pattern | null>;
    find(query: PatternQuery): Promise<Pattern[]>;
    delete(id: string): Promise<void>;
}

/**
 * Pattern query interface
 */
export interface PatternQuery {
    confidence?: {
        min?: number;
        max?: number;
    };
    impact?: {
        min?: number;
        max?: number;
    };
    type?: PatternType;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

/**
 * Pattern analysis interface
 */
export interface PatternAnalysis {
    pattern: Pattern;
    metrics: {
        frequency: number;
        impact: number;
        confidence: number;
        reliability: number;
        efficiency: number;
        complexity: number;
    };
    insights: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        risks: string[];
    };
    suggestions: string[];
}

/**
 * Pattern result interface
 */
export interface PatternResult {
    pattern: Pattern;
    success: boolean;
    metrics: {
        executionTime: number;
        resourceUsage: number;
        accuracy: number;
        precision: number;
        recall: number;
    };
}

/**
 * Workflow pattern interface
 */
export interface WorkflowPattern extends Pattern {
    type: PatternType;
    steps: Array<{
        id: string;
        name: string;
        type: string;
        dependencies: string[];
    }>;
    estimatedDuration: number;
    successRate: number;
    bottlenecks: string[];
    optimizations: string[];
}

/**
 * Integration pattern interface
 */
export interface IntegrationPattern extends Pattern {
    type: PatternType;
    source: string;
    target: string;
    protocol: string;
    mapping: Record<string, string>;
    transformations: string[];
}

/**
 * Temporal pattern interface
 */
export interface TemporalPattern extends Pattern {
    type: PatternType;
    schedule: string;
    frequency: string;
    duration: number;
    dependencies: string[];
    constraints: string[];
}

/**
 * Predictive pattern interface
 */
export interface PredictivePattern extends Pattern {
    type: PatternType;
    model: string;
    features: string[];
    accuracy: number;
    confidence: number;
    thresholds: Record<string, number>;
}
