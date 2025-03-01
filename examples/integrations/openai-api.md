# OpenAI API Integration

This document provides examples and best practices for integrating with the OpenAI API in our system.

## Overview

Our system integrates with OpenAI's API to provide advanced natural language processing capabilities, including:

1. Text embeddings for semantic search
2. Completion and chat models for text generation
3. Knowledge storage and retrieval via vector database

## Configuration

The OpenAI API integration is configured in the `.env` file:

```
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4-turbo
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

## Basic Usage

### Text Embeddings

```typescript
import { OpenAIService } from '../services/openai.service';

const openaiService = new OpenAIService();

// Generate embeddings for a text
const text = "This is a sample text for embedding";
const embedding = await openaiService.createEmbedding(text);

console.log(`Generated embedding with ${embedding.length} dimensions`);
```

### Text Completion

```typescript
import { OpenAIService } from '../services/openai.service';

const openaiService = new OpenAIService();

// Generate text completion
const prompt = "Write a short poem about artificial intelligence";
const completion = await openaiService.createCompletion(prompt);

console.log("Generated text:", completion);
```

## Knowledge System Integration

The OpenAI API is now fully integrated with our Knowledge System, allowing for semantic storage and retrieval of information using vector embeddings.

### Architecture

```mermaid
flowchart LR
    A[Text Input] --> B[OpenAI API]
    B --> C[Embeddings]
    C --> D[Pinecone Vector DB]
    D --> E[Semantic Search]
    E --> F[Knowledge Retrieval]
```

### Storing Knowledge

```typescript
import { KnowledgeService } from '../services/knowledge.service';

const knowledgeService = new KnowledgeService();

// Store a memory with metadata
await knowledgeService.storeMemory(
  "The tensor operations in our Neural Computation Framework are now complete.",
  {
    category: "development",
    tags: ["neural-computation", "tensor", "milestone"],
    importance: "high"
  }
);
```

### Retrieving Knowledge

```typescript
import { KnowledgeService } from '../services/knowledge.service';

const knowledgeService = new KnowledgeService();

// Query memories by semantic similarity
const query = "What's the status of tensor operations?";
const results = await knowledgeService.queryMemories(query, 3);

console.log("Retrieved memories:", results);
```

### Using the MCP Knowledge System

Our system now includes a fully operational MCP server for knowledge storage and retrieval. This server uses OpenAI embeddings and Pinecone vector database for efficient semantic search.

#### Direct Access Example

```javascript
const { mcpDirectAccess } = require('../utils/mcp-direct-access');

// Start the knowledge system server
const server = mcpDirectAccess.startServer('knowledge-system', true); // Use enhanced version

// Store a memory
const storeResponse = await mcpDirectAccess.storeMemory(
  server,
  'The Pinecone data format issue has been resolved.',
  {
    category: 'bugfix',
    tags: ['pinecone', 'data-format', 'knowledge-system'],
    priority: 'high'
  }
);
console.log('Memory stored:', storeResponse);

// Query memories
const queryResponse = await mcpDirectAccess.queryMemories(
  server,
  'What issues were fixed with Pinecone?'
);
console.log('Query results:', queryResponse);

// Shutdown the server when done
mcpDirectAccess.stopServer(server);
```

#### Using the MCP Tool

```javascript
// Using the MCP tool in Claude
const result = await use_mcp_tool({
  server_name: "knowledge-system",
  tool_name: "store_memory",
  arguments: {
    text: "The Neural Computation Framework now supports tensor operations.",
    metadata: {
      category: "development",
      tags: ["neural-computation", "tensor"]
    }
  }
});

// Query stored memories
const memories = await use_mcp_tool({
  server_name: "knowledge-system",
  tool_name: "query_memories",
  arguments: {
    query: "What features does the Neural Computation Framework have?",
    limit: 5
  }
});
```

## Advanced Usage

### Vector Database Integration

Our system integrates OpenAI embeddings with Pinecone vector database for efficient storage and retrieval of semantic information.

```typescript
import { VectorService } from '../services/vector.service';

const vectorService = new VectorService();

// Store a vector with metadata
const text = "Important information about the project";
await vectorService.storeVector(text, {
  source: "documentation",
  timestamp: new Date().toISOString(),
  category: "project-info"
});

// Query vectors by similarity
const query = "Tell me about the project";
const results = await vectorService.queryVectors(query, 5);
```

### Semantic Engine

The Semantic Engine combines OpenAI's language understanding with our pattern detection system.

```typescript
import { SemanticEngine } from '../services/semantic-engine.service';

const semanticEngine = new SemanticEngine();

// Analyze text for patterns
const text = "The system performance has improved by 25% after the recent optimization.";
const analysis = await semanticEngine.analyzeText(text);

console.log("Detected entities:", analysis.entities);
console.log("Sentiment:", analysis.sentiment);
console.log("Key concepts:", analysis.concepts);
```

## Best Practices

1. **Rate Limiting**: Use the rate limiter utility to avoid hitting OpenAI API rate limits
   ```typescript
   import { RateLimiter } from '../utils/rate-limiter';

   const rateLimiter = new RateLimiter('openai', 60, 3000); // 3000 tokens per minute
   await rateLimiter.waitForCapacity(tokenCount);
   ```

2. **Caching**: Cache embeddings and completions to reduce API calls
   ```typescript
   import { Cache } from '../utils/cache';

   const cache = new Cache('openai-embeddings');
   const cachedEmbedding = cache.get(text);

   if (cachedEmbedding) {
     return cachedEmbedding;
   }

   const embedding = await openaiService.createEmbedding(text);
   cache.set(text, embedding, 86400); // Cache for 24 hours
   ```

3. **Error Handling**: Implement robust error handling for API calls
   ```typescript
   try {
     const embedding = await openaiService.createEmbedding(text);
     return embedding;
   } catch (error) {
     if (error.status === 429) {
       console.error("Rate limit exceeded, retrying after delay");
       await sleep(2000);
       return await openaiService.createEmbedding(text);
     }
     throw error;
   }
   ```

4. **Batching**: Batch requests when processing multiple items
   ```typescript
   const texts = ["Text 1", "Text 2", "Text 3"];
   const embeddings = await openaiService.createEmbeddingBatch(texts);
   ```

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Ensure the `OPENAI_API_KEY` is correctly set in the `.env` file
   - Verify the API key has the necessary permissions

2. **Rate Limiting**
   - Implement exponential backoff for retries
   - Use the rate limiter utility to manage request rates

3. **Model Availability**
   - Check that the specified model is available in your OpenAI account
   - Fall back to an alternative model if necessary

### Diagnostic Tools

We've created several diagnostic tools to help troubleshoot OpenAI API integration issues:

- `src/test/openai.test.ts`: Unit tests for OpenAI service
- `src/test/openai.integration.test.ts`: Integration tests for OpenAI API
- `src/test/vector-knowledge.test.ts`: Tests for vector knowledge storage and retrieval

## References

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI Service Implementation](../src/services/openai.service.ts)
- [Vector Service Implementation](../src/services/vector.service.ts)
- [Knowledge System Integration Status](../src/docs/knowledge-system-integration-status.md)
- [Pinecone Data Format Fix](../src/docs/pinecone-data-format-fix.md)
