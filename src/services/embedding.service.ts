import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { Cache } from '../utils/cache';
import { VectorConfig, VectorMetadata } from '../types/vector-knowledge';

/**
 * Service for converting text to vector embeddings using OpenAI
 */
export class EmbeddingService {
    private openai: OpenAI;
    private config: VectorConfig;
    private logger: Logger;
    private rateLimiter: RateLimiter;
    private cache: Cache;

    constructor(config: VectorConfig) {
        this.config = config;
        this.logger = new Logger('EmbeddingService');

        // Initialize OpenAI client
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });

        // Initialize rate limiter (OpenAI has a rate limit of 3000 RPM)
        this.rateLimiter = new RateLimiter({
            maxRequests: 2500, // Leave some buffer
            perSeconds: 60
        });

        // Initialize cache
        this.cache = new Cache({
            ttl: 24 * 60 * 60 * 1000, // 24 hours
            maxSize: 10000 // Store up to 10k embeddings
        });
    }

    /**
     * Convert text to vector embedding
     */
    public async embed(text: string): Promise<number[]> {
        // Check cache first
        const cacheKey = `embedding:${text}`;
        const cached = this.cache.get<number[]>(cacheKey);
        if (cached) {
            return cached;
        }

        await this.rateLimiter.acquire();

        try {
            const response = await this.openai.embeddings.create({
                model: this.config.openai.model,
                input: text
            });

            const embedding = response.data[0].embedding;

            // Cache the result
            this.cache.set(cacheKey, embedding);

            return embedding;
        } catch (error) {
            this.logger.error('Failed to create embedding', error);
            throw error;
        }
    }

    /**
     * Convert multiple texts to vector embeddings in batch
     */
    public async embedBatch(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        const uncachedTexts: string[] = [];
        const uncachedIndices: number[] = [];

        // Check cache first
        texts.forEach((text, index) => {
            const cacheKey = `embedding:${text}`;
            const cached = this.cache.get<number[]>(cacheKey);
            if (cached) {
                embeddings[index] = cached;
            } else {
                uncachedTexts.push(text);
                uncachedIndices.push(index);
            }
        });

        if (uncachedTexts.length === 0) {
            return embeddings;
        }

        await this.rateLimiter.acquire();

        try {
            const response = await this.openai.embeddings.create({
                model: this.config.openai.model,
                input: uncachedTexts
            });

            // Store results in cache and array
            response.data.forEach((item: { embedding: number[] }, i: number) => {
                const text = uncachedTexts[i];
                const index = uncachedIndices[i];
                const embedding = item.embedding;

                // Cache the result
                this.cache.set(`embedding:${text}`, embedding);

                // Store in array at original index
                embeddings[index] = embedding;
            });

            return embeddings;
        } catch (error) {
            this.logger.error('Failed to create batch embeddings', error);
            throw error;
        }
    }

    /**
     * Split text into chunks suitable for embedding
     */
    public chunk(text: string): string[] {
        const maxTokens = this.config.chunking.maxTokens;
        const overlap = this.config.chunking.overlap;
        const minLength = this.config.chunking.minLength;

        // Simple chunking by paragraphs first
        const paragraphs = text.split('\n\n');
        const chunks: string[] = [];
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            // If paragraph is too long, split by sentences
            if (this.estimateTokens(paragraph) > maxTokens) {
                const sentences = paragraph.split(/[.!?]+/);
                for (const sentence of sentences) {
                    if (this.estimateTokens(currentChunk + sentence) > maxTokens) {
                        if (currentChunk.length >= minLength) {
                            chunks.push(currentChunk.trim());
                        }
                        currentChunk = sentence;
                    } else {
                        currentChunk += ' ' + sentence;
                    }
                }
            }
            // If adding paragraph doesn't exceed max tokens
            else if (this.estimateTokens(currentChunk + paragraph) <= maxTokens) {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
            // If adding paragraph would exceed max tokens
            else {
                if (currentChunk.length >= minLength) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = paragraph;
            }
        }

        // Add final chunk
        if (currentChunk.length >= minLength) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Split text into overlapping chunks
     */
    public chunkWithOverlap(text: string, overlap: number): string[] {
        const chunks = this.chunk(text);
        const overlappingChunks: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // Add the main chunk
            overlappingChunks.push(chunk);

            // If not the last chunk, create overlap with next chunk
            if (i < chunks.length - 1) {
                const nextChunk = chunks[i + 1];
                const overlapText = this.createOverlap(chunk, nextChunk, overlap);
                if (overlapText) {
                    overlappingChunks.push(overlapText);
                }
            }
        }

        return overlappingChunks;
    }

    /**
     * Extract metadata from text content
     */
    public async extractMetadata(text: string): Promise<Partial<VectorMetadata>> {
        // Use OpenAI to extract metadata
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'Extract metadata from the following text. Return a JSON object with title, summary, tags, and categories.'
                    } as ChatCompletionMessageParam,
                    {
                        role: 'user',
                        content: text
                    } as ChatCompletionMessageParam
                ],
                temperature: 0.5,
                max_tokens: 500
            });

            const content = response.choices[0].message?.content;
            if (!content) {
                throw new Error('No content in response');
            }

            const metadata = JSON.parse(content);
            return {
                title: metadata.title,
                summary: metadata.summary,
                tags: metadata.tags || [],
                categories: metadata.categories || [],
                confidence: 0.8 // Arbitrary confidence score
            };
        } catch (error) {
            this.logger.error('Failed to extract metadata', error);
            // Return basic metadata on error
            return {
                title: text.slice(0, 100),
                tags: [],
                categories: [],
                confidence: 0.5
            };
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    public calculateSimilarity(vector1: number[], vector2: number[]): number {
        if (vector1.length !== vector2.length) {
            throw new Error('Vectors must have same length');
        }

        const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0));

        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Calculate average of multiple vectors
     */
    public averageVectors(vectors: number[][]): number[] {
        if (vectors.length === 0) {
            throw new Error('Cannot average empty vector array');
        }

        const dimension = vectors[0].length;
        const sum = new Array(dimension).fill(0);

        for (const vector of vectors) {
            if (vector.length !== dimension) {
                throw new Error('All vectors must have same length');
            }
            for (let i = 0; i < dimension; i++) {
                sum[i] += vector[i];
            }
        }

        return sum.map(value => value / vectors.length);
    }

    /**
     * Create overlap between two chunks
     */
    private createOverlap(chunk1: string, chunk2: string, overlapTokens: number): string | null {
        const words1 = chunk1.split(' ');
        const words2 = chunk2.split(' ');

        // Get last N words of first chunk
        const end1 = words1.slice(-overlapTokens);

        // Get first N words of second chunk
        const start2 = words2.slice(0, overlapTokens);

        // Combine with some context
        const overlapText = [...end1, ...start2].join(' ');

        // Only return if overlap is meaningful
        return overlapText.length > 50 ? overlapText : null;
    }

    /**
     * Estimate number of tokens in text
     * This is a rough estimate - OpenAI's tokenizer is more complex
     */
    private estimateTokens(text: string): number {
        // Rough estimate: 1 token = 4 characters
        return Math.ceil(text.length / 4);
    }
}
