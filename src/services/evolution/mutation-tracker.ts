import { Logger } from '../../utils/logger';
import { EventEmitter } from 'events';
import {
    Mutation,
    MutationHistory,
    MutationResult,
    MutationConfig
} from '../../types/mutation-types';
import { NeuralPattern } from '../../types/neural-patterns';
import { PatternEvolutionMetrics } from '../../types/evolution-metrics';

/**
 * MutationTracker is responsible for tracking mutations and managing their history
 */
export class MutationTracker {
    private readonly logger = new Logger('MutationTracker');
    private readonly emitter = new EventEmitter();
    private readonly histories: Map<string, MutationHistory> = new Map();
    private readonly config: MutationConfig;

    constructor(config: MutationConfig) {
        this.config = config;
    }

    /**
     * Tracks a mutation and updates the history
     */
    trackMutation(result: MutationResult): void {
        this.logger.info('Tracking mutation', {
            patternId: result.pattern.id,
            type: result.mutation.type,
            success: result.success
        });

        const patternId = result.pattern.id;
        const history = this.getOrCreateHistory(patternId);

        // Add mutation to history
        history.mutations.push(result.mutation);

        // Update metrics
        history.metrics.totalMutations++;
        history.metrics.successfulMutations += result.success ? 1 : 0;
        history.metrics.failedMutations += result.success ? 0 : 1;

        // Update average impact
        const totalMutations = history.metrics.totalMutations;
        history.metrics.averageImpact = {
            confidence: (history.metrics.averageImpact.confidence * (totalMutations - 1) +
                result.mutation.impact.confidence) / totalMutations,
            performance: (history.metrics.averageImpact.performance * (totalMutations - 1) +
                result.mutation.impact.performance) / totalMutations,
            relationships: (history.metrics.averageImpact.relationships * (totalMutations - 1) +
                result.mutation.impact.relationships) / totalMutations
        };

        // Save updated history
        this.histories.set(patternId, history);

        // Emit event
        this.emitter.emit('mutation.tracked', result);
    }

    /**
     * Gets the mutation history for a pattern
     */
    getHistory(patternId: string): MutationHistory | undefined {
        return this.histories.get(patternId);
    }

    /**
     * Gets or creates a mutation history for a pattern
     */
    private getOrCreateHistory(patternId: string): MutationHistory {
        const existing = this.histories.get(patternId);
        if (existing) {
            return existing;
        }

        const newHistory: MutationHistory = {
            patternId,
            mutations: [],
            metrics: {
                totalMutations: 0,
                successfulMutations: 0,
                failedMutations: 0,
                averageImpact: {
                    confidence: 0,
                    performance: 0,
                    relationships: 0
                }
            }
        };

        this.histories.set(patternId, newHistory);
        return newHistory;
    }

    /**
     * Validates a mutation against the history and config
     */
    validateMutation(mutation: Mutation, pattern: NeuralPattern): boolean {
        this.logger.info('Validating mutation', {
            patternId: pattern.id,
            type: mutation.type
        });

        // Check confidence threshold
        if (pattern.confidence < this.config.minConfidenceThreshold) {
            this.logger.info('Mutation rejected: confidence below threshold', {
                confidence: pattern.confidence,
                threshold: this.config.minConfidenceThreshold
            });
            return false;
        }

        // Check risk threshold
        if (mutation.metadata.risk > this.config.maxRiskThreshold) {
            this.logger.info('Mutation rejected: risk above threshold', {
                risk: mutation.metadata.risk,
                threshold: this.config.maxRiskThreshold
            });
            return false;
        }

        // Check mutation rate for this type
        const history = this.histories.get(pattern.id);
        if (history && history.mutations.length > 0) {
            const typeCount = history.mutations.filter(m => m.type === mutation.type).length;
            const totalCount = history.mutations.length;
            const rate = typeCount / totalCount;

            // Map mutation type to config key
            let configKey: keyof MutationConfig['mutationRates'];
            switch (mutation.type) {
                case 'feature_addition':
                    configKey = 'featureAddition';
                    break;
                case 'feature_removal':
                    configKey = 'featureRemoval';
                    break;
                case 'feature_modification':
                    configKey = 'featureModification';
                    break;
                case 'relationship_addition':
                    configKey = 'relationshipAddition';
                    break;
                case 'relationship_removal':
                    configKey = 'relationshipRemoval';
                    break;
                case 'relationship_modification':
                    configKey = 'relationshipModification';
                    break;
                case 'confidence_adjustment':
                    configKey = 'confidenceAdjustment';
                    break;
                case 'metadata_update':
                case 'validation_update':
                case 'evolution_step':
                    configKey = 'metadataUpdate';
                    break;
                default:
                    configKey = 'metadataUpdate';
            }

            const maxRate = this.config.mutationRates[configKey] || 0.1;

            if (rate > maxRate) {
                this.logger.info('Mutation rejected: rate above threshold', {
                    type: mutation.type,
                    rate,
                    maxRate
                });
                return false;
            }
        }

        return true;
    }

    /**
     * Gets all mutation histories
     */
    getAllHistories(): MutationHistory[] {
        return Array.from(this.histories.values());
    }

    /**
     * Clears the history for a pattern
     */
    clearHistory(patternId: string): void {
        this.histories.delete(patternId);
    }

    /**
     * Analyzes the mutation history for a pattern
     */
    analyzeHistory(patternId: string): {
        successRate: number;
        failureRate: number;
        mostCommonType: string;
        averageImpact: { confidence: number; performance: number; relationships: number };
    } {
        const history = this.histories.get(patternId);
        if (!history || history.mutations.length === 0) {
            return {
                successRate: 0,
                failureRate: 0,
                mostCommonType: 'none',
                averageImpact: { confidence: 0, performance: 0, relationships: 0 }
            };
        }

        // Calculate success and failure rates
        const successRate = history.metrics.successfulMutations / history.metrics.totalMutations;
        const failureRate = history.metrics.failedMutations / history.metrics.totalMutations;

        // Find most common mutation type
        const typeCounts = new Map<string, number>();
        for (const mutation of history.mutations) {
            const count = typeCounts.get(mutation.type) || 0;
            typeCounts.set(mutation.type, count + 1);
        }

        let mostCommonType = 'none';
        let maxCount = 0;
        for (const [type, count] of typeCounts.entries()) {
            if (count > maxCount) {
                mostCommonType = type;
                maxCount = count;
            }
        }

        return {
            successRate,
            failureRate,
            mostCommonType,
            averageImpact: history.metrics.averageImpact
        };
    }
}
