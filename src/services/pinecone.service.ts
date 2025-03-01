import { ConfigService } from './config.service.js';
import { VectorOperationResult, VectorError } from '../types/vector-operations.js';

interface PineconeQueryOptions {
  namespace?: string;
  topK?: number;
  minScore?: number;
}

interface PineconeErrorResponse {
  message: string;
  [key: string]: any;
}

interface PineconeQueryResponse {
  matches: Array<{
    id: string;
    score: number;
    values: number[];
    metadata?: Record<string, any>;
  }>;
}

/**
 * Service for interacting with Pinecone vector database
 */
export class PineconeService {
  private apiKey: string;
  private environment: string;
  private indexName: string;
  private baseUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get('PINECONE_API_KEY');
    this.environment = config.get('PINECONE_ENVIRONMENT');
    this.indexName = config.get('PINECONE_INDEX_NAME');
    this.baseUrl = `https://${this.indexName}-${this.environment}.svc.${this.environment}.pinecone.io`;
  }

  /**
   * Store vector in Pinecone
   */
  public async storeVector(
    id: string,
    vector: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectors: [{
            id,
            values: vector,
            metadata
          }]
        })
      });

      if (!response.ok) {
        const error = await response.json() as PineconeErrorResponse;
        throw new Error(error.message || 'Failed to store vector');
      }
    } catch (error) {
      throw this.createError('Failed to store vector', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Find similar vectors in Pinecone
   */
  public async findSimilar(
    vector: number[],
    options?: PineconeQueryOptions
  ): Promise<VectorOperationResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector,
          namespace: options?.namespace,
          topK: options?.topK || 10,
          includeMetadata: true,
          includeValues: true
        })
      });

      if (!response.ok) {
        const error = await response.json() as PineconeErrorResponse;
        throw new Error(error.message || 'Failed to find similar vectors');
      }

      const result = await response.json() as PineconeQueryResponse;
      return result.matches
        .filter(match => !options?.minScore || match.score >= options.minScore)
        .map(match => ({
          id: match.id,
          score: match.score,
          vector: match.values,
          metadata: match.metadata
        }));
    } catch (error) {
      throw this.createError('Failed to find similar vectors', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Delete vector from Pinecone
   */
  public async deleteVector(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vectors/delete`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [id]
        })
      });

      if (!response.ok) {
        const error = await response.json() as PineconeErrorResponse;
        throw new Error(error.message || 'Failed to delete vector');
      }
    } catch (error) {
      throw this.createError('Failed to delete vector', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Create error object
   */
  private createError(message: string, details?: unknown): VectorError {
    return {
      code: 'STORAGE_FAILED',
      message,
      details
    };
  }
}
