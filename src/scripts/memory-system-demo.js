/**
 * Memory System Demo
 *
 * This script demonstrates the Memory System in action by:
 * 1. Initializing the Memory System
 * 2. Storing different types of memories
 * 3. Querying for memories
 * 4. Updating markdown files
 * 5. Shutting down the system
 *
 * Run this script to see the Memory System in action and verify it's working correctly.
 */

const ClimeMemoryIntegration = require('./cline-memory-integration');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Demo memories to store
  memories: {
    patterns: [
      {
        text: "Use the Factory pattern for creating complex objects with multiple configurations.",
        importance: "high",
        metadata: { topic: "design-patterns", source: "demo" }
      },
      {
        text: "Implement the Observer pattern for event-driven communication between components.",
        importance: "medium",
        metadata: { topic: "design-patterns", source: "demo" }
      }
    ],
    learnings: [
      {
        text: "When implementing error handling, always use try/catch blocks with specific error types and meaningful error messages.",
        importance: "high",
        metadata: { topic: "error-handling", source: "demo" }
      },
      {
        text: "Regular documentation reviews help maintain consistency and accuracy across the system.",
        importance: "medium",
        metadata: { topic: "documentation", source: "demo" }
      }
    ],
    decisions: [
      {
        text: "Use Pinecone for vector storage to enable efficient semantic search across large volumes of documentation and code.",
        importance: "critical",
        metadata: { topic: "infrastructure", source: "demo" }
      },
      {
        text: "Implement a modular architecture with clear separation of concerns to improve maintainability.",
        importance: "high",
        metadata: { topic: "architecture", source: "demo" }
      }
    ],
    preferences: [
      {
        text: "Use TypeScript for new projects with a focus on strong typing and interface definitions.",
        importance: "high",
        metadata: { topic: "development", source: "demo" }
      },
      {
        text: "Follow a test-driven development approach for critical components.",
        importance: "medium",
        metadata: { topic: "development", source: "demo" }
      }
    ],
    concepts: [
      {
        text: "Vector Embeddings are numerical representations of text that capture semantic meaning, enabling similarity search.",
        importance: "high",
        metadata: { topic: "ai", source: "demo" }
      },
      {
        text: "Memory Bank is a system that allows Cline to maintain knowledge across sessions despite memory resets.",
        importance: "critical",
        metadata: { topic: "system", source: "demo" }
      }
    ],
    errors: [
      {
        text: "Avoid using synchronous file operations in the main thread as they can block the event loop.",
        importance: "high",
        metadata: { topic: "performance", source: "demo" }
      },
      {
        text: "Be careful with circular dependencies as they can cause memory leaks and initialization issues.",
        importance: "medium",
        metadata: { topic: "architecture", source: "demo" }
      }
    ]
  },

  // Query examples
  queries: [
    "design patterns",
    "error handling",
    "memory system",
    "documentation",
    "architecture"
  ]
};

/**
 * Print a section header
 */
function printHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${title}`);
  console.log('='.repeat(80));
}

/**
 * Print a subsection header
 */
function printSubHeader(title) {
  console.log('\n' + '-'.repeat(60));
  console.log(`${title}`);
  console.log('-'.repeat(60));
}

/**
 * Format memory for display
 */
function formatMemory(memory) {
  return `
  ID: ${memory.id || 'N/A'}
  Score: ${memory.score ? memory.score.toFixed(2) : 'N/A'}
  Text: ${memory.text}
  Metadata: ${JSON.stringify(memory.metadata, null, 2)}
  `;
}

/**
 * Store memories
 */
async function storeMemories() {
  printHeader('STORING MEMORIES');

  // Store patterns
  printSubHeader('Storing Patterns');
  for (const pattern of CONFIG.memories.patterns) {
    console.log(`Storing pattern: "${pattern.text.substring(0, 50)}..."`);
    const result = await ClimeMemoryIntegration.storePattern(
      pattern.text,
      pattern.importance,
      pattern.metadata
    );
    console.log(`Result: ${result ? 'Success' : 'Failed'}`);
  }

  // Store learnings
  printSubHeader('Storing Learnings');
  for (const learning of CONFIG.memories.learnings) {
    console.log(`Storing learning: "${learning.text.substring(0, 50)}..."`);
    const result = await ClimeMemoryIntegration.storeLearning(
      learning.text,
      learning.importance,
      learning.metadata
    );
    console.log(`Result: ${result ? 'Success' : 'Failed'}`);
  }

  // Store decisions
  printSubHeader('Storing Decisions');
  for (const decision of CONFIG.memories.decisions) {
    console.log(`Storing decision: "${decision.text.substring(0, 50)}..."`);
    const result = await ClimeMemoryIntegration.storeDecision(
      decision.text,
      decision.importance,
      decision.metadata
    );
    console.log(`Result: ${result ? 'Success' : 'Failed'}`);
  }

  // Store preferences
  printSubHeader('Storing Preferences');
  for (const preference of CONFIG.memories.preferences) {
    console.log(`Storing preference: "${preference.text.substring(0, 50)}..."`);
    const result = await ClimeMemoryIntegration.storePreference(
      preference.text,
      preference.importance,
      preference.metadata
    );
    console.log(`Result: ${result ? 'Success' : 'Failed'}`);
  }

  // Store concepts
  printSubHeader('Storing Concepts');
  for (const concept of CONFIG.memories.concepts) {
    console.log(`Storing concept: "${concept.text.substring(0, 50)}..."`);
    const result = await ClimeMemoryIntegration.storeMemory(
      concept.text,
      {
        category: "concept",
        importance: concept.importance,
        metadata: concept.metadata
      }
    );
    console.log(`Result: ${result ? 'Success' : 'Failed'}`);
  }

  // Store errors
  printSubHeader('Storing Errors');
  for (const error of CONFIG.memories.errors) {
    console.log(`Storing error: "${error.text.substring(0, 50)}..."`);
    const result = await ClimeMemoryIntegration.storeError(
      error.text,
      error.importance,
      error.metadata
    );
    console.log(`Result: ${result ? 'Success' : 'Failed'}`);
  }
}

/**
 * Query memories
 */
async function queryMemories() {
  printHeader('QUERYING MEMORIES');

  for (const query of CONFIG.queries) {
    printSubHeader(`Query: "${query}"`);

    // Query all knowledge
    console.log('Querying all knowledge...');
    const results = await ClimeMemoryIntegration.queryKnowledge(query);

    // Display results
    console.log(`Found ${results.length} namespaces with results`);
    for (const namespace of results) {
      console.log(`\nNamespace: ${namespace.namespace}`);
      console.log(`Results: ${namespace.results.length}`);

      // Display top 2 results
      if (namespace.results.length > 0) {
        console.log('Top results:');
        for (let i = 0; i < Math.min(2, namespace.results.length); i++) {
          console.log(formatMemory(namespace.results[i]));
        }
      }
    }

    // Query patterns specifically
    console.log('\nQuerying patterns specifically...');
    const patternResults = await ClimeMemoryIntegration.queryPatterns(query);
    console.log(`Found ${patternResults.length} pattern results`);

    // Display top 2 pattern results
    if (patternResults.length > 0) {
      console.log('Top pattern results:');
      for (let i = 0; i < Math.min(2, patternResults.length); i++) {
        console.log(formatMemory(patternResults[i]));
      }
    }
  }
}

/**
 * Check markdown files
 */
function checkMarkdownFiles() {
  printHeader('CHECKING MARKDOWN FILES');

  const files = [
    '.clinerules',
    'systemPatterns.md',
    'activeContext.md',
    'productContext.md'
  ];

  for (const file of files) {
    printSubHeader(`File: ${file}`);

    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        console.log(`File exists with ${lines.length} lines`);
        console.log('First 10 lines:');
        console.log(lines.slice(0, 10).join('\n'));

        // Check for demo content
        const demoContent = content.includes('demo');
        console.log(`Contains demo content: ${demoContent}`);
      } else {
        console.log(`File does not exist: ${file}`);
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
    }
  }
}

/**
 * Run the demo
 */
async function runDemo() {
  try {
    printHeader('MEMORY SYSTEM DEMO');
    console.log('This demo will demonstrate the Memory System in action.');

    // Initialize the Memory System
    printSubHeader('Initializing Memory System');
    await ClimeMemoryIntegration.initialize();
    console.log('Memory System initialized successfully');

    // Store memories
    await storeMemories();

    // Query memories
    await queryMemories();

    // Check markdown files
    checkMarkdownFiles();

    // Shutdown
    printSubHeader('Shutting Down Memory System');
    ClimeMemoryIntegration.shutdown();
    console.log('Memory System shut down successfully');

    printHeader('DEMO COMPLETED SUCCESSFULLY');

  } catch (error) {
    console.error('Error running demo:', error);

    // Ensure shutdown
    try {
      ClimeMemoryIntegration.shutdown();
    } catch (shutdownError) {
      console.error('Error shutting down:', shutdownError);
    }

    printHeader('DEMO FAILED');
  }
}

// Run the demo
runDemo();
