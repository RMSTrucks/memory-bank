/**
 * Memory System for Cline
 *
 * This script implements a memory system for Cline that integrates local markdown files
 * with Pinecone vector database for knowledge storage and retrieval.
 *
 * The system allows Cline to:
 * 1. Store important information from interactions in Pinecone
 * 2. Retrieve relevant information when needed
 * 3. Integrate with local markdown files for documentation
 * 4. Learn and improve over time
 */

const fs = require('fs');
const path = require('path');
const mcpDirectAccess = require('../utils/mcp-direct-access');

// Configuration
const CONFIG = {
  // Pinecone namespaces for different types of memories
  namespaces: {
    coreKnowledge: 'cline-core-knowledge',    // Core knowledge about the system
    patterns: 'cline-patterns',               // Detected patterns and learnings
    interactions: 'cline-interactions',       // Important interactions with the user
    documentation: 'cline-documentation',     // Documentation from markdown files
    philosophy: 'cline-philosophy'            // Philosophical frameworks and mindsets
  },

  // Markdown files to include in core knowledge
  coreFiles: [
    'projectbrief.md',
    'productContext.md',
    'systemPatterns.md',
    'techContext.md',
    'activeContext.md',
    'progress.md'
  ],

  // Directories to scan for additional knowledge
  knowledgeDirs: [
    'patterns',
    'library',
    'templates',
    'examples'
  ],

  // File types to include
  includeExtensions: ['.md'],

  // Directories to exclude
  excludeDirs: ['node_modules', '.git', 'build', 'dist', 'coverage'],

  // Chunk size in characters (approximate)
  chunkSize: 1500,

  // Chunk overlap in characters
  chunkOverlap: 150,

  // Delay between chunk processing (ms)
  chunkDelay: 500,

  // Whether to use enhanced server
  useEnhancedServer: true,

  // Maximum number of results to return for queries
  queryLimit: 10
};

// Statistics
const STATS = {
  totalFiles: 0,
  processedFiles: 0,
  totalChunks: 0,
  successfulChunks: 0,
  failedChunks: 0,
  failedFiles: 0,
  startTime: null,
  endTime: null
};

/**
 * Get all relevant files recursively
 */
function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);

      // Check if it's a directory
      if (fs.statSync(filePath).isDirectory()) {
        // Skip excluded directories
        if (!CONFIG.excludeDirs.includes(file)) {
          getAllFiles(filePath, fileList);
        }
      } else {
        // Check if it's a file with included extension
        const ext = path.extname(file);
        if (CONFIG.includeExtensions.includes(ext)) {
          fileList.push(filePath);
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message || error);
  }

  return fileList;
}

/**
 * Split text into chunks
 */
function chunkText(text, filePath) {
  // Simple chunking strategy - split by paragraphs first
  let paragraphs = text.split(/\n\s*\n/);
  let chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start a new one
    if (currentChunk.length + paragraph.length > CONFIG.chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      // Start new chunk with overlap from previous chunk
      const overlapStart = Math.max(0, currentChunk.length - CONFIG.chunkOverlap);
      currentChunk = currentChunk.substring(overlapStart) + '\n\n' + paragraph;
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n';
      }
      currentChunk += paragraph;
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  // If we have no chunks (e.g., empty file), create one empty chunk
  if (chunks.length === 0) {
    chunks.push('');
  }

  return chunks.map((chunk, index) => ({
    content: chunk,
    metadata: {
      source: 'file',
      sourcePath: filePath,
      fileType: path.extname(filePath),
      fileName: path.basename(filePath),
      chunkIndex: index,
      totalChunks: chunks.length,
      lastModified: fs.statSync(filePath).mtime.toISOString()
    }
  }));
}

/**
 * Process a single chunk with proper error handling
 */
