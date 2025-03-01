// Services
export { ConfigService } from './services/config.service.js';
export { OpenAIService } from './services/openai.service.js';
export { PineconeService } from './services/pinecone.service.js';
export { VectorService } from './services/vector.service.js';
export { VectorCacheService, DEFAULT_CACHE_CONFIG } from './services/vector-cache.service.js';

// Types
export type {
  VectorOperationResult,
  VectorError,
  VectorErrorCode,
  VectorQueryOptions,
  VectorStorageOptions,
  VectorBatchOptions,
  VectorMetadata,
  VectorResponse,
  VectorCacheConfig,
  VectorCache,
  VectorService as VectorServiceInterface,
  VectorCacheService as VectorCacheServiceInterface,
  ClusterResult
} from './types/vector-operations.js';

// Example
export { runExample } from './examples/vector-operations-example.js';
