import { ConfigService } from './config.service.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import { VectorError } from '../types/vector-operations.js';

interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
    [key: string]: any;
  };
}

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
}

/**
 * Service for interacting with OpenAI's API
 */
export class OpenAIService {
  private apiKey: string;
  private model: string;
  private rateLimiter: RateLimiter;

  constructor(config: ConfigService) {
    this.apiKey = config.get('OPENAI_API_KEY');
    this.model = config.get('OPENAI_MODEL') || 'text-embedding-ada-002';
    this.rateLimiter = new RateLimiter({
      maxRequests: 60,
      windowMs: 60000 // 1 minute
    });
  }

  /**
   * Generate embedding for a single text
   */
  public async createEmbedding(text: string): Promise<number[]> {
    try {
      await this.rateLimiter.checkLimit();

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: this.model
        })
      });

      if (!response.ok) {
        const error = await response.json() as OpenAIErrorResponse;
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const result = await response.json() as OpenAIEmbeddingResponse;
      return result.data[0].embedding;
    } catch (error) {
      throw this.createError('Failed to generate embedding', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  public async createEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      await this.rateLimiter.checkLimit();

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: texts,
          model: this.model
        })
      });

      if (!response.ok) {
        const error = await response.json() as OpenAIErrorResponse;
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const result = await response.json() as OpenAIEmbeddingResponse;
      return result.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding);
    } catch (error) {
      throw this.createError('Failed to generate embeddings in batch', error instanceof Error ? error.message : String(error));
    }
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
