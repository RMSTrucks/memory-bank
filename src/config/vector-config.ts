import { VectorConfig } from '../types/vector-knowledge';

/**
 * Configuration for vector knowledge system
 */
export const vectorConfig: VectorConfig = {
    pinecone: {
        apiKey: process.env.PINECONE_API_KEY || '',
        environment: process.env.PINECONE_ENVIRONMENT || '',
        projectId: process.env.PINECONE_PROJECT_ID || '',
        indexName: process.env.PINECONE_INDEX_NAME || '',
        namespace: process.env.PINECONE_NAMESPACE || 'default'
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
        dimensions: 1536 // text-embedding-ada-002 dimensions
    },
    chunking: {
        maxTokens: 500, // OpenAI context window size / 2
        overlap: 50,    // Number of tokens to overlap between chunks
        minLength: 100  // Minimum chunk length in characters
    },
    indexing: {
        batchSize: 100,      // Number of vectors to upsert at once
        concurrency: 5,      // Number of concurrent requests
        retryAttempts: 3,    // Number of retry attempts
        retryDelay: 1000     // Delay between retries in milliseconds
    }
};

/**
 * Validate vector configuration
 */
export function validateConfig(config: VectorConfig): void {
    const requiredEnvVars = [
        ['PINECONE_API_KEY', config.pinecone.apiKey],
        ['PINECONE_ENVIRONMENT', config.pinecone.environment],
        ['PINECONE_PROJECT_ID', config.pinecone.projectId],
        ['PINECONE_INDEX_NAME', config.pinecone.indexName],
        ['OPENAI_API_KEY', config.openai.apiKey]
    ];

    const missing = requiredEnvVars
        .filter(([name, value]) => !value)
        .map(([name]) => name);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate chunking config
    if (config.chunking.maxTokens <= 0) {
        throw new Error('maxTokens must be greater than 0');
    }
    if (config.chunking.overlap < 0) {
        throw new Error('overlap must be greater than or equal to 0');
    }
    if (config.chunking.minLength <= 0) {
        throw new Error('minLength must be greater than 0');
    }
    if (config.chunking.overlap >= config.chunking.maxTokens) {
        throw new Error('overlap must be less than maxTokens');
    }

    // Validate indexing config
    if (config.indexing.batchSize <= 0) {
        throw new Error('batchSize must be greater than 0');
    }
    if (config.indexing.concurrency <= 0) {
        throw new Error('concurrency must be greater than 0');
    }
    if (config.indexing.retryAttempts < 0) {
        throw new Error('retryAttempts must be greater than or equal to 0');
    }
    if (config.indexing.retryDelay < 0) {
        throw new Error('retryDelay must be greater than or equal to 0');
    }
}
