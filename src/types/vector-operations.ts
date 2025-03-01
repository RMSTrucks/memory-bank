/**
 * Result of a vector operation
 */
export interface VectorOperationResult {
  id: string;
  score: number;
  vector: number[];
  metadata?: Record<string, any>;
}

/**
 * Error codes for vector operations
 */
export type VectorErrorCode = 'EMBEDDING_FAILED' | 'STORAGE_FAILED' | 'QUERY_FAILED' | 'CACHE_ERROR';

/**
 * Error from vector operations
 */
export interface VectorError {
  code: VectorErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Options for vector queries
 */
export interface VectorQueryOptions {
  namespace?: string;
  topK?: number;
  minScore?: number;
  maxResults?: number;
  threshold?: number;
  filterTypes?: string[];
  includeMetadata?: boolean;
  includeValues?: boolean;
}

/**
 * Options for vector storage
 */
export interface VectorStorageOptions {
  namespace?: string;
  metadata?: Record<string, any>;
  overwrite?: boolean;
}

/**
 * Options for batch operations
 */
export interface VectorBatchOptions extends VectorStorageOptions {
  batchSize?: number;
  concurrency?: number;
}

/**
 * Vector metadata
 */
export interface VectorMetadata {
  [key: string]: string | number | boolean | null | VectorMetadata;
}

/**
 * Vector response from external APIs
 */
export interface VectorResponse {
  id: string;
  values: number[];
  metadata?: VectorMetadata;
  score?: number;
}

/**
 * Vector cache configuration
 */
export interface VectorCacheConfig {
  ttl: number;
  maxSize: number;
  namespace?: string;
  enabled?: boolean;
}

/**
 * Vector cache interface
 */
export interface VectorCache {
  get(key: string): Promise<number[] | null>;
  set(key: string, vector: number[], ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Vector service interface
 */
export interface VectorService {
  createEmbedding(text: string): Promise<number[]>;
  createEmbeddings(texts: string[]): Promise<number[][]>;
  storeVector(id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
  findSimilar(vector: number[], options?: VectorQueryOptions): Promise<VectorOperationResult[]>;
  deleteVector(id: string): Promise<void>;
}

/**
 * Vector cache service interface
 */
export interface VectorCacheService {
  get(key: string): Promise<number[] | null>;
  set(key: string, vector: number[], ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Cluster result interface
 */
export interface ClusterResult {
  centroid: number[];
  members: VectorOperationResult[];
  score: number;
  cohesion: number;
  metadata: {
    size: number;
    averageSimilarity: number;
    dominantType?: string;
  };
}
