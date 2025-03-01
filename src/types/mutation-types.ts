import { PatternEvolutionMetrics } from './evolution-metrics';
import { NeuralPattern, PatternFeature, PatternRelationship } from './neural-patterns';

/**
 * Types of mutations that can be applied to patterns
 */
export type MutationType =
    | 'feature_addition'
    | 'feature_removal'
    | 'feature_modification'
    | 'relationship_addition'
    | 'relationship_removal'
    | 'relationship_modification'
    | 'confidence_adjustment'
    | 'metadata_update'
    | 'validation_update'
    | 'evolution_step';

/**
 * Base interface for all mutations
 */
export interface BaseMutation {
    id: string;
    type: MutationType;
    timestamp: Date;
    patternId: string;
    description: string;
    impact: {
        confidence: number;
        performance: number;
        relationships: number;
    };
    metadata: {
        source: string;
        reason: string;
        priority: number;
        risk: number;
    };
}

/**
 * Feature-related mutations
 */
export interface FeatureMutation extends BaseMutation {
    type: 'feature_addition' | 'feature_removal' | 'feature_modification';
    feature: PatternFeature;
    previousValue?: PatternFeature;
}

/**
 * Relationship-related mutations
 */
export interface RelationshipMutation extends BaseMutation {
    type: 'relationship_addition' | 'relationship_removal' | 'relationship_modification';
    relationship: PatternRelationship;
    previousValue?: PatternRelationship;
}

/**
 * Confidence adjustment mutation
 */
export interface ConfidenceMutation extends BaseMutation {
    type: 'confidence_adjustment';
    previousConfidence: number;
    newConfidence: number;
    reason: string;
}

/**
 * Metadata update mutation
 */
export interface MetadataMutation extends BaseMutation {
    type: 'metadata_update';
    field: string;
    previousValue: any;
    newValue: any;
}

/**
 * Validation update mutation
 */
export interface ValidationMutation extends BaseMutation {
    type: 'validation_update';
    validationResults: {
        score: number;
        issues: string[];
        metrics: PatternEvolutionMetrics;
    };
}

/**
 * Evolution step mutation
 */
export interface EvolutionMutation extends BaseMutation {
    type: 'evolution_step';
    generation: number;
    changes: Array<BaseMutation>;
    metrics: PatternEvolutionMetrics;
}

/**
 * Union type of all possible mutations
 */
export type Mutation =
    | FeatureMutation
    | RelationshipMutation
    | ConfidenceMutation
    | MetadataMutation
    | ValidationMutation
    | EvolutionMutation;

/**
 * Mutation history for a pattern
 */
export interface MutationHistory {
    patternId: string;
    mutations: Mutation[];
    metrics: {
        totalMutations: number;
        successfulMutations: number;
        failedMutations: number;
        averageImpact: {
            confidence: number;
            performance: number;
            relationships: number;
        };
    };
}

/**
 * Configuration for mutation operations
 */
export interface MutationConfig {
    maxMutationsPerGeneration: number;
    minConfidenceThreshold: number;
    maxRiskThreshold: number;
    mutationRates: {
        featureAddition: number;
        featureRemoval: number;
        featureModification: number;
        relationshipAddition: number;
        relationshipRemoval: number;
        relationshipModification: number;
        confidenceAdjustment: number;
        metadataUpdate: number;
    };
    validationThresholds: {
        minScore: number;
        maxIssues: number;
        minMetrics: PatternEvolutionMetrics;
    };
}

/**
 * Result of applying a mutation
 */
export interface MutationResult {
    success: boolean;
    mutation: Mutation;
    pattern: NeuralPattern;
    metrics: PatternEvolutionMetrics;
    validation: {
        isValid: boolean;
        score: number;
        issues: string[];
    };
    rollback?: {
        success: boolean;
        error?: Error;
    };
}

/**
 * Events emitted during mutation operations
 */
export interface MutationEvents {
    'mutation.started': (mutation: Mutation) => void;
    'mutation.completed': (result: MutationResult) => void;
    'mutation.failed': (mutation: Mutation, error: Error) => void;
    'mutation.validated': (result: MutationResult) => void;
    'mutation.rolledback': (mutation: Mutation) => void;
}
