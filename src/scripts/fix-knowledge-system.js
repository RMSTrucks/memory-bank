/**
 * Knowledge System Server Fix
 *
 * This script creates a fixed version of the knowledge-system server
 * that addresses the Pinecone data format issue.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the original knowledge-system server
const originalPath = path.resolve('C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system/src/index.js');
// Path to the enhanced version
const enhancedPath = path.resolve('C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system/src/index-enhanced.js');

// Read the original file
console.log(`Reading original file: ${originalPath}`);
const originalCode = fs.readFileSync(originalPath, 'utf8');

// Fix the Pinecone data format issue
console.log('Fixing Pinecone data format issue...');
const fixedCode = originalCode.replace(
  `async storeMemory(text, metadata = {}) {
    try {
      const embedding = await this.generateEmbedding(text);
      const id = \`mem_\${Date.now()}\`;

      await this.index.upsert({
        vectors: [{
          id,
          values: embedding,
          metadata: {
            ...metadata,
            text,
            timestamp: new Date().toISOString(),
          },
        }],
      });`,
  `async storeMemory(text, metadata = {}) {
    try {
      const embedding = await this.generateEmbedding(text);
      const id = \`mem_\${Date.now()}\`;

      // Format data as an array for Pinecone upsert
      await this.index.upsert([{
        id,
        values: embedding,
        metadata: {
          ...metadata,
          text,
          timestamp: new Date().toISOString(),
        },
      }]);`
);

// Add enhanced logging
const enhancedCode = fixedCode.replace(
  'console.error(\'Knowledge System MCP server running on stdio\');',
  `console.error('Knowledge System MCP server running on stdio');
console.error('Enhanced version with Pinecone data format fix');`
);

// Write the enhanced version
console.log(`Writing enhanced version: ${enhancedPath}`);
fs.writeFileSync(enhancedPath, enhancedCode, 'utf8');

console.log('Fix completed successfully!');
console.log('To use the enhanced version:');
console.log('1. Update the MCP settings to use the enhanced version');
console.log('2. Restart the VSCode extension or use the direct access utility');
