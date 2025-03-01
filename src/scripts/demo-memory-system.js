/**
 * Memory System Demo
 *
 * This script demonstrates the functionality of the Memory System for Cline.
 * It shows how to:
 * 1. Initialize the memory system
 * 2. Store memories in Pinecone
 * 3. Query for relevant memories
 * 4. Integrate with local markdown files
 */

const ClimeMemoryIntegration = require('./cline-memory-integration');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Demo memories to store
  memories: [
    {
      text: "The Memory Bank system allows Cline to maintain perfect documentation across sessions, serving as the core memory system despite complete memory resets.",
      category: "concept",
      importance: "high",
      metadata: {
        source: "projectbrief.md",
        topic: "memory-bank"
      }
    },
    {
      text: "Pattern detection and evolution are key components of the system, allowing Cline to learn and improve over time by recognizing recurring patterns in code and user interactions.",
      category: "pattern",
      importance: "high",
      metadata: {
        source: "systemPatterns.md",
        topic: "pattern-detection"
      }
    },
    {
      text: "The user prefers to use TypeScript for new projects, with a focus on strong typing and interface definitions.",
      category: "preference",
      importance: "medium",
      metadata: {
        source: "user-interaction",
        topic: "development-preferences"
      }
    },
    {
      text: "When implementing error handling, always use try/catch blocks with specific error types and meaningful error messages.",
      category: "learning",
      importance: "high",
      metadata: {
        source: "patterns/coding/error-handling.md",
        topic: "error-handling"
      }
    },
    {
      text: "The decision to use Pinecone for vector storage was made to enable efficient semantic search across large volumes of documentation and code.",
      category: "decision",
      importance: "critical",
      metadata: {
        source: "activeContext.md",
        topic: "vector-database"
      }
    }
  ],

  // Demo queries to run
  queries: [
    {
      text: "How does the Memory Bank system work?",
      description: "Query about the core concept of the Memory Bank"
    },
    {
      text: "What patterns are used in the system?",
      description: "Query about patterns in the system"
    },
    {
      text: "What are the user's preferences?",
      description: "Query about user preferences"
    },
    {
      text: "How should I handle errors?",
      description: "Query about error handling"
    },
    {
      text: "Why was Pinecone chosen for the project?",
      description: "Query about a specific decision"
    }
  ]
};

/**
 * Run the memory system demo
 */
async function runDemo() {
  console.log('=== Memory System Demo ===\n');

  try {
    // Initialize the memory system
    console.log('Initializing memory system...');
    await ClimeMemoryIntegration.initialize();

    // Store memories
    console.log('\n=== Storing Memories ===\n');
    for (const memory of CONFIG.memories) {
      console.log(`Storing memory: ${memory.text.substring(0, 50)}...`);
      const success = await ClimeMemoryIntegration.storeMemory(
        memory.text,
        {
          category: memory.category,
          importance: memory.importance,
          metadata: memory.metadata
        }
      );

      if (success) {
        console.log(`  ✓ Memory stored successfully (category: ${memory.category}, importance: ${memory.importance})`);
      } else {
        console.error(`  ✗ Failed to store memory`);
      }
    }

    // Query memories
    console.log('\n=== Querying Memories ===\n');
    for (const query of CONFIG.queries) {
      console.log(`Query: "${query.text}" (${query.description})`);
      const results = await ClimeMemoryIntegration.queryKnowledge(query.text);

      if (results && results.length > 0) {
        console.log(`  ✓ Found ${results.length} result(s):`);

        // Display the first result from each namespace
        for (const namespaceResult of results) {
          if (namespaceResult.results && namespaceResult.results.length > 0) {
            const firstResult = namespaceResult.results[0];
            console.log(`    - [${namespaceResult.namespace}] ${firstResult.text ? firstResult.text.substring(0, 100) + '...' : 'No text available'}`);
          }
        }
      } else {
        console.log(`  ✗ No results found`);
      }

      console.log(''); // Add a blank line between queries
    }

    // Check markdown files for updates
    console.log('\n=== Checking Markdown Files ===\n');
    const markdownFiles = [
      'systemPatterns.md',
      'productContext.md',
      'activeContext.md',
      '.clinerules'
    ];

    for (const file of markdownFiles) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`${file}: Last modified ${stats.mtime.toISOString()}`);
      } else {
        console.log(`${file}: File not found`);
      }
    }

    // Shutdown the memory system
    console.log('\n=== Shutting Down ===\n');
    ClimeMemoryIntegration.shutdown();
    console.log('Memory system demo completed successfully.');

  } catch (error) {
    console.error('Error running memory system demo:', error.message || error);
  }
}

// Run the demo
runDemo().catch(error => console.error('Unhandled error:', error.message || error));
