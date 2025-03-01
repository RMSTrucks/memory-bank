/**
 * Semantic types and interfaces for enhanced vector operations
 */

export interface TimeContext {
    created: Date;
    updated: Date;
    validFrom?: Date;
    validTo?: Date;
    sequence?: number;
    version: number;
}

export interface SpatialContext {
    namespace: string;
    path?: string;
    domain?: string[];
    scope: 'local' | 'global' | 'domain';
    adjacentNodes: string[];
}

export interface ConceptualContext {
    category: string[];
    abstraction: 'concrete' | 'abstract' | 'meta';
    complexity: number; // 0-1 scale
    certainty: number; // 0-1 scale
    stability: number; // 0-1 scale
    maturity: number; // 0-1 scale
}

export interface SemanticMetadata {
    temporal: TimeContext;
    spatial: SpatialContext;
    conceptual: ConceptualContext;
    tags: string[];
    source: string;
    confidence: number;
}

export interface SemanticRelationship {
    type: string;
    sourceId: string;
    targetId: string;
    strength: number; // 0-1 scale
    bidirectional: boolean;
    metadata: SemanticMetadata;
    properties: Record<string, any>;
}

export interface SemanticVector {
    id: string;
    embedding: number[];
    context: {
        source: string;
        relationships: SemanticRelationship[];
        confidence: number;
        semanticType: 'concept' | 'pattern' | 'knowledge' | 'meta';
        metadata: SemanticMetadata;
    };
    validation: {
        lastValidated: Date;
        validationScore: number;
        validationErrors: string[];
        consistencyCheck: boolean;
    };
}

export interface ValidationResult {
    isValid: boolean;
    score: number;
    errors: string[];
    warnings: string[];
    metadata: {
        timestamp: Date;
        validator: string;
        validationType: string;
    };
}

export interface SemanticOperation {
    type: 'create' | 'update' | 'delete' | 'merge' | 'split';
    targetId: string;
    changes: Partial<SemanticVector>;
    validation: ValidationResult;
    rollbackData?: SemanticVector;
    timestamp: Date;
}

export interface SemanticContext {
    vectors: SemanticVector[];
    relationships: SemanticRelationship[];
    metadata: SemanticMetadata;
    operations: SemanticOperation[];
}

// Safety thresholds and constraints
export const SEMANTIC_CONSTRAINTS = {
    MIN_CONFIDENCE: 0.6,
    MIN_RELATIONSHIP_STRENGTH: 0.4,
    MIN_VALIDATION_SCORE: 0.7,
    MAX_RELATIONSHIPS_PER_VECTOR: 1000,
    MAX_VECTOR_AGE_DAYS: 365,
    CLEANUP_THRESHOLD: 0.3,
    MERGE_THRESHOLD: 0.85,
    SPLIT_THRESHOLD: 0.2
} as const;

// Validation types
export type ValidationLevel = 'strict' | 'normal' | 'lenient';

export interface ValidationOptions {
    level: ValidationLevel;
    validateRelationships: boolean;
    validateMetadata: boolean;
    validateEmbeddings: boolean;
    thresholds: {
        confidence: number;
        relationshipStrength: number;
        validationScore: number;
    };
}

// Default validation options
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
    level: 'normal',
    validateRelationships: true,
    validateMetadata: true,
    validateEmbeddings: true,
    thresholds: {
        confidence: SEMANTIC_CONSTRAINTS.MIN_CONFIDENCE,
        relationshipStrength: SEMANTIC_CONSTRAINTS.MIN_RELATIONSHIP_STRENGTH,
        validationScore: SEMANTIC_CONSTRAINTS.MIN_VALIDATION_SCORE
    }
} as const;

// Error types
export class SemanticError extends Error {
    constructor(
        message: string,
        public code: string,
        public context?: any
    ) {
        super(message);
        this.name = 'SemanticError';
    }
}

export class ValidationError extends SemanticError {
    constructor(
        message: string,
        public validationResult: ValidationResult
    ) {
        super(message, 'VALIDATION_ERROR', validationResult);
        this.name = 'ValidationError';
    }
}

export class ConsistencyError extends SemanticError {
    constructor(
        message: string,
        public inconsistencies: string[]
    ) {
        super(message, 'CONSISTENCY_ERROR', { inconsistencies });
        this.name = 'ConsistencyError';
    }
}
