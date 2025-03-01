import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EventEmitter } from 'events';
import { EvolutionManager } from '../services/evolution/evolution-manager';
import { PatternEvaluator } from '../services/evolution/pattern-evaluator';
import { NeuralPattern } from '../types/neural-patterns';
import {
    PatternEvolutionMetrics,
    EvolutionConfig,
    QualityMetrics,
    PerformanceMetrics,
    StabilityMetrics,
    EvolutionMetrics,
    ValidationMetrics
} from '../types/evolution-metrics';
import { MutationConfig, MutationResult } from '../types/mutation-types';

jest.mock('../services/evolution/pattern-evaluator');
jest.mock('../utils/logger');

describe('EvolutionManager', () => {
    let manager: EvolutionManager;
    let evaluator: jest.Mocked<PatternEvaluator>;
    let config: EvolutionConfig;
    let mutationConfig: MutationConfig;

    const mockPattern: NeuralPattern = {
        id: 'test-pattern',
        type: 'semantic',
        confidence: 0.9,
        features: [],
        relationships: [],
        metadata: {
            created: new Date(),
            updated: new Date(),
            version: 1,
            source: 'test',
            context: {
                domain: 'test',
                scope: 'test',
                environment: 'test'
            },
            performance: {
                detectionTime: 100,
                matchingAccuracy: 0.95,
                evolutionRate: 0.1
            }
        },
        evolution: {
            version: 1,
            history: [],
            metrics: {
                stabilityScore: 0.9,
                adaptabilityRate: 0.8,
                evolutionSpeed: 0.7,
                qualityTrend: 0.85
            },
            predictions: {
                nextChange: new Date(),
                confidence: 0.8,
                suggestedImprovements: []
            }
        },
        validation: {
            lastValidated: new Date(),
            validationScore: 0.9,
            confidence: 0.85,
            issues: [],
            nextValidation: new Date(),
            history: []
        }
    };

    const mockMetrics: PatternEvolutionMetrics = {
        quality: {
            accuracy: 0.8,
            precision: 0.85,
            recall: 0.83,
            f1Score: 0.84,
            confidence: 0.9
        },
        performance: {
            executionTime: 150,
            memoryUsage: 50,
            cpuUtilization: 0.3,
            latency: 50,
            throughput: 1000
        },
        stability: {
            errorRate: 0.02,
            failureRate: 0.01,
            recoveryTime: 200,
            uptime: 0.99,
            reliability: 0.98
        },
        evolution: {
            generationCount: 1,
            mutationRate: 0.1,
            selectionPressure: 0.7,
            adaptationRate: 0.3,
            convergenceRate: 0.8
        },
        validation: {
            validationScore: 0.9,
            coverageRate: 0.95,
            errorMargin: 0.05,
            confidenceInterval: {
                min: 0.85,
                max: 0.95
            },
            stabilityScore: 0.9
        },
        timestamp: new Date()
    };

    beforeEach(() => {
        const MockedPatternEvaluator = jest.mocked(PatternEvaluator);
        evaluator = new MockedPatternEvaluator() as jest.Mocked<PatternEvaluator>;

        // Setup mock methods with proper typing
        jest.spyOn(evaluator, 'evaluatePattern').mockResolvedValue(mockMetrics);
        jest.spyOn(evaluator, 'evaluateQuality').mockResolvedValue(mockMetrics.quality);
        jest.spyOn(evaluator, 'evaluatePerformance').mockResolvedValue(mockMetrics.performance);
        jest.spyOn(evaluator, 'evaluateStability').mockResolvedValue(mockMetrics.stability);
        jest.spyOn(evaluator, 'evaluateEvolution').mockResolvedValue(mockMetrics.evolution);
        jest.spyOn(evaluator, 'evaluateValidation').mockResolvedValue(mockMetrics.validation);

        config = {
            qualityThresholds: {
                minAccuracy: 0.85,
                minPrecision: 0.85,
                minRecall: 0.85,
                minF1Score: 0.85,
                minConfidence: 0.85
            },
            performanceThresholds: {
                maxExecutionTime: 100,
                maxMemoryUsage: 100,
                maxCpuUtilization: 0.5,
                maxLatency: 100,
                minThroughput: 500
            },
            stabilityThresholds: {
                maxErrorRate: 0.05,
                maxFailureRate: 0.05,
                maxRecoveryTime: 500,
                minUptime: 0.95,
                minReliability: 0.95
            },
            evolutionParameters: {
                maxGenerations: 10,
                targetMutationRate: 0.1,
                selectionPressure: 0.7,
                adaptationRate: 0.3,
                convergenceThreshold: 0.95
            },
            validationThresholds: {
                minValidationScore: 0.85,
                minCoverageRate: 0.9,
                maxErrorMargin: 0.1,
                confidenceInterval: {
                    min: 0.8,
                    max: 1.0
                },
                minStabilityScore: 0.85
            }
        };

        mutationConfig = {
            maxMutationsPerGeneration: 3,
            minConfidenceThreshold: 0.7,
            maxRiskThreshold: 0.3,
            mutationRates: {
                featureAddition: 0.2,
                featureRemoval: 0.1,
                featureModification: 0.3,
                relationshipAddition: 0.2,
                relationshipRemoval: 0.1,
                relationshipModification: 0.3,
                confidenceAdjustment: 0.2,
                metadataUpdate: 0.1
            },
            validationThresholds: {
                minScore: 0.85,
                maxIssues: 5,
                minMetrics: mockMetrics
            }
        };

        manager = new EvolutionManager(evaluator, config, mutationConfig);
    });

    describe('evolvePattern', () => {
        it('should evolve pattern successfully', async () => {
            const result = await manager.evolvePattern(mockPattern);
            expect(result.success).toBe(true);
            expect(result.pattern).toBeDefined();
            expect(result.metrics).toBeDefined();
            expect(evaluator.evaluatePattern).toHaveBeenCalledTimes(2);
        });

        it('should handle evaluation errors', async () => {
            evaluator.evaluatePattern.mockRejectedValueOnce(new Error('Evaluation failed'));
            await expect(manager.evolvePattern(mockPattern)).rejects.toThrow('Evaluation failed');
        });

        it('should create quality mutations when accuracy is low', async () => {
            evaluator.evaluatePattern.mockResolvedValueOnce({
                ...mockMetrics,
                quality: { ...mockMetrics.quality, accuracy: 0.7 }
            });

            const result = await manager.evolvePattern(mockPattern);
            expect(result.success).toBe(true);
            expect(result.mutation.type).toBe('feature_modification');
        });

        it('should create performance mutations when execution time is high', async () => {
            evaluator.evaluatePattern.mockResolvedValueOnce({
                ...mockMetrics,
                performance: { ...mockMetrics.performance, executionTime: 200 }
            });

            const result = await manager.evolvePattern(mockPattern);
            expect(result.success).toBe(true);
            expect(result.mutation.type).toBe('metadata_update');
        });

        it('should create stability mutations when error rate is high', async () => {
            evaluator.evaluatePattern.mockResolvedValueOnce({
                ...mockMetrics,
                stability: { ...mockMetrics.stability, errorRate: 0.1 }
            });

            const result = await manager.evolvePattern(mockPattern);
            expect(result.success).toBe(true);
            expect(result.mutation.type).toBe('confidence_adjustment');
        });
    });

    describe('mutation history', () => {
        it('should track mutation history', async () => {
            const result1 = await manager.evolvePattern(mockPattern);
            expect(result1.success).toBe(true);

            const result2 = await manager.evolvePattern(mockPattern);
            expect(result2.success).toBe(true);

            // History should be maintained between evolutions
            expect(result2.metrics).toBeDefined();
            expect(evaluator.evaluatePattern).toHaveBeenCalledTimes(4);
        });

        it('should respect mutation rate limits', async () => {
            // Force multiple mutations of the same type
            evaluator.evaluatePattern.mockResolvedValue({
                ...mockMetrics,
                quality: { ...mockMetrics.quality, accuracy: 0.7 },
                performance: { ...mockMetrics.performance, executionTime: 200 },
                stability: { ...mockMetrics.stability, errorRate: 0.1 }
            });

            const result = await manager.evolvePattern(mockPattern);
            expect(result.success).toBe(true);
            expect(result.mutation).toBeDefined();
            // Should not exceed maxMutationsPerGeneration
            expect(result.metrics).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should handle unknown errors', async () => {
            evaluator.evaluatePattern.mockRejectedValueOnce('Unknown error');
            await expect(manager.evolvePattern(mockPattern)).rejects.toThrow('Unknown evolution error');
        });

        it('should handle mutation application errors', async () => {
            evaluator.evaluatePattern
                .mockResolvedValueOnce(mockMetrics)
                .mockRejectedValueOnce(new Error('Mutation failed'));

            const result = await manager.evolvePattern(mockPattern);
            expect(result.success).toBe(false);
            expect(result.validation.issues).toContain('Mutation error: Mutation failed');
        });

        it('should maintain pattern stability on error', async () => {
            evaluator.evaluatePattern
                .mockResolvedValueOnce(mockMetrics)
                .mockRejectedValueOnce(new Error('Evaluation error'))
                .mockResolvedValueOnce(mockMetrics);

            const result = await manager.evolvePattern(mockPattern);
            expect(result.pattern).toBeDefined();
            expect(result.pattern.confidence).toBe(mockPattern.confidence);
        });
    });
});
