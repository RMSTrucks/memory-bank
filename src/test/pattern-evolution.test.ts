import { PatternEvolutionService } from '../services/pattern-evolution.service';
import { Pattern, PatternType } from '../types/patterns';
import { v4 as uuidv4 } from 'uuid';

describe('PatternEvolutionService', () => {
  let service: PatternEvolutionService;
  let testPattern: Pattern;

  beforeEach(() => {
    service = PatternEvolutionService.getInstance();
    testPattern = createTestPattern();
  });

  function createTestPattern(): Pattern {
    return {
      id: uuidv4(),
      type: 'workflow' as PatternType,
      name: 'Test Pattern',
      description: 'A test pattern for evolution',
      confidence: 0.7,
      impact: 0.6,
      tags: ['test', 'evolution'],
      timestamp: new Date(),
      metadata: {
        source: 'test',
        category: 'test',
        priority: 1,
        status: 'active',
        version: '1.0.0',
        lastModified: new Date(),
        createdBy: 'test',
        dependencies: [],
        relatedPatterns: [],
      },
      metrics: {
        usageCount: 0,
        successRate: 0,
        failureRate: 0,
        averageExecutionTime: 0,
        resourceUtilization: 0,
        complexityScore: 0,
        maintainabilityIndex: 0,
        testCoverage: 0,
      },
      implementation: {
        code: '',
        configuration: {},
        requirements: [],
        constraints: [],
        examples: [],
        testCases: [],
      },
      validation: {
        rules: [],
        conditions: [],
        assertions: [],
        errorHandling: [],
      },
      evolution: {
        version: '1.0.0',
        changes: [],
        previousVersions: [],
      },
    };
  }

  test('should evolve pattern successfully', async () => {
    const result = await service.evolvePattern(testPattern);
    expect(result.success).toBe(true);
    expect(result.newPattern).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.confidence).toBeGreaterThan(testPattern.confidence);
  });

  test('should handle pattern mutation', async () => {
    const state = service.getState();
    expect(state.status).toBe('completed'); // Initial state is completed

    await service.evolvePattern(testPattern);
    const newState = service.getState();
    expect(newState.currentGeneration.mutations.length).toBeGreaterThan(0);
  });

  test('should pause and resume evolution', async () => {
    const evolutionPromise = service.evolvePattern(testPattern);
    service.pauseEvolution();

    const pausedState = service.getState();
    expect(pausedState.status).toBe('paused');

    service.resumeEvolution();
    const result = await evolutionPromise;
    expect(result.success).toBe(true);
  });

  test('should update configuration', () => {
    const newConfig = {
      mutationRate: 0.2,
      minConfidence: 0.8,
    };

    service.updateConfig(newConfig);
    const state = service.getState();
    expect(state.config.mutationRate).toBe(0.2);
    expect(state.config.minConfidence).toBe(0.8);
  });

  test('should update strategy', () => {
    const newStrategy = {
      mutation: 'guided' as const,
      selection: 'roulette' as const,
    };

    service.updateStrategy(newStrategy);
    const state = service.getState();
    expect(state.strategy.mutation).toBe('guided');
    expect(state.strategy.selection).toBe('roulette');
  });

  test('should track evolution metrics', async () => {
    await service.evolvePattern(testPattern);
    const state = service.getState();

    expect(state.metrics.length).toBeGreaterThan(0);
    const lastMetrics = state.metrics[state.metrics.length - 1];
    expect(lastMetrics.generation).toBeGreaterThan(0);
    expect(lastMetrics.populationSize).toBeGreaterThan(0);
    expect(lastMetrics.bestFitness).toBeGreaterThan(0);
  });

  test('should maintain pattern lineage', async () => {
    await service.evolvePattern(testPattern);
    const state = service.getState();

    expect(state.lineage.rootPattern).toEqual(testPattern);
    expect(state.lineage.generations.length).toBeGreaterThan(0);
    expect(state.lineage.currentGeneration).toBeGreaterThan(0);
  });

  test('should converge on better solutions', async () => {
    const result = await service.evolvePattern(testPattern);
    expect(result.metrics.improvement).toBeGreaterThan(0);
    expect(result.metrics.confidence).toBeGreaterThan(testPattern.confidence);
  });

  test('should handle invalid patterns', async () => {
    const invalidPattern = { ...testPattern, confidence: -1 };
    const result = await service.evolvePattern(invalidPattern);
    expect(result.success).toBe(true); // Service should handle invalid patterns gracefully
    expect(result.metrics.confidence).toBeGreaterThan(0); // Should fix invalid confidence
  });

  test('should maintain population diversity', async () => {
    await service.evolvePattern(testPattern);
    const state = service.getState();

    const generation = state.currentGeneration;
    const confidences = generation.patterns.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    const diversity = Math.sqrt(variance);

    expect(diversity).toBeGreaterThan(0);
  });
});