async function processChunk(server, chunk, namespace) {
  try {
    // Add a delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, CONFIG.chunkDelay));

    const result = await mcpDirectAccess.storeMemory(
      server,
      chunk.content,
      {
        ...chunk.metadata,
        namespace: namespace
      }
    );

    // Parse the result to check for success
    if (typeof result === 'string' && result.includes("Memory stored successfully")) {
      STATS.successfulChunks++;
      return true;
    } else {
      console.error(`  ✗ Unexpected response format:`, result);
      STATS.failedChunks++;
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Error storing chunk:`, error.message || error);
    STATS.failedChunks++;
    return false;
  }
}

/**
 * Process a file and store its content in Pinecone
 */
async function processFile(server, filePath, namespace) {
  try {
    console.log(`Processing: ${filePath} (namespace: ${namespace})`);

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');

    // Split into chunks
    const chunks = chunkText(content, filePath);

    let successCount = 0;

    // Store each chunk in Pinecone
    for (const chunk of chunks) {
      const success = await processChunk(server, chunk, namespace);

      if (success) {
        successCount++;
        STATS.totalChunks++;
      }
    }

    if (successCount > 0) {
      STATS.processedFiles++;
      console.log(`  ✓ Successfully stored ${successCount}/${chunks.length} chunks`);
      return true;
    } else {
      STATS.failedFiles++;
      console.error(`  ✗ Failed to store any chunks for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message || error);
    STATS.failedFiles++;
    return false;
  }
}

/**
 * Store a memory directly (not from a file)
 */
