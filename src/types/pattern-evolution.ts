import { Pattern, PatternType } from './patterns';

export interface PatternMutation {
  type: 'merge' | 'split' | 'modify' | 'combine';
  confidence: number;
  parentPatterns: Pattern[];
  resultPattern: Pattern;
  metadata: {
    timestamp: Date;
    reason: string;
    impact: number;
    metrics: {
      efficiency: number;
      reliability: number;
      complexity: number;
    };
  };
}

export interface PatternEvolutionConfig {
  mutationRate: number;
  minConfidence: number;
  maxGenerations: number;
  populationSize: number;
  selectionPressure: number;
  optimizationMetrics: {
    efficiencyWeight: number;
    reliabilityWeight: number;
    complexityWeight: number;
  };
}

export interface PatternGeneration {
  id: string;
  timestamp: Date;
  patterns: Pattern[];
  mutations: PatternMutation[];
  metrics: {
    averageConfidence: number;
    bestConfidence: number;
    diversity: number;
    generationNumber: number;
  };
}

export interface PatternLineage {
  id: string;
  rootPattern: Pattern;
  generations: PatternGeneration[];
  currentGeneration: number;
  metadata: {
    startTime: Date;
    lastEvolution: Date;
    totalGenerations: number;
    improvements: {
      efficiency: number;
      reliability: number;
      complexity: number;
    };
  };
}

export interface EvolutionResult {
  success: boolean;
  newPattern?: Pattern;
  mutation?: PatternMutation;
  metrics: {
    confidence: number;
    improvement: number;
    generationNumber: number;
  };
  error?: string;
}

export interface PatternFitness {
  pattern: Pattern;
  score: number;
  metrics: {
    efficiency: number;
    reliability: number;
    complexity: number;
  };
}

export type MutationStrategy = 'random' | 'guided' | 'hybrid';
export type SelectionStrategy = 'tournament' | 'roulette' | 'rank';
export type CrossoverStrategy = 'single-point' | 'multi-point' | 'uniform';

export interface EvolutionStrategy {
  mutation: MutationStrategy;
  selection: SelectionStrategy;
  crossover: CrossoverStrategy;
  parameters: {
    mutationProbability: number;
    crossoverProbability: number;
    tournamentSize?: number;
    elitismCount?: number;
  };
}

export interface PatternEvolutionMetrics {
  timestamp: Date;
  generation: number;
  populationSize: number;
  averageFitness: number;
  bestFitness: number;
  worstFitness: number;
  diversity: number;
  improvementRate: number;
  convergenceRate: number;
  executionTime: number;
}

export type EvolutionStatus = 'idle' | 'evolving' | 'paused' | 'completed' | 'failed';

export interface PatternEvolutionState {
  currentGeneration: PatternGeneration;
  lineage: PatternLineage;
  config: PatternEvolutionConfig;
  strategy: EvolutionStrategy;
  metrics: PatternEvolutionMetrics[];
  status: EvolutionStatus;
}
