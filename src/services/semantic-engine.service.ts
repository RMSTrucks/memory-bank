import {
    SemanticVector,
    SemanticRelationship,
    SemanticContext,
    SemanticOperation,
    ValidationResult,
    ValidationOptions,
    DEFAULT_VALIDATION_OPTIONS,
    SEMANTIC_CONSTRAINTS,
    SemanticError,
    ValidationError,
    ConsistencyError
} from '../types/semantic';
import { OpenAIService } from './openai.service';
import { VectorService } from './vector.service';
import { EventBus } from './event-bus.service';
import { Logger } from '../utils/logger';

export class SemanticEngineService {
    private readonly logger = new Logger('SemanticEngine');
    private operationHistory: SemanticOperation[] = [];

    constructor(
        private openai: OpenAIService,
        private vectorService: VectorService,
        private eventBus: EventBus
    ) {}

    /**
     * Create a new semantic vector with enhanced context
     */
    async createSemanticVector(
        content: string,
        type: SemanticVector['context']['semanticType'],
        options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
    ): Promise<SemanticVector> {
        try {
            // Generate embedding with OpenAI
            const embedding = await this.openai.embed(content);

            // Create semantic context
            const context = await this.generateContext(content, type);

            // Create the semantic vector
            const vector: SemanticVector = {
                id: crypto.randomUUID(),
                embedding,
                context,
                validation: {
                    lastValidated: new Date(),
                    validationScore: 1.0,
                    validationErrors: [],
                    consistencyCheck: true
                }
            };

            // Validate the vector
            const validationResult = await this.validateVector(vector, options);
            if (!validationResult.isValid) {
                throw new ValidationError('Vector validation failed', validationResult);
            }

            // Store operation
            const operation: SemanticOperation = {
                type: 'create',
                targetId: vector.id,
                changes: vector,
                validation: validationResult,
                timestamp: new Date()
            };
            this.operationHistory.push(operation);

            // Emit event
            this.eventBus.emit('semanticVector.created', { vector, operation });

            return vector;
        } catch (error) {
            this.logger.error('Failed to create semantic vector', error);
            throw error;
        }
    }

    /**
     * Generate semantic context for content
     */
    private async generateContext(
        content: string,
        type: SemanticVector['context']['semanticType']
    ): Promise<SemanticVector['context']> {
        // Use OpenAI to analyze content and generate context
        const analysis = await this.openai.analyze(content);

        return {
            source: 'semantic-engine',
            relationships: [],
            confidence: analysis.data.content.quality,
            semanticType: type,
            metadata: {
                temporal: {
                    created: new Date(),
                    updated: new Date(),
                    version: 1
                },
                spatial: {
                    namespace: 'semantic-space',
                    scope: 'local',
                    adjacentNodes: []
                },
                conceptual: {
                    category: analysis.data.content.suggestions,
                    abstraction: 'concrete',
                    complexity: 0.5,
                    certainty: analysis.data.content.quality,
                    stability: 0.8,
                    maturity: 0.5
                },
                tags: analysis.data.content.suggestions,
                source: 'semantic-analysis',
                confidence: analysis.data.content.quality
            }
        };
    }

    /**
     * Validate a semantic vector
     */
    async validateVector(
        vector: SemanticVector,
        options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
    ): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate basic structure
        if (!vector.id || !vector.embedding || !vector.context) {
            errors.push('Invalid vector structure');
        }

        // Validate embedding
        if (options.validateEmbeddings && (!Array.isArray(vector.embedding) || vector.embedding.length === 0)) {
            errors.push('Invalid embedding');
        }

        // Validate relationships
        if (options.validateRelationships) {
            if (vector.context.relationships.length > SEMANTIC_CONSTRAINTS.MAX_RELATIONSHIPS_PER_VECTOR) {
                errors.push(`Too many relationships: ${vector.context.relationships.length}`);
            }

            for (const rel of vector.context.relationships) {
                if (rel.strength < options.thresholds.relationshipStrength) {
                    warnings.push(`Weak relationship: ${rel.sourceId} -> ${rel.targetId}`);
                }
            }
        }

