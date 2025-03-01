/**
 * Knowledge-Pattern Integration Types
 *
 * This file defines the types and interfaces for the integration between
 * the Pattern System and Knowledge System, enabling self-improvement
 * capabilities through pattern storage, retrieval, and feedback loops.
 */

import { Pattern } from './patterns';
import { ComputationGraph } from '../neural/types/computation';
import { Vector } from './vector-knowledge';

/**
 * Represents a pattern stored as knowledge in the vector database
 */
export interface PatternKnowledge {
  /** Unique identifier for the pattern knowledge */
  id: string;

  /** The pattern data */
  pattern: Pattern;

  /** Vector embedding of the pattern for similarity search */
  embedding: Vector;

  /** Metadata for the pattern */
  metadata: PatternMetadata;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;

  /** Version number for tracking evolution */
  version: number;

  /** Previous version ID if this is an evolved pattern */
  previousVersionId?: string;
}

/**
 * Metadata for pattern knowledge
 */
export interface PatternMetadata {
  /** Pattern category (e.g., 'computation', 'optimization', 'learning') */
  category: PatternCategory;

  /** Tags for the pattern */
  tags: string[];

  /** Complexity score (1-10) */
  complexity: number;

  /** Reliability score (0-1) */
  reliability: number;

  /** Performance impact score (0-1) */
  performanceImpact: number;

  /** Number of times the pattern has been applied */
  applicationCount: number;

  /** Number of successful applications */
  successCount: number;

  /** Source of the pattern (e.g., 'detection', 'evolution', 'manual') */
  source: PatternSource;

  /** Context in which the pattern is applicable */
  applicableContext: PatternContext[];
}

/**
 * Pattern categories
 */
export enum PatternCategory {
  COMPUTATION = 'computation',
  OPTIMIZATION = 'optimization',
  LEARNING = 'learning',
  ARCHITECTURE = 'architecture',
  WORKFLOW = 'workflow',
  INTEGRATION = 'integration'
}

/**
 * Pattern sources
 */
export enum PatternSource {
  DETECTION = 'detection',
  EVOLUTION = 'evolution',
  MANUAL = 'manual',
  IMPORT = 'import'
}

/**
 * Context in which a pattern is applicable
 */
export interface PatternContext {
  /** Type of context (e.g., 'computation', 'data', 'system') */
  type: string;

  /** Constraints for the context */
  constraints: Record<string, any>;

  /** Priority for this context (higher means more important) */
  priority: number;
}

/**
 * Query parameters for retrieving patterns from knowledge
 */
export interface KnowledgePatternQuery {
  /** Context for the query */
  context: ComputationContext;

  /** Optional category filter */
  category?: PatternCategory;

  /** Optional tags filter */
  tags?: string[];

  /** Minimum reliability score (0-1) */
  minReliability?: number;

  /** Maximum complexity (1-10) */
  maxComplexity?: number;

  /** Maximum number of patterns to retrieve */
  limit?: number;
}

/**
 * Computation context for pattern retrieval
 */
export interface ComputationContext {
  /** Computation graph or subgraph */
  graph?: ComputationGraph;

  /** Operation types in the context */
  operationTypes?: string[];

  /** Input shapes if available */
  inputShapes?: number[][];

  /** Output shapes if available */
  outputShapes?: number[][];

  /** Data types involved */
  dataTypes?: string[];

  /** Performance constraints */
  performanceConstraints?: PerformanceConstraints;

  /** Additional context-specific properties */
  properties?: Record<string, any>;
}

/**
 * Performance constraints for computation
 */
export interface PerformanceConstraints {
  /** Maximum memory usage in bytes */
  maxMemoryUsage?: number;

  /** Maximum execution time in milliseconds */
  maxExecutionTime?: number;

  /** Minimum throughput in operations per second */
  minThroughput?: number;

  /** Priority factor (memory vs. speed) from 0 (memory) to 1 (speed) */
  priorityFactor?: number;
}

/**
 * Result of pattern execution
 */
export interface PatternExecutionResult {
  /** ID of the pattern */
  patternId: string;

  /** Version of the pattern */
  patternVersion: number;

  /** Context in which the pattern was applied */
  context: ComputationContext;

  /** Whether the execution was successful */
  success: boolean;

  /** Error message if execution failed */
  errorMessage?: string;

  /** Performance metrics before pattern application */
  baselineMetrics?: PerformanceMetrics;

  /** Performance metrics after pattern application */
  resultMetrics?: PerformanceMetrics;

  /** Execution timestamp */
  timestamp: string;
}

/**
 * Performance metrics for pattern execution
 */
export interface PerformanceMetrics {
  /** Execution time in milliseconds */
  executionTime: number;

  /** Memory usage in bytes */
  memoryUsage: number;

  /** CPU usage percentage */
  cpuUsage?: number;

  /** Throughput in operations per second */
  throughput?: number;

  /** Additional metric values */
  additionalMetrics?: Record<string, number>;
}

/**
 * Metrics for pattern effectiveness
 */
export interface PatternEffectivenessMetrics {
  /** ID of the pattern */
  patternId: string;

  /** Version of the pattern */
  patternVersion: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average performance improvement ratio */
  avgPerformanceImprovement: number;

  /** Average execution time improvement ratio */
  avgExecutionTimeImprovement: number;

  /** Average memory usage improvement ratio */
  avgMemoryUsageImprovement: number;

  /** Average throughput improvement ratio */
  avgThroughputImprovement?: number;

  /** Number of applications */
  applicationCount: number;

  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Pattern refinement strategy
 */
export interface PatternRefinementStrategy {
  /** ID of the pattern to refine */
  patternId: string;

  /** Current version of the pattern */
  currentVersion: number;

  /** Refinement type */
  refinementType: RefinementType;

  /** Specific aspects to refine */
  refinementAspects: string[];

  /** Target metrics to improve */
  targetMetrics: string[];

  /** Constraints for the refinement */
  constraints: Record<string, any>;
}

/**
 * Refinement types
 */
export enum RefinementType {
  OPTIMIZATION = 'optimization',
  GENERALIZATION = 'generalization',
  SPECIALIZATION = 'specialization',
  COMPOSITION = 'composition',
  DECOMPOSITION = 'decomposition'
}

/**
 * Events for knowledge-pattern integration
 */
export enum KnowledgePatternEventType {
  PATTERN_STORED = 'pattern:stored',
  PATTERN_RETRIEVED = 'pattern:retrieved',
  PATTERN_APPLIED = 'pattern:applied',
  PATTERN_EXECUTION_RESULT = 'pattern:executionResult',
  PATTERN_EFFECTIVENESS_UPDATED = 'pattern:effectivenessUpdated',
  PATTERN_REFINED = 'pattern:refined',
  PATTERN_EVOLUTION_TRIGGERED = 'pattern:evolutionTriggered'
}
