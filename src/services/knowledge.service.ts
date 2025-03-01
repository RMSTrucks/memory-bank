import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { Cache } from '../utils/cache';
import { EmbeddingService } from './embedding.service';
import { VectorConfig, VectorMetadata, VectorRecord, VectorOperationOptions, VectorQueryResult } from '../types/vector-knowledge';
import { PineconeClient, PineconeIndex, PineconeMatch, PineconeQuery, PineconeUpsertRequest } from '../types/pinecone';

/**
 * Service for managing knowledge in vector database
 */
export class KnowledgeService {
    private pinecone: PineconeClient;
    private config: VectorConfig;
    private logger: Logger;
    private rateLimiter: RateLimiter;
    private cache: Cache;
    private embeddingService: EmbeddingService;

    constructor(config: VectorConfig, embeddingService: EmbeddingService) {
        this.config = config;
        this.pinecone = new (require('@pinecone-database/pinecone').PineconeClient)();
        this.embeddingService = embeddingService;
        this.logger = new Logger('KnowledgeService');

        // Initialize rate limiter (Pinecone free tier: 100 requests/second)
        this.rateLimiter = new RateLimiter({
            maxRequests: 90, // Leave some buffer
            perSeconds: 1
        });

        // Initialize cache
        this.cache = new Cache({
            ttl: 5 * 60 * 1000, // 5 minutes
            maxSize: 1000
        });
    }

    /**
     * Initialize Pinecone client
     */
    public async initialize(): Promise<void> {
        try {
            await this.pinecone.init({
                apiKey: this.config.pinecone.apiKey,
                environment: this.config.pinecone.environment
            });

            this.logger.info('Initialized Pinecone client');
        } catch (error) {
            this.logger.error('Failed to initialize Pinecone client', error);
            throw error;
        }
    }

    /**
     * Index document content in vector database
     */
    public async indexDocument(content: string, metadata?: Partial<VectorMetadata>): Promise<string[]> {
        try {
            // Extract metadata if not provided
            const extractedMetadata = metadata || await this.embeddingService.extractMetadata(content);

            // Split content into chunks
            const chunks = this.embeddingService.chunk(content);
            const vectors: VectorRecord[] = [];

            // Create embeddings for each chunk
            const embeddings = await this.embeddingService.embedBatch(chunks);

            // Create vector records
            chunks.forEach((chunk, i) => {
                const id = uuidv4();
                const vectorMetadata: VectorMetadata = {
                    title: extractedMetadata.title || chunk.slice(0, 100),
                    content: chunk,
                    summary: extractedMetadata.summary || '',
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: 1,
                    source: 'document',
                    sourceId: id,
                    sourcePath: extractedMetadata.sourcePath,
                    relationships: [],
                    childIds: [],
                    tags: extractedMetadata.tags || [],
                    categories: extractedMetadata.categories || [],
                    confidence: extractedMetadata.confidence || 1.0,
                    domain: extractedMetadata.domain,
                    project: extractedMetadata.project,
                    context: extractedMetadata.context
                };

                vectors.push({
                    id,
                    vector: embeddings[i],
                    metadata: vectorMetadata
                });
            });

            // Upsert vectors in batches
            const batchSize = this.config.indexing.batchSize;
            for (let i = 0; i < vectors.length; i += batchSize) {
                const batch = vectors.slice(i, i + batchSize);
                await this.upsertVectors(batch);
            }

            return vectors.map(v => v.id);
        } catch (error) {
            this.logger.error('Failed to index document', error);
            throw error;
        }
    }

    /**
     * Search knowledge base using text query
     */
    public async searchKnowledge(query: string, options?: VectorOperationOptions): Promise<VectorQueryResult> {
        try {
            // Generate embedding for query
            const queryVector = await this.embeddingService.embed(query);

            // Search vector database
            return this.queryVectors(queryVector, options);
        } catch (error) {
            this.logger.error('Failed to search knowledge', error);
            throw error;
        }
    }

    /**
     * Find related vectors by ID
     */
    public async findRelated(id: string, options?: VectorOperationOptions): Promise<VectorQueryResult> {
        try {
            // Get vector by ID
            const vector = await this.getVector(id);
            if (!vector) {
                throw new Error(`Vector not found: ${id}`);
            }

            // Search for similar vectors
            return this.queryVectors(vector.vector, options);
        } catch (error) {
            this.logger.error('Failed to find related vectors', error);
            throw error;
        }
    }

    /**
     * Update vector relationships
     */
    public async updateRelationships(id: string, relationships: VectorRecord['metadata']['relationships']): Promise<void> {
        try {
            // Get existing vector
            const vector = await this.getVector(id);
            if (!vector) {
                throw new Error(`Vector not found: ${id}`);
            }

            // Update relationships
            vector.metadata.relationships = relationships;
            vector.metadata.updated = new Date().toISOString();

            // Upsert updated vector
            await this.upsertVectors([vector]);
        } catch (error) {
            this.logger.error('Failed to update relationships', error);
            throw error;
        }
    }

