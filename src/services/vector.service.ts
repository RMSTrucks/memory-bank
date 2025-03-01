import { ConfigService } from './config.service.js';
import { OpenAIService } from './openai.service.js';
import { PineconeService } from './pinecone.service.js';
import { VectorCacheService, DEFAULT_CACHE_CONFIG } from './vector-cache.service.js';
import {
  VectorOperationResult,
  VectorQueryOptions,
  ClusterResult,
  VectorError
} from '../types/vector-operations.js';

/**
 * Service for vector operations combining OpenAI, Pinecone and caching
 */
export class VectorService {
  private openai: OpenAIService;
  private pinecone: PineconeService;
  private cache: VectorCacheService;

  constructor(config: ConfigService) {
    this.openai = new OpenAIService(config);
    this.pinecone = new PineconeService(config);
    this.cache = new VectorCacheService(DEFAULT_CACHE_CONFIG);
  }

  /**
   * Create embedding for text
   */
  public async createEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${text}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const vector = await this.openai.createEmbedding(text);
    await this.cache.set(cacheKey, vector);
    return vector;
  }

  /**
   * Create embeddings for multiple texts
   */
  public async createEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const vector = await this.createEmbedding(text);
      results.push(vector);
    }
    return results;
  }

  /**
   * Store vector in database
   */
  public async storeVector(
    id: string,
    vector: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.pinecone.storeVector(id, vector, metadata);
  }

  /**
   * Find similar vectors
   */
  public async findSimilar(
    vector: number[],
    options?: VectorQueryOptions
  ): Promise<VectorOperationResult[]> {
    return this.pinecone.findSimilar(vector, options);
  }

  /**
   * Delete vector from database
   */
  public async deleteVector(id: string): Promise<void> {
    await this.pinecone.deleteVector(id);
  }

  /**
   * Cluster similar vectors
   */
  public async clusterVectors(
    vectors: VectorOperationResult[],
    options?: VectorQueryOptions
  ): Promise<ClusterResult[]> {
    const clusters: ClusterResult[] = [];
    const used = new Set<string>();

    for (const vector of vectors) {
      if (used.has(vector.id)) {
        continue;
      }

      const similar = await this.findSimilar(vector.vector, {
        ...options,
        minScore: options?.threshold || 0.8
      });

      const members = similar.filter(v => !used.has(v.id));
      members.forEach(m => used.add(m.id));

      if (members.length > 0) {
        const avgSimilarity = members.reduce((sum, m) => sum + m.score, 0) / members.length;

        clusters.push({
          centroid: vector.vector,
          members,
          score: avgSimilarity,
          cohesion: avgSimilarity,
          metadata: {
            size: members.length,
            averageSimilarity: avgSimilarity,
            dominantType: this.getDominantType(members)
          }
        });
      }
    }

    return clusters;
  }

  /**
   * Get dominant type from vector metadata
   */
  private getDominantType(vectors: VectorOperationResult[]): string | undefined {
    const types = vectors
      .map(v => v.metadata?.type)
      .filter((t): t is string => typeof t === 'string');

    if (types.length === 0) {
      return undefined;
    }

    const counts = new Map<string, number>();
    types.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));

    let maxCount = 0;
    let dominantType: string | undefined;

    counts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });

    return dominantType;
  }

  /**
   * Create error object
   */
  private createError(message: string, details?: unknown): VectorError {
    return {
      code: 'QUERY_FAILED',
      message,
      details
    };
  }
}
