import { EventBus } from './event-bus.service';
import { PatternRepository } from './pattern-repository.service';
import { Pattern } from '../types/patterns';
import {
  PatternMutation,
  PatternEvolutionConfig,
  PatternGeneration,
  PatternLineage,
  EvolutionResult,
  PatternFitness,
  EvolutionStrategy,
  PatternEvolutionMetrics,
  PatternEvolutionState,
  MutationStrategy,
  SelectionStrategy,
  CrossoverStrategy,
} from '../types/pattern-evolution';
import { v4 as uuidv4 } from 'uuid';

export class PatternEvolutionService {
  private static instance: PatternEvolutionService;
  private state: PatternEvolutionState;
  private eventBus: EventBus;
  private repository: PatternRepository;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.repository = PatternRepository.getInstance();
    this.state = this.initializeState();
  }

  public static getInstance(): PatternEvolutionService {
    if (!PatternEvolutionService.instance) {
      PatternEvolutionService.instance = new PatternEvolutionService();
    }
    return PatternEvolutionService.instance;
  }

  private initializeState(): PatternEvolutionState {
    return {
      currentGeneration: this.createInitialGeneration(),
      lineage: this.createInitialLineage(),
      config: this.getDefaultConfig(),
      strategy: this.getDefaultStrategy(),
      metrics: [],
      status: 'idle',
    };
  }

  private createInitialGeneration(): PatternGeneration {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      patterns: [],
      mutations: [],
      metrics: {
        averageConfidence: 0,
        bestConfidence: 0,
        diversity: 0,
        generationNumber: 0,
      },
    };
  }

  private createInitialLineage(): PatternLineage {
    return {
      id: uuidv4(),
      rootPattern: null as any, // Will be set when evolution starts
      generations: [],
      currentGeneration: 0,
      metadata: {
        startTime: new Date(),
        lastEvolution: new Date(),
        totalGenerations: 0,
        improvements: {
          efficiency: 0,
          reliability: 0,
          complexity: 0,
        },
      },
    };
  }

  private getDefaultConfig(): PatternEvolutionConfig {
    return {
      mutationRate: 0.1,
      minConfidence: 0.7,
      maxGenerations: 100,
      populationSize: 50,
      selectionPressure: 0.8,
      optimizationMetrics: {
        efficiencyWeight: 0.4,
        reliabilityWeight: 0.4,
        complexityWeight: 0.2,
      },
    };
  }

  private getDefaultStrategy(): EvolutionStrategy {
    return {
      mutation: 'hybrid',
      selection: 'tournament',
      crossover: 'multi-point',
      parameters: {
        mutationProbability: 0.2,
        crossoverProbability: 0.8,
        tournamentSize: 5,
        elitismCount: 2,
      },
    };
  }

  public async evolvePattern(pattern: Pattern): Promise<EvolutionResult> {
    try {
      this.state.status = 'evolving';
      this.state.lineage.rootPattern = pattern;

      const initialPopulation = await this.generateInitialPopulation(pattern);
      this.state.currentGeneration.patterns = initialPopulation;

      let currentGeneration = 0;
      let bestFitness = await this.evaluatePopulation(initialPopulation);

      while (currentGeneration < this.state.config.maxGenerations) {
        if (this.state.status !== 'evolving') {
          await this.waitForResume();
          continue;
        }
        const parents = await this.selectParents(this.state.currentGeneration.patterns);
        const offspring = await this.crossover(parents);
        const mutatedOffspring = await Promise.all(
          offspring.map(pattern => this.mutatePattern(pattern))
        );
        const validOffspring = mutatedOffspring.filter((pattern): pattern is Pattern => pattern !== null);
        const newFitness = await this.evaluatePopulation(validOffspring);

        if (newFitness.score > bestFitness.score) {
          bestFitness = newFitness;
          await this.updateLineage(validOffspring, newFitness);
        }

        if (this.hasConverged(bestFitness)) {
          break;
        }

        currentGeneration++;
        await this.updateMetrics(currentGeneration, bestFitness);
      }

      this.state.status = 'completed';
      return this.createEvolutionResult(bestFitness);
    } catch (error: any) {
      this.state.status = 'failed';
      return {
        success: false,
        error: error.message,
        metrics: {
          confidence: 0,
          improvement: 0,
          generationNumber: this.state.lineage.currentGeneration,
        },
      };
    }
  }

  private async generateInitialPopulation(pattern: Pattern): Promise<Pattern[]> {
    const population: Pattern[] = [pattern];

    while (population.length < this.state.config.populationSize) {
      const mutated = await this.mutatePattern(pattern);
      if (mutated) {
        population.push(mutated);
      }
    }

    return population;
  }

  private async mutatePattern(pattern: Pattern): Promise<Pattern | null> {
    const strategy = this.state.strategy.mutation;
    const probability = this.state.strategy.parameters.mutationProbability;

    if (Math.random() > probability) {
      return null;
    }

    try {
      const mutation: PatternMutation = {
        type: this.selectMutationType(),
        confidence: 0,
        parentPatterns: [pattern],
        resultPattern: { ...pattern },
        metadata: {
          timestamp: new Date(),
          reason: 'Evolution mutation',
          impact: 0,
          metrics: {
            efficiency: 0,
            reliability: 0,
            complexity: 0,
          },
        },
      };

      switch (strategy) {
        case 'random':
          return this.randomMutation(pattern, mutation);
        case 'guided':
          return this.guidedMutation(pattern, mutation);
        case 'hybrid':
          return Math.random() > 0.5
            ? this.randomMutation(pattern, mutation)
            : this.guidedMutation(pattern, mutation);
        default:
          return null;
      }
    } catch (error) {
      console.error('Mutation failed:', error);
      return null;
    }
  }

  private selectMutationType(): PatternMutation['type'] {
    const types: PatternMutation['type'][] = ['merge', 'split', 'modify', 'combine'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private async randomMutation(pattern: Pattern, mutation: PatternMutation): Promise<Pattern> {
    // Implement random mutations to pattern properties
    const mutated = { ...pattern };

    // Randomly modify pattern properties
    if (Math.random() > 0.5) {
      mutated.confidence = Math.max(0, Math.min(1, pattern.confidence + (Math.random() - 0.5) * 0.2));
    }

    if (Math.random() > 0.5) {
      mutated.impact = Math.max(0, Math.min(1, pattern.impact + (Math.random() - 0.5) * 0.2));
    }

    mutation.resultPattern = mutated;
    mutation.metadata.impact = Math.abs(mutated.impact - pattern.impact);

    this.state.currentGeneration.mutations.push(mutation);
    return mutated;
  }

  private async guidedMutation(pattern: Pattern, mutation: PatternMutation): Promise<Pattern> {
    // Implement guided mutations based on historical performance
    const mutated = { ...pattern };
    const history = await this.repository.getPatternHistory(pattern.id);

    if (history && history.length > 0) {
      const successfulPatterns = history.filter(p => p.confidence > pattern.confidence);
      if (successfulPatterns.length > 0) {
        const target = successfulPatterns[Math.floor(Math.random() * successfulPatterns.length)];
        mutated.confidence = (pattern.confidence + target.confidence) / 2;
        mutated.impact = (pattern.impact + target.impact) / 2;
      }
    }

    mutation.resultPattern = mutated;
    mutation.metadata.impact = Math.abs(mutated.impact - pattern.impact);

    this.state.currentGeneration.mutations.push(mutation);
    return mutated;
  }

  private async selectParents(population: Pattern[]): Promise<Pattern[]> {
    const strategy = this.state.strategy.selection;

    switch (strategy) {
      case 'tournament':
        return this.tournamentSelection(population);
      case 'roulette':
        return this.rouletteSelection(population);
      case 'rank':
        return this.rankSelection(population);
      default:
        return this.tournamentSelection(population);
    }
  }

  private async tournamentSelection(population: Pattern[]): Promise<Pattern[]> {
    const tournamentSize = this.state.strategy.parameters.tournamentSize || 5;
    const selected: Pattern[] = [];

    while (selected.length < population.length / 2) {
      const tournament = this.shuffleArray(population).slice(0, tournamentSize);
      const winner = tournament.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
      selected.push(winner);
    }

    return selected;
  }

  private async rouletteSelection(population: Pattern[]): Promise<Pattern[]> {
    const totalFitness = population.reduce((sum, pattern) => sum + pattern.confidence, 0);
    const selected: Pattern[] = [];

    while (selected.length < population.length / 2) {
      const threshold = Math.random() * totalFitness;
      let sum = 0;

      for (const pattern of population) {
        sum += pattern.confidence;
        if (sum >= threshold) {
          selected.push(pattern);
          break;
        }
      }
    }

    return selected;
  }

  private async rankSelection(population: Pattern[]): Promise<Pattern[]> {
    const ranked = [...population].sort((a, b) => b.confidence - a.confidence);
    const selected: Pattern[] = [];

    for (let i = 0; i < population.length / 2; i++) {
      const rank = Math.floor(Math.random() * Math.random() * ranked.length);
      selected.push(ranked[rank]);
    }

    return selected;
  }

  private async crossover(parents: Pattern[]): Promise<Pattern[]> {
    const offspring: Pattern[] = [];
    const strategy = this.state.strategy.crossover;

    for (let i = 0; i < parents.length; i += 2) {
      const parent1 = parents[i];
      const parent2 = parents[i + 1] || parents[0];

      if (Math.random() < this.state.strategy.parameters.crossoverProbability) {
        const [child1, child2] = await this.performCrossover(parent1, parent2, strategy);
        offspring.push(child1, child2);
      } else {
        offspring.push(parent1, parent2);
      }
    }

    return offspring;
  }

  private async performCrossover(parent1: Pattern, parent2: Pattern, strategy: CrossoverStrategy): Promise<[Pattern, Pattern]> {
    const child1 = { ...parent1 };
    const child2 = { ...parent2 };

    switch (strategy) {
      case 'single-point':
        // Implement single-point crossover
        child1.confidence = (parent1.confidence + parent2.confidence) / 2;
        child2.confidence = (parent1.confidence + parent2.confidence) / 2;
        break;

      case 'multi-point':
        // Implement multi-point crossover
        child1.confidence = (parent1.confidence * 0.7 + parent2.confidence * 0.3);
        child2.confidence = (parent2.confidence * 0.7 + parent1.confidence * 0.3);
        child1.impact = (parent1.impact * 0.7 + parent2.impact * 0.3);
        child2.impact = (parent2.impact * 0.7 + parent1.impact * 0.3);
        break;

      case 'uniform':
        // Implement uniform crossover
        child1.confidence = Math.random() > 0.5 ? parent1.confidence : parent2.confidence;
        child2.confidence = Math.random() > 0.5 ? parent1.confidence : parent2.confidence;
        child1.impact = Math.random() > 0.5 ? parent1.impact : parent2.impact;
        child2.impact = Math.random() > 0.5 ? parent1.impact : parent2.impact;
        break;
    }

    return [child1, child2];
  }

  private async evaluatePopulation(population: Pattern[]): Promise<PatternFitness> {
    const fitnesses = await Promise.all(
      population.map(pattern => this.evaluatePattern(pattern))
    );

    return fitnesses.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  }

  private async evaluatePattern(pattern: Pattern): Promise<PatternFitness> {
    const weights = this.state.config.optimizationMetrics;

    const metrics = {
      efficiency: this.calculateEfficiency(pattern),
      reliability: this.calculateReliability(pattern),
      complexity: this.calculateComplexity(pattern),
    };

    const score =
      metrics.efficiency * weights.efficiencyWeight +
      metrics.reliability * weights.reliabilityWeight +
      metrics.complexity * weights.complexityWeight;

    return { pattern, score, metrics };
  }

  private calculateEfficiency(pattern: Pattern): number {
    // Implement efficiency calculation
    return pattern.confidence * 0.7 + pattern.impact * 0.3;
  }

  private calculateReliability(pattern: Pattern): number {
    // Implement reliability calculation
    return pattern.confidence;
  }

  private calculateComplexity(pattern: Pattern): number {
    // Implement complexity calculation
    // Lower is better
    return 1 - (Object.keys(pattern).length / 10);
  }

  private async updateLineage(population: Pattern[], bestFitness: PatternFitness): Promise<void> {
    const generation: PatternGeneration = {
      id: uuidv4(),
      timestamp: new Date(),
      patterns: population,
      mutations: this.state.currentGeneration.mutations,
      metrics: {
        averageConfidence: population.reduce((sum, p) => sum + p.confidence, 0) / population.length,
        bestConfidence: bestFitness.pattern.confidence,
        diversity: this.calculateDiversity(population),
        generationNumber: this.state.lineage.currentGeneration + 1,
      },
    };

    this.state.lineage.generations.push(generation);
    this.state.lineage.currentGeneration++;
    this.state.lineage.metadata.lastEvolution = new Date();
    this.state.lineage.metadata.totalGenerations++;

    // Update improvements
    const previousBest = this.state.lineage.generations[this.state.lineage.currentGeneration - 1]?.metrics.bestConfidence || 0;
    const improvement = bestFitness.pattern.confidence - previousBest;

    if (improvement > 0) {
      this.state.lineage.metadata.improvements = {
        efficiency: this.state.lineage.metadata.improvements.efficiency + improvement * 0.4,
        reliability: this.state.lineage.metadata.improvements.reliability + improvement * 0.4,
        complexity: this.state.lineage.metadata.improvements.complexity + improvement * 0.2,
      };
    }
  }

  private calculateDiversity(population: Pattern[]): number {
    const confidences = population.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    return Math.sqrt(variance);
  }

  private async updateMetrics(generation: number, bestFitness: PatternFitness): Promise<void> {
    const metrics: PatternEvolutionMetrics = {
      timestamp: new Date(),
      generation,
      populationSize: this.state.currentGeneration.patterns.length,
      averageFitness: this.state.currentGeneration.metrics.averageConfidence,
      bestFitness: bestFitness.score,
      worstFitness: Math.min(...this.state.currentGeneration.patterns.map(p => p.confidence)),
      diversity: this.state.currentGeneration.metrics.diversity,
      improvementRate: this.calculateImprovementRate(),
      convergenceRate: this.calculateConvergenceRate(),
      executionTime: Date.now() - this.state.lineage.metadata.startTime.getTime(),
    };

    this.state.metrics.push(metrics);
    await this.eventBus.emit('patternEvolution:metrics', metrics);
  }

  private calculateImprovementRate(): number {
    if (this.state.metrics.length < 2) return 0;

    const recent = this.state.metrics.slice(-5);
    const improvements = recent.slice(1).map((m, i) => m.bestFitness - recent[i].bestFitness);
    return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
  }

  private calculateConvergenceRate(): number {
    if (this.state.metrics.length < 2) return 0;

    const recent = this.state.metrics.slice(-5);
    const diversityChange = recent.slice(1).map((m, i) => m.diversity - recent[i].diversity);
    return Math.abs(diversityChange.reduce((sum, change) => sum + change, 0) / diversityChange.length);
  }

  private hasConverged(_bestFitness: PatternFitness): boolean {
    if (this.state.metrics.length < 10) return false;

    const recent = this.state.metrics.slice(-10);
    const improvements = recent.slice(1).map((m, i) => m.bestFitness - recent[i].bestFitness);
    const averageImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;

    return averageImprovement < 0.001;
  }

  private createEvolutionResult(bestFitness: PatternFitness): EvolutionResult {
    return {
      success: true,
      newPattern: bestFitness.pattern,
      mutation: this.state.currentGeneration.mutations.find(
        m => m.resultPattern.id === bestFitness.pattern.id
      ),
      metrics: {
        confidence: bestFitness.pattern.confidence,
        improvement: this.calculateImprovementRate(),
        generationNumber: this.state.lineage.currentGeneration,
      },
    };
  }

  private async waitForResume(): Promise<void> {
    return new Promise<void>(resolve => {
      const checkStatus = () => {
        const status = this.state.status;
        if (status === 'evolving') {
          resolve();
        } else if (status === 'completed' || status === 'failed') {
          resolve();
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Public methods for controlling evolution
  public pauseEvolution(): void {
    this.state.status = 'paused';
  }

  public resumeEvolution(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'evolving';
    }
  }

  public getState(): PatternEvolutionState {
    return { ...this.state };
  }

  public updateConfig(config: Partial<PatternEvolutionConfig>): void {
    this.state.config = { ...this.state.config, ...config };
  }

  public updateStrategy(strategy: Partial<EvolutionStrategy>): void {
    this.state.strategy = { ...this.state.strategy, ...strategy };
  }
}
