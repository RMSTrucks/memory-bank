import { Priority } from '../../../types/common';
import { Requirement } from './requirement';

/**
 * Result of a similarity search
 */
export interface SimilarityMatch {
  id: string;
  score: number;
  vector: number[];
  metadata?: Record<string, unknown>;
}

/**
 * Result of vector clustering
 */
export interface ClusterResult {
  centroid: number[];
  members: string[];
  cohesion: number;
  metadata: {
    size: number;
    averageSimilarity: number;
    dominantType?: string;
  };
}

/**
 * Vector representation of a requirement
 */
export interface RequirementVector {
  requirementId: string;
  vector: number[];
  metadata: {
    type: Requirement['type'];
    priority: Priority;
    timestamp: Date;
    tags: string[];
  };
}

/**
 * Options for vector queries
 */
export interface VectorQueryOptions {
  threshold?: number;
  contextSize?: number;
  filterTypes?: Requirement['type'][];
  includeMetadata?: boolean;
  maxResults?: number;
}

/**
 * Cache configuration for vector operations
 */
export interface VectorCacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  namespace?: string;
}

/**
 * Vector operations interface
 */
export interface VectorOperations {
  generateEmbedding(text: string): Promise<number[]>;
  batchGenerateEmbeddings(texts: string[]): Promise<number[][]>;
  findSimilar(vector: number[], options?: VectorQueryOptions): Promise<SimilarityMatch[]>;
  clusterVectors(vectors: number[][]): Promise<ClusterResult[]>;
}

/**
 * Vector cache interface
 */
export interface VectorCache {
  get(key: string): Promise<number[] | null>;
  set(key: string, vector: number[]): Promise<void>;
  invalidate(key: string): Promise<void>;
  clear(): Promise<void>;
  stats(): Promise<{
    hits: number;
    misses: number;
    size: number;
  }>;
}

/**
 * Relationship suggestion based on vector similarity
 */
export interface RelationshipSuggestion {
  sourceId: string;
  targetId: string;
  confidence: number;
  type: 'similar_to' | 'depends_on' | 'related_to' | 'implements';
  evidence: {
    similarityScore: number;
    sharedContexts: string[];
    commonPatterns: string[];
  };
}

/**
 * Cluster of related requirements
 */
export interface RequirementCluster {
  id: string;
  centroid: number[];
  requirements: string[];
  metadata: {
    size: number;
    cohesion: number;
    dominantType?: Requirement['type'];
    commonTags: string[];
    averagePriority: Priority;
  };
  suggestedName?: string;
  suggestedPattern?: string;
}

/**
 * Vector analysis result
 */
export interface VectorAnalysisResult {
  clusters: RequirementCluster[];
  relationships: RelationshipSuggestion[];
  metrics: {
    totalVectors: number;
    averageSimilarity: number;
    clusterCount: number;
    relationshipCount: number;
    patternCoverage: number;
  };
  insights: {
    type: 'pattern' | 'relationship' | 'cluster';
    description: string;
    confidence: number;
    evidence: string[];
  }[];
}

/**
 * Vector operation error
 */
export interface VectorError {
  code: 'EMBEDDING_FAILED' | 'SIMILARITY_FAILED' | 'CLUSTERING_FAILED' | 'CACHE_ERROR';
  message: string;
  details?: unknown;
}