        // Validate metadata
        if (options.validateMetadata) {
            if (vector.context.confidence < options.thresholds.confidence) {
                warnings.push(`Low confidence: ${vector.context.confidence}`);
            }

            const age = Date.now() - vector.context.metadata.temporal.created.getTime();
            const maxAge = SEMANTIC_CONSTRAINTS.MAX_VECTOR_AGE_DAYS * 24 * 60 * 60 * 1000;
            if (age > maxAge) {
                warnings.push('Vector exceeds maximum age');
            }
        }

        // Calculate validation score
        const score = errors.length === 0 ?
            1 - (warnings.length * 0.1) :
            0;

        const result: ValidationResult = {
            isValid: errors.length === 0 && score >= options.thresholds.validationScore,
            score,
            errors,
            warnings,
            metadata: {
                timestamp: new Date(),
                validator: 'semantic-engine',
                validationType: options.level
            }
        };

        // Update vector validation info
        vector.validation = {
            lastValidated: new Date(),
            validationScore: score,
            validationErrors: errors,
            consistencyCheck: result.isValid
        };

        return result;
    }

    /**
     * Find semantically similar vectors
     */
    async findSimilarVectors(
        vector: SemanticVector,
        threshold = SEMANTIC_CONSTRAINTS.MERGE_THRESHOLD
    ): Promise<SemanticVector[]> {
        return this.vectorService.findSimilar(vector.embedding, threshold);
    }

    /**
     * Create a semantic relationship between vectors
     */
    async createRelationship(
        source: SemanticVector,
        target: SemanticVector,
        type: string,
        strength = 0.5
    ): Promise<SemanticRelationship> {
        const relationship: SemanticRelationship = {
            type,
            sourceId: source.id,
            targetId: target.id,
            strength,
            bidirectional: false,
            metadata: {
                temporal: {
                    created: new Date(),
                    updated: new Date(),
                    version: 1
                },
                spatial: {
                    namespace: 'semantic-space',
                    scope: 'local',
                    adjacentNodes: []
                },
                conceptual: {
                    category: [],
                    abstraction: 'concrete',
                    complexity: 0.5,
                    certainty: strength,
                    stability: 0.8,
                    maturity: 0.5
                },
                tags: [],
                source: 'semantic-engine',
                confidence: strength
            },
            properties: {}
        };

        // Add relationship to vectors
        source.context.relationships.push(relationship);
        if (relationship.bidirectional) {
            target.context.relationships.push({
                ...relationship,
                sourceId: target.id,
                targetId: source.id
            });
        }

        // Emit event
        this.eventBus.emit('semanticRelationship.created', { relationship });

        return relationship;
    }

    /**
     * Get operation history for a vector
     */
    getOperationHistory(vectorId: string): SemanticOperation[] {
        return this.operationHistory.filter(op => op.targetId === vectorId);
    }

    /**
     * Roll back an operation
     */
    async rollbackOperation(operation: SemanticOperation): Promise<void> {
        if (!operation.rollbackData) {
            throw new SemanticError('No rollback data available', 'ROLLBACK_ERROR');
        }

        switch (operation.type) {
            case 'create':
                // Delete the created vector
                await this.vectorService.delete(operation.targetId);
                break;
            case 'update':
                // Restore previous state
                await this.vectorService.update(operation.targetId, operation.rollbackData);
                break;
            case 'delete':
                // Restore deleted vector
                await this.vectorService.create(operation.rollbackData);
                break;
            case 'merge':
            case 'split':
                // These operations require special handling
                throw new SemanticError(
                    `Rollback not implemented for ${operation.type} operations`,
                    'ROLLBACK_ERROR'
                );
        }

        // Remove operation from history
        const index = this.operationHistory.indexOf(operation);
        if (index > -1) {
            this.operationHistory.splice(index, 1);
        }

        // Emit event
        this.eventBus.emit('semanticOperation.rolledBack', { operation });
    }
}
