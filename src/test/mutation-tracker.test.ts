import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MutationTracker } from '../services/evolution/mutation-tracker';
import { MutationConfig, MutationResult, Mutation } from '../types/mutation-types';
import { NeuralPattern } from '../types/neural-patterns';
import { PatternEvolutionMetrics } from '../types/evolution-metrics';

jest.mock('../utils/logger', () => ({
    Logger: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }))
}));

describe('MutationTracker', () => {
    let tracker: MutationTracker;
    let config: MutationConfig;
    let mockPattern: NeuralPattern;
    let mockMetrics: PatternEvolutionMetrics;

    beforeEach(() => {
        // Mock pattern
        mockPattern = {
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

        // Mock metrics
        mockMetrics = {
            quality: {
                accuracy: 0.8,
                precision: 0.85,
                recall: 0.83,
                f1Score: 0.84,
                confidence: 0.9
            },
            performance: {
                executionTime: 100,
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

        // Config for MutationTracker
        config = {
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

        tracker = new MutationTracker(config);
    });

    describe('trackMutation', () => {
        it('should track a successful mutation', () => {
            const mutation: Mutation = {
                id: 'test-mutation',
                type: 'feature_modification',
                timestamp: new Date(),
                patternId: mockPattern.id,
                description: 'Test mutation',
                impact: {
                    confidence: 0.1,
                    performance: 0.2,
                    relationships: 0.3
                },
                metadata: {
                    source: 'test',
                    reason: 'testing',
                    priority: 1,
                    risk: 0.1
                },
                feature: {
                    name: 'test-feature',
                    value: 1,
                    weight: 1,
                    confidence: 0.9,
                    metadata: {
                        source: 'test',
                        timestamp: new Date(),
                        version: 1
                    }
                },
                previousValue: undefined
            };

            const result: MutationResult = {
                success: true,
                mutation,
                pattern: mockPattern,
                metrics: mockMetrics,
                validation: {
                    isValid: true,
                    score: 0.9,
                    issues: []
                }
            };

            tracker.trackMutation(result);
            const history = tracker.getHistory(mockPattern.id);

            expect(history).toBeDefined();
            expect(history?.mutations.length).toBe(1);
            expect(history?.mutations[0]).toBe(mutation);
            expect(history?.metrics.successfulMutations).toBe(1);
            expect(history?.metrics.failedMutations).toBe(0);
        });

        it('should track a failed mutation', () => {
            const mutation: Mutation = {
                id: 'test-mutation',
                type: 'feature_modification',
                timestamp: new Date(),
                patternId: mockPattern.id,
                description: 'Test mutation',
                impact: {
                    confidence: 0.1,
                    performance: 0.2,
                    relationships: 0.3
                },
                metadata: {
                    source: 'test',
                    reason: 'testing',
                    priority: 1,
                    risk: 0.1
                },
                feature: {
                    name: 'test-feature',
                    value: 1,
                    weight: 1,
                    confidence: 0.9,
                    metadata: {
                        source: 'test',
                        timestamp: new Date(),
                        version: 1
                    }
                },
                previousValue: undefined
            };

            const result: MutationResult = {
                success: false,
                mutation,
                pattern: mockPattern,
                metrics: mockMetrics,
                validation: {
                    isValid: false,
                    score: 0.7,
                    issues: ['Test issue']
                }
            };

            tracker.trackMutation(result);
            const history = tracker.getHistory(mockPattern.id);

            expect(history).toBeDefined();
            expect(history?.mutations.length).toBe(1);
            expect(history?.metrics.successfulMutations).toBe(0);
            expect(history?.metrics.failedMutations).toBe(1);
        });
    });

    describe('validateMutation', () => {
        it('should validate a mutation with valid confidence', () => {
            const mutation: Mutation = {
                id: 'test-mutation',
                type: 'feature_modification',
                timestamp: new Date(),
                patternId: mockPattern.id,
                description: 'Test mutation',
                impact: {
                    confidence: 0.1,
                    performance: 0.2,
                    relationships: 0.3
                },
                metadata: {
                    source: 'test',
                    reason: 'testing',
                    priority: 1,
                    risk: 0.1
                },
                feature: {
                    name: 'test-feature',
                    value: 1,
                    weight: 1,
                    confidence: 0.9,
                    metadata: {
                        source: 'test',
                        timestamp: new Date(),
                        version: 1
                    }
                },
                previousValue: undefined
            };

            const isValid = tracker.validateMutation(mutation, mockPattern);
            expect(isValid).toBe(true);
        });

        it('should reject a mutation with low confidence', () => {
            const lowConfidencePattern = { ...mockPattern, confidence: 0.5 };
            const mutation: Mutation = {
                id: 'test-mutation',
                type: 'feature_modification',
                timestamp: new Date(),
                patternId: lowConfidencePattern.id,
                description: 'Test mutation',
                impact: {
                    confidence: 0.1,
                    performance: 0.2,
                    relationships: 0.3
                },
                metadata: {
                    source: 'test',
                    reason: 'testing',
                    priority: 1,
                    risk: 0.1
                },
                feature: {
                    name: 'test-feature',
                    value: 1,
                    weight: 1,
                    confidence: 0.9,
                    metadata: {
                        source: 'test',
                        timestamp: new Date(),
                        version: 1
                    }
                },
                previousValue: undefined
            };

            const isValid = tracker.validateMutation(mutation, lowConfidencePattern);
            expect(isValid).toBe(false);
        });

        it('should reject a mutation with high risk', () => {
            const mutation: Mutation = {
                id: 'test-mutation',
                type: 'feature_modification',
                timestamp: new Date(),
                patternId: mockPattern.id,
                description: 'Test mutation',
                impact: {
                    confidence: 0.1,
                    performance: 0.2,
                    relationships: 0.3
                },
                metadata: {
                    source: 'test',
                    reason: 'testing',
                    priority: 1,
                    risk: 0.5
                },
                feature: {
                    name: 'test-feature',
                    value: 1,
                    weight: 1,
                    confidence: 0.9,
                    metadata: {
                        source: 'test',
                        timestamp: new Date(),
                        version: 1
                    }
                },
                previousValue: undefined
            };

            const isValid = tracker.validateMutation(mutation, mockPattern);
            expect(isValid).toBe(false);
        });
    });

    describe('analyzeHistory', () => {
        it('should return zeroed stats for empty history', () => {
            const analysis = tracker.analyzeHistory('non-existent');
            expect(analysis.successRate).toBe(0);
            expect(analysis.failureRate).toBe(0);
            expect(analysis.mostCommonType).toBe('none');
            expect(analysis.averageImpact.confidence).toBe(0);
            expect(analysis.averageImpact.performance).toBe(0);
            expect(analysis.averageImpact.relationships).toBe(0);
        });

        it('should analyze history correctly', () => {
            // Add some mutations
            const mutation1: Mutation = {
                id: 'test-mutation-1',
                type: 'feature_modification',
                timestamp: new Date(),
                patternId: mockPattern.id,
                description: 'Test mutation 1',
                impact: {
                    confidence: 0.1,
                    performance: 0.2,
                    relationships: 0.3
                },
                metadata: {
                    source: 'test',
                    reason: 'testing',
                    priority: 1,
                    risk: 0.1
                },
                feature: {
                    name: 'test-feature',
                    value: 1,
                    weight: 1,
                    confidence: 0.9,
                    metadata: {
                        source: 'test',
                        timestamp: new Date(),
                        version: 1
                    }
                },
                previousValue: undefined
            };

            const mutation2: Mutation = {
                id: 'test-mutation-2',
                type: 'feature_modification',
                timestamp: new Date(),
                patternId: mockPattern.id,
                description: 'Test mutation 2',
                impact: {
                    confidence: 0.2,
                    performance: 0.3,
                    relationships: 0.4
                },
                metadata: {
                    source: 'test',
                    reason: 'testing',
                    priority: 1,
                    risk: 0.1
                },
                feature: {
                    name: 'test-feature',
                    value: 1,
                    weight: 1,
                    confidence: 0.9,
                    metadata: {
                        source: 'test',
                        timestamp: new Date(),
                        version: 1
                    }
                },
                previousValue: undefined
            };

            const result1: MutationResult = {
                success: true,
                mutation: mutation1,
                pattern: mockPattern,
                metrics: mockMetrics,
                validation: {
                    isValid: true,
                    score: 0.9,
                    issues: []
                }
            };

            const result2: MutationResult = {
                success: false,
                mutation: mutation2,
                pattern: mockPattern,
                metrics: mockMetrics,
                validation: {
                    isValid: false,
                    score: 0.7,
                    issues: ['Test issue']
                }
            };

            tracker.trackMutation(result1);
            tracker.trackMutation(result2);

            const analysis = tracker.analyzeHistory(mockPattern.id);
            expect(analysis.successRate).toBe(0.5);
            expect(analysis.failureRate).toBe(0.5);
            expect(analysis.mostCommonType).toBe('feature_modification');
            expect(analysis.averageImpact.confidence).toBeCloseTo(0.15);
            expect(analysis.averageImpact.performance).toBeCloseTo(0.25);
            expect(analysis.averageImpact.relationships).toBeCloseTo(0.35);
        });
    });
});
