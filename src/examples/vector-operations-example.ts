import { ConfigService } from '../services/config.service.js';
import { VectorService } from '../services/vector.service.js';
import { VectorQueryOptions, VectorOperationResult } from '../types/vector-operations.js';

/**
 * Example demonstrating vector operations
 */
export async function runExample() {
  const config = new ConfigService();
  const vectorService = new VectorService(config);

  // Generate embeddings for texts
  const texts = [
    'The quick brown fox jumps over the lazy dog',
    'A fast auburn canine leaps above the sleepy hound',
    'The lazy dog sleeps while the quick fox runs'
  ];

  console.log('Generating embeddings...');
  const embeddings = await vectorService.createEmbeddings(texts);

  // Store vectors with metadata
  console.log('Storing vectors...');
  for (let i = 0; i < embeddings.length; i++) {
    await vectorService.storeVector(`text_${i}`, embeddings[i], {
      text: texts[i],
      type: 'sentence',
      length: texts[i].length
    });
  }

  // Find similar vectors
  console.log('Finding similar vectors...');
  const queryOptions: VectorQueryOptions = {
    topK: 2,
    minScore: 0.7,
    includeMetadata: true
  };

  const similar = await vectorService.findSimilar(embeddings[0], queryOptions);
  console.log('Similar vectors:', similar);

  // Cluster vectors
  console.log('Clustering vectors...');
  const allVectors: VectorOperationResult[] = [];
  for (let i = 0; i < embeddings.length; i++) {
    allVectors.push({
      id: `text_${i}`,
      vector: embeddings[i],
      score: 1.0,
      metadata: {
        text: texts[i],
        type: 'sentence',
        length: texts[i].length
      }
    });
  }

  const clusters = await vectorService.clusterVectors(allVectors, {
    threshold: 0.8
  });

  console.log('Clusters:', clusters);

  // Clean up
  console.log('Cleaning up...');
  for (let i = 0; i < embeddings.length; i++) {
    await vectorService.deleteVector(`text_${i}`);
  }
}

// Run example if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runExample().catch(console.error);
}