async function storeMemory(server, text, metadata, namespace) {
  try {
    console.log(`Storing memory in namespace: ${namespace}`);

    const result = await mcpDirectAccess.storeMemory(
      server,
      text,
      {
        ...metadata,
        namespace: namespace,
        timestamp: new Date().toISOString()
      }
    );

    // Parse the result to check for success
    if (typeof result === 'string' && result.includes("Memory stored successfully")) {
      console.log(`  ✓ Memory stored successfully`);
      return true;
    } else {
      console.error(`  ✗ Unexpected response format:`, result);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Error storing memory:`, error.message || error);
    return false;
  }
}

/**
 * Query memories from Pinecone
 */
async function queryMemories(server, query, namespace, limit = CONFIG.queryLimit) {
  try {
    console.log(`Querying memories in namespace: ${namespace}`);
    console.log(`Query: ${query}`);

    const result = await mcpDirectAccess.queryMemories(
      server,
      query,
      limit
    );

    return result;
  } catch (error) {
    console.error(`  ✗ Error querying memories:`, error.message || error);
    return null;
  }
}

/**
 * Process core knowledge files
 */
async function processCoreKnowledge(server) {
  console.log('\n=== Processing Core Knowledge ===');

  for (const file of CONFIG.coreFiles) {
    await processFile(server, file, CONFIG.namespaces.coreKnowledge);
  }
}

/**
 * Process additional knowledge directories
 */
async function processAdditionalKnowledge(server) {
  console.log('\n=== Processing Additional Knowledge ===');

  for (const dir of CONFIG.knowledgeDirs) {
    console.log(`Scanning directory: ${dir}`);
    const files = getAllFiles(dir);

    for (const file of files) {
      await processFile(server, file, CONFIG.namespaces.documentation);
    }
  }
}

/**
 * Store a pattern or learning
 */
async function storePattern(server, pattern, metadata = {}) {
  return storeMemory(server, pattern, {
    ...metadata,
    type: 'pattern',
    source: 'learning'
  }, CONFIG.namespaces.patterns);
}

/**
 * Store an important interaction
 */
async function storeInteraction(server, interaction, metadata = {}) {
  return storeMemory(server, interaction, {
    ...metadata,
    type: 'interaction',
    source: 'conversation'
  }, CONFIG.namespaces.interactions);
}

/**
 * Store a philosophical framework
 */
async function storePhilosophicalFramework(server, framework, metadata = {}) {
  return storeMemory(server, framework, {
    ...metadata,
    type: 'philosophy',
    source: 'clinerules'
  }, CONFIG.namespaces.philosophy);
}

/**
 * Query for relevant knowledge
 */
async function queryKnowledge(server, query, limit = CONFIG.queryLimit) {
  // Query across all namespaces
  const results = [];

  // Query core knowledge
  const coreResults = await queryMemories(server, query, CONFIG.namespaces.coreKnowledge, limit);
  if (coreResults) {
    results.push({
      namespace: CONFIG.namespaces.coreKnowledge,
      results: coreResults
    });
  }

  // Query patterns
  const patternResults = await queryMemories(server, query, CONFIG.namespaces.patterns, limit);
  if (patternResults) {
    results.push({
      namespace: CONFIG.namespaces.patterns,
      results: patternResults
    });
  }

  // Query interactions
  const interactionResults = await queryMemories(server, query, CONFIG.namespaces.interactions, limit);
  if (interactionResults) {
    results.push({
      namespace: CONFIG.namespaces.interactions,
      results: interactionResults
    });
  }

  // Query documentation
  const documentationResults = await queryMemories(server, query, CONFIG.namespaces.documentation, limit);
  if (documentationResults) {
    results.push({
      namespace: CONFIG.namespaces.documentation,
      results: documentationResults
    });
  }

  // Query philosophical frameworks
  const philosophyResults = await queryMemories(server, query, CONFIG.namespaces.philosophy, limit);
  if (philosophyResults) {
    results.push({
      namespace: CONFIG.namespaces.philosophy,
      results: philosophyResults
    });
  }

  return results;
}

/**
 * Initialize the memory system
 */
async function initializeMemorySystem() {
  console.log('=== Initializing Memory System ===');
  STATS.startTime = new Date();

  try {
    // Start the knowledge system server
    console.log('Starting knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', CONFIG.useEnhancedServer);

    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Process core knowledge
    await processCoreKnowledge(server);

    // Process additional knowledge
    await processAdditionalKnowledge(server);

    // Store a test pattern
    await storePattern(server,
      "The Memory System allows Cline to store and retrieve knowledge across sessions, " +
      "integrating local markdown files with Pinecone vector database for efficient semantic search.",
      { category: "system", importance: "high" }
    );

    // Store a test interaction
    await storeInteraction(server,
      "User requested implementation of a memory system that integrates local markdown files " +
      "with Pinecone vector database to allow Cline to learn and improve over time.",
      { category: "request", importance: "high" }
    );

    // Test query
    console.log('\n=== Testing Query Capabilities ===');
    const queryResults = await queryKnowledge(server, "memory system pinecone");
    console.log('Query results:', JSON.stringify(queryResults, null, 2));

    // Shutdown the server
    console.log('\nShutting down server...');
    server.kill();

    STATS.endTime = new Date();
    const duration = (STATS.endTime - STATS.startTime) / 1000;

    // Print summary
    console.log('\n=== Initialization Summary ===');
    console.log(`Total files: ${STATS.totalFiles}`);
    console.log(`Processed files: ${STATS.processedFiles}`);
    console.log(`Failed files: ${STATS.failedFiles}`);
    console.log(`Total chunks: ${STATS.totalChunks}`);
    console.log(`Successful chunks: ${STATS.successfulChunks}`);
    console.log(`Failed chunks: ${STATS.failedChunks}`);
    console.log(`Duration: ${duration.toFixed(2)} seconds`);

    if (STATS.successfulChunks > 0) {
      console.log('Memory system initialized with partial success!');
    } else {
      console.log('Memory system initialization failed - no chunks were successfully stored.');
    }
  } catch (error) {
    console.error('Error during initialization:', error.message || error);
  }
}

/**
 * Memory System API
 */
const MemorySystem = {
  // Server management
  startServer: () => mcpDirectAccess.startServer('knowledge-system', CONFIG.useEnhancedServer),

  // Memory operations
  storeMemory: storeMemory,
  queryMemories: queryMemories,
  storePattern: storePattern,
  storeInteraction: storeInteraction,
  storePhilosophicalFramework: storePhilosophicalFramework,
  queryKnowledge: queryKnowledge,

  // File processing
  processFile: processFile,
  processCoreKnowledge: processCoreKnowledge,
  processAdditionalKnowledge: processAdditionalKnowledge,

  // System initialization
  initialize: initializeMemorySystem
};

// Export the Memory System API
module.exports = MemorySystem;

// If this script is run directly, initialize the memory system
if (require.main === module) {
  initializeMemorySystem().catch(error => console.error('Unhandled error:', error.message || error));
}
