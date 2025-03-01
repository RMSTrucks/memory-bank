/**
 * Backup Project to Pinecone
 *
 * This script scans all relevant files in the project, processes them into chunks,
 * generates embeddings using OpenAI, and stores them in Pinecone.
 */

const fs = require('fs');
const path = require('path');
const mcpDirectAccess = require('../utils/mcp-direct-access');

// Configuration
const CONFIG = {
  // File types to include
  includeExtensions: ['.md', '.ts', '.js', '.json'],

  // Directories to exclude
  excludeDirs: ['node_modules', '.git', 'build', 'dist', 'coverage'],

  // Batch size for processing files
  batchSize: 5,

  // Root directory to scan (relative to current working directory)
  rootDir: '.',

  // Whether to use enhanced server
  useEnhancedServer: true,

  // Namespace in Pinecone
  namespace: 'memory-bank-backup',

  // Chunk size in characters (approximate)
  chunkSize: 1500,

  // Chunk overlap in characters
  chunkOverlap: 150,

  // Delay between chunk processing (ms)
  chunkDelay: 500
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
async function processChunk(server, chunk, metadata) {
  try {
    // Add a delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, CONFIG.chunkDelay));

    const result = await mcpDirectAccess.storeMemory(
      server,
      chunk.content,
      {
        ...chunk.metadata,
        namespace: CONFIG.namespace
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
 * Process a batch of files
 */
async function processBatch(server, filePaths) {
  for (const filePath of filePaths) {
    try {
      console.log(`Processing: ${filePath}`);

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');

      // Split into chunks
      const chunks = chunkText(content, filePath);

      let successCount = 0;

      // Store each chunk in Pinecone
      for (const chunk of chunks) {
        const success = await processChunk(server, chunk, {
          ...chunk.metadata,
          namespace: CONFIG.namespace
        });

        if (success) {
          successCount++;
          STATS.totalChunks++;
        }
      }

      if (successCount > 0) {
        STATS.processedFiles++;
        console.log(`  ✓ Successfully stored ${successCount}/${chunks.length} chunks`);
      } else {
        STATS.failedFiles++;
        console.error(`  ✗ Failed to store any chunks for ${filePath}`);
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${filePath}:`, error.message || error);
      STATS.failedFiles++;
    }
  }
}

/**
 * Main function
 */
async function backupToPinecone() {
  console.log('=== Backup Project to Pinecone ===');
  STATS.startTime = new Date();

  try {
    // Start the knowledge system server
    console.log('Starting knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', CONFIG.useEnhancedServer);

    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get all files
    console.log('Scanning for files...');
    const files = getAllFiles(CONFIG.rootDir);
    STATS.totalFiles = files.length;
    console.log(`Found ${files.length} files to process`);

    // Process files in batches
    const batchCount = Math.ceil(files.length / CONFIG.batchSize);
    for (let i = 0; i < files.length; i += CONFIG.batchSize) {
      const batch = files.slice(i, i + CONFIG.batchSize);
      console.log(`Processing batch ${Math.floor(i / CONFIG.batchSize) + 1} of ${batchCount}...`);
      await processBatch(server, batch);

      // Add a small delay between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Shutdown the server
    console.log('Shutting down server...');
    server.kill();

    STATS.endTime = new Date();
    const duration = (STATS.endTime - STATS.startTime) / 1000;

    // Print summary
    console.log('\n=== Backup Summary ===');
    console.log(`Total files: ${STATS.totalFiles}`);
    console.log(`Processed files: ${STATS.processedFiles}`);
    console.log(`Failed files: ${STATS.failedFiles}`);
    console.log(`Total chunks: ${STATS.totalChunks}`);
    console.log(`Successful chunks: ${STATS.successfulChunks}`);
    console.log(`Failed chunks: ${STATS.failedChunks}`);
    console.log(`Duration: ${duration.toFixed(2)} seconds`);

    if (STATS.processedFiles > 0) {
      console.log(`Average processing time: ${(duration / STATS.processedFiles).toFixed(2)} seconds per file`);
    }

    if (STATS.successfulChunks > 0) {
      console.log('Backup completed with partial success!');
    } else {
      console.log('Backup failed - no chunks were successfully stored.');
    }
  } catch (error) {
    console.error('Error during backup:', error.message || error);
  }
}

// Run the backup
backupToPinecone().catch(error => console.error('Unhandled error:', error.message || error));