    /**
     * Analyze knowledge vectors
     */
    public async analyzeKnowledge(ids: string[]): Promise<{
        summary: string;
        concepts: string[];
        patterns: string[];
        gaps: string[];
    }> {
        try {
            // Get vectors by IDs
            const vectors = await Promise.all(ids.map(id => this.getVector(id)));
            const validVectors = vectors.filter((v): v is VectorRecord => v !== undefined);

            // Extract content from vectors
            const content = validVectors.map(v => v.metadata.content).join('\n\n');

            // Use OpenAI to analyze content
            const response = await this.embeddingService.extractMetadata(content);

            return {
                summary: response.summary || '',
                concepts: response.tags || [],
                patterns: response.categories || [],
                gaps: [] // TODO: Implement gap detection
            };
        } catch (error) {
            this.logger.error('Failed to analyze knowledge', error);
            throw error;
        }
    }

    /**
     * Upsert vectors in database
     */
    private async upsertVectors(vectors: VectorRecord[]): Promise<void> {
        await this.rateLimiter.acquire();

        try {
            const index = this.pinecone.Index(this.config.pinecone.indexName);

            const upsertRequest: PineconeUpsertRequest = {
                vectors: vectors.map(vector => ({
                    id: vector.id,
                    values: vector.vector,
                    metadata: vector.metadata
                })),
                namespace: this.config.pinecone.namespace
            };

            await index.upsert({ upsertRequest });

            // Invalidate cache for these vectors
            vectors.forEach(vector => this.cache.delete(vector.id));
        } catch (error) {
            this.logger.error('Failed to upsert vectors', error);
            throw error;
        }
    }

    /**
     * Query vectors in database
     */
    private async queryVectors(vector: number[], options?: VectorOperationOptions): Promise<VectorQueryResult> {
        await this.rateLimiter.acquire();

        try {
            const index = this.pinecone.Index(this.config.pinecone.indexName);

            const queryRequest: PineconeQuery = {
                vector,
                topK: options?.topK || 10,
                namespace: options?.namespace || this.config.pinecone.namespace,
                includeMetadata: options?.includeMetadata ?? true,
                includeValues: options?.includeValues ?? false
            };

            if (options?.filter) {
                queryRequest.filter = this.buildFilter(options.filter);
            }

            const response = await index.query({ queryRequest });

            return {
                matches: response.matches.map((match: PineconeMatch) => ({
                    id: match.id,
                    score: match.score,
                    metadata: match.metadata as VectorMetadata,
                    vector: match.values
                })),
                namespace: options?.namespace || this.config.pinecone.namespace,
                totalFound: response.matches.length
            };
        } catch (error) {
            this.logger.error('Failed to query vectors', error);
            throw error;
        }
    }

    /**
     * Get vector by ID
     */
    private async getVector(id: string): Promise<VectorRecord | undefined> {
        // Check cache first
        const cached = this.cache.get<VectorRecord>(id);
        if (cached) {
            return cached;
        }

        await this.rateLimiter.acquire();

        try {
            const index = this.pinecone.Index(this.config.pinecone.indexName);
            const response = await index.fetch({
                ids: [id],
                namespace: this.config.pinecone.namespace
            });

            const vector = response.vectors[id];
            if (!vector) {
                return undefined;
            }

            const record: VectorRecord = {
                id,
                vector: vector.values,
                metadata: vector.metadata as VectorMetadata
            };

            // Cache the result
            this.cache.set(id, record);

            return record;
        } catch (error) {
            this.logger.error('Failed to get vector', error);
            throw error;
        }
    }

    /**
     * Build Pinecone filter from options
     */
    private buildFilter(filter: any): Record<string, any> {
        const pineconeFilter: Record<string, any> = {};

        if (filter.source) {
            pineconeFilter.$or = filter.source.map((s: string) => ({
                source: { $eq: s }
            }));
        }

        if (filter.tags) {
            pineconeFilter.tags = { $in: filter.tags };
        }

        if (filter.categories) {
            pineconeFilter.categories = { $in: filter.categories };
        }

        if (filter.domain) {
            pineconeFilter.domain = { $in: filter.domain };
        }

        if (filter.project) {
            pineconeFilter.project = { $in: filter.project };
        }

        if (filter.dateRange) {
            pineconeFilter.created = {
                $gte: filter.dateRange.start,
                $lte: filter.dateRange.end
            };
        }

        if (filter.metadata) {
            Object.entries(filter.metadata).forEach(([key, value]) => {
                pineconeFilter[key] = { $eq: value };
            });
        }

        return pineconeFilter;
    }
}
