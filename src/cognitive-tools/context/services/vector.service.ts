import { OpenAIService } from '../../../services/openai.service';
import { PineconeService } from '../../../services/pinecone.service';
import { Result } from '../../../types/common';
import {
  VectorOperations,
  VectorQueryOptions,
  SimilarityMatch,
  ClusterResult,
  VectorError
} from '../types/vector';
import { VectorCacheService, DEFAULT_CACHE_CONFIG } from './vector-cache.service';

/**
 * Service for vector operations including embedding generation and similarity search
 */
export class VectorService implements VectorOperations {
  private openai: OpenAIService;
  private pinecone: PineconeService;
  private cache: VectorCacheService;

  constructor(
    openai: OpenAIService,
    pinecone: PineconeService,
    cache?: VectorCacheService
  ) {
    this.openai = openai;
    this.pinecone = pinecone;
    this.cache = cache || new VectorCacheService(DEFAULT_CACHE_CONFIG);
  }

  /**
   * Generate embedding for a single text
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Check cache first
      const cached = await this.cache.get(this.getCacheKey(text));
      if (cached) {
        return cached;
      }

      // Generate embedding
      const embedding = await this.openai.createEmbedding(text);

      // Cache result
      await this.cache.set(this.getCacheKey(text), embedding);

      return embedding;
    } catch (error) {
      throw this.createError('Failed to generate embedding', error);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  public async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const results: number[][] = [];
      const uncachedTexts: { text: string; index: number }[] = [];

      // Check cache first
      for (let i = 0; i < texts.length; i++) {
        const cached = await this.cache.get(this.getCacheKey(texts[i]));
        if (cached) {
          results[i] = cached;
        } else {
          uncachedTexts.push({ text: texts[i], index: i });
        }
      }

      if (uncachedTexts.length > 0) {
        // Generate embeddings for uncached texts
        const embeddings = await this.openai.createEmbeddings(
          uncachedTexts.map(t => t.text)
        );

        // Cache results and populate results array
        for (let i = 0; i < embeddings.length; i++) {
          const { text, index } = uncachedTexts[i];
          await this.cache.set(this.getCacheKey(text), embeddings[i]);
          results[index] = embeddings[i];
        }
      }

      return results;
    } catch (error) {
      throw this.createError('Failed to generate embeddings in batch', error);
    }
  }

  /**
   * Find similar vectors
   */
  public async findSimilar(
    vector: number[],
    options?: VectorQueryOptions
  ): Promise<SimilarityMatch[]> {
    try {
      const results = await this.pinecone.findSimilar(vector, {
        namespace: options?.filterTypes?.join(','),
        topK: options?.maxResults || 10,
        minScore: options?.threshold || 0.7
      });

      return results.map(result => ({
        id: result.id,
        score: result.score,
        vector: result.vector,
        metadata: result.metadata
      }));
    } catch (error) {
      throw this.createError('Failed to find similar vectors', error);
    }
  }

  /**
   * Cluster vectors using k-means algorithm
   */
  public async clusterVectors(vectors: number[][]): Promise<ClusterResult[]> {
    try {
      // Implementation of k-means clustering
      const k = Math.min(5, Math.ceil(Math.sqrt(vectors.length / 2)));
      const clusters = await this.kMeansClustering(vectors, k);

      return clusters.map((cluster, i) => ({
        centroid: cluster.centroid,
        members: cluster.members.map(m => m.toString()),
        cohesion: cluster.cohesion,
        metadata: {
          size: cluster.members.length,
          averageSimilarity: cluster.averageSimilarity,
          dominantType: cluster.dominantType
        }
      }));
    } catch (error) {
      throw this.createError('Failed to cluster vectors', error);
    }
  }

  /**
   * K-means clustering implementation
   */
  private async kMeansClustering(
    vectors: number[][],
    k: number
  ): Promise<{
    centroid: number[];
    members: number[];
    cohesion: number;
    averageSimilarity: number;
    dominantType?: string;
  }[]> {
    // Initialize centroids randomly
    let centroids = vectors
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, k);

    let previousCentroids: number[][] = [];
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations && !this.centroidsConverged(centroids, previousCentroids)) {
      previousCentroids = centroids;

      // Assign vectors to nearest centroid
      const clusters = new Array(k).fill(null).map(() => [] as number[][]);
      for (const vector of vectors) {
        const nearestCentroidIndex = this.findNearestCentroid(vector, centroids);
        clusters[nearestCentroidIndex].push(vector);
      }

      // Update centroids
      centroids = clusters.map(cluster =>
        cluster.length > 0 ? this.calculateCentroid(cluster) : this.generateRandomVector(vectors[0].length)
      );

      iterations++;
    }

    // Calculate cluster metrics
    return centroids.map((centroid, i) => {
      const members = vectors
        .map((v, index) => ({ vector: v, index }))
        .filter(v => this.findNearestCentroid(v.vector, centroids) === i)
        .map(v => v.index);

      const memberVectors = members.map(m => vectors[m]);
      const cohesion = this.calculateClusterCohesion(memberVectors, centroid);
      const averageSimilarity = this.calculateAverageSimilarity(memberVectors);

      return {
        centroid,
        members,
        cohesion,
        averageSimilarity,
        dominantType: undefined // Would be set based on metadata analysis
      };
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Find nearest centroid to a vector
   */
  private findNearestCentroid(vector: number[], centroids: number[][]): number {
    let maxSimilarity = -1;
    let nearestIndex = 0;

    centroids.forEach((centroid, index) => {
      const similarity = this.cosineSimilarity(vector, centroid);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  /**
   * Calculate centroid of a cluster
   */
  private calculateCentroid(vectors: number[][]): number[] {
    const dimension = vectors[0].length;
    const centroid = new Array(dimension).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += vector[i];
      }
    }

    for (let i = 0; i < dimension; i++) {
      centroid[i] /= vectors.length;
    }

    return centroid;
  }

  /**
   * Check if centroids have converged
   */
  private centroidsConverged(current: number[][], previous: number[][]): boolean {
    if (current.length !== previous.length) return false;
    const threshold = 0.0001;

    for (let i = 0; i < current.length; i++) {
      const similarity = this.cosineSimilarity(current[i], previous[i]);
      if (similarity < (1 - threshold)) return false;
    }

    return true;
  }

  /**
   * Calculate cluster cohesion
   */
  private calculateClusterCohesion(vectors: number[][], centroid: number[]): number {
    if (vectors.length === 0) return 0;
    return vectors.reduce((sum, vector) =>
      sum + this.cosineSimilarity(vector, centroid), 0
    ) / vectors.length;
  }

  /**
   * Calculate average similarity between vectors
   */
  private calculateAverageSimilarity(vectors: number[][]): number {
    if (vectors.length < 2) return 1;
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        totalSimilarity += this.cosineSimilarity(vectors[i], vectors[j]);
        comparisons++;
      }
    }

    return totalSimilarity / comparisons;
  }

  /**
   * Generate random vector for initialization
   */
  private generateRandomVector(dimension: number): number[] {
    return Array.from({ length: dimension }, () => Math.random() * 2 - 1);
  }

  /**
   * Get cache key for text
   */
  private getCacheKey(text: string): string {
    return `embedding:${Buffer.from(text).toString('base64')}`;
  }

  /**
   * Create error object
   */
  private createError(message: string, details?: unknown): VectorError {
    return {
      code: 'EMBEDDING_FAILED',
      message,
      details
    };
  }
}
