/**
 * Cline Memory Integration
 *
 * This script integrates the Memory System with Cline's workflow, allowing Cline to
 * store and retrieve knowledge from Pinecone, integrating with local markdown files.
 *
 * It provides a simple API for Cline to:
 * 1. Store important information from interactions
 * 2. Retrieve relevant information when needed
 * 3. Learn and improve over time
 */

const MemorySystem = require('./memory-system');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Categories for different types of memories
  categories: {
    concept: 'concept',          // Conceptual knowledge
    pattern: 'pattern',          // Code or design patterns
    decision: 'decision',        // Important decisions
    learning: 'learning',        // Things Cline has learned
    interaction: 'interaction',  // Important interactions with the user
    error: 'error',              // Errors and how they were resolved
    preference: 'preference'     // User preferences
  },

  // Importance levels
  importanceLevels: {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical'
  },

  // Maximum number of results to return for queries
  queryLimit: 10,

  // Whether to update markdown files when storing memories
  updateMarkdownFiles: true,

  // Markdown file mapping for different memory types
  markdownFiles: {
    pattern: 'systemPatterns.md',
    concept: 'productContext.md',
    decision: 'activeContext.md',
    learning: '.clinerules',
    preference: '.clinerules'
  }
};

// Server instance
let server = null;

/**
 * Initialize the Cline Memory Integration
 */
async function initialize() {
  console.log('Initializing Cline Memory Integration...');

  try {
    // Start the server if not already running
    if (!server) {
      server = MemorySystem.startServer();

      // Wait for server to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('Cline Memory Integration initialized successfully.');
    return true;
  } catch (error) {
    console.error('Error initializing Cline Memory Integration:', error.message || error);
    return false;
  }
}

/**
 * Shutdown the Cline Memory Integration
 */
function shutdown() {
  console.log('Shutting down Cline Memory Integration...');

  try {
    if (server) {
      server.kill();
      server = null;
    }

    console.log('Cline Memory Integration shut down successfully.');
    return true;
  } catch (error) {
    console.error('Error shutting down Cline Memory Integration:', error.message || error);
    return false;
  }
}

/**
 * Store a memory
 *
 * @param {string} text - The text content to store
 * @param {object} options - Options for storing the memory
 * @param {string} options.category - The category of the memory (concept, pattern, decision, learning, interaction, error, preference)
 * @param {string} options.importance - The importance level of the memory (low, medium, high, critical)
 * @param {object} options.metadata - Additional metadata to store with the memory
 * @returns {Promise<boolean>} - Whether the memory was stored successfully
 */
async function storeMemory(text, options = {}) {
  try {
    if (!server) {
      await initialize();
    }

    const category = options.category || CONFIG.categories.concept;
    const importance = options.importance || CONFIG.importanceLevels.medium;

    // Determine the namespace based on the category
    let namespace;
    switch (category) {
      case CONFIG.categories.pattern:
        namespace = MemorySystem.CONFIG.namespaces.patterns;
        break;
      case CONFIG.categories.interaction:
      case CONFIG.categories.decision:
        namespace = MemorySystem.CONFIG.namespaces.interactions;
        break;
      case CONFIG.categories.concept:
      case CONFIG.categories.learning:
      case CONFIG.categories.error:
      case CONFIG.categories.preference:
      default:
        namespace = MemorySystem.CONFIG.namespaces.coreKnowledge;
        break;
    }

    // Store the memory in Pinecone
    const success = await MemorySystem.storeMemory(
      server,
      text,
      {
        category,
        importance,
        ...options.metadata
      },
      namespace
    );

    // Update markdown files if enabled
    if (success && CONFIG.updateMarkdownFiles) {
      await updateMarkdownFile(text, category, importance);
    }

    return success;
  } catch (error) {
    console.error('Error storing memory:', error.message || error);
    return false;
  }
}

/**
 * Store a pattern
 *
 * @param {string} pattern - The pattern to store
 * @param {string} importance - The importance level of the pattern (low, medium, high, critical)
 * @param {object} metadata - Additional metadata to store with the pattern
 * @returns {Promise<boolean>} - Whether the pattern was stored successfully
 */
async function storePattern(pattern, importance = CONFIG.importanceLevels.medium, metadata = {}) {
  return storeMemory(pattern, {
    category: CONFIG.categories.pattern,
    importance,
    metadata: {
      ...metadata,
      type: 'pattern'
    }
  });
}

/**
 * Store a learning
 *
 * @param {string} learning - The learning to store
 * @param {string} importance - The importance level of the learning (low, medium, high, critical)
 * @param {object} metadata - Additional metadata to store with the learning
 * @returns {Promise<boolean>} - Whether the learning was stored successfully
 */
async function storeLearning(learning, importance = CONFIG.importanceLevels.medium, metadata = {}) {
  return storeMemory(learning, {
    category: CONFIG.categories.learning,
    importance,
    metadata: {
      ...metadata,
      type: 'learning'
    }
  });
}

/**
 * Store a decision
 *
 * @param {string} decision - The decision to store
 * @param {string} importance - The importance level of the decision (low, medium, high, critical)
 * @param {object} metadata - Additional metadata to store with the decision
 * @returns {Promise<boolean>} - Whether the decision was stored successfully
 */
async function storeDecision(decision, importance = CONFIG.importanceLevels.high, metadata = {}) {
  return storeMemory(decision, {
    category: CONFIG.categories.decision,
    importance,
    metadata: {
      ...metadata,
      type: 'decision'
    }
  });
}

/**
 * Store a user preference
 *
 * @param {string} preference - The preference to store
 * @param {string} importance - The importance level of the preference (low, medium, high, critical)
 * @param {object} metadata - Additional metadata to store with the preference
 * @returns {Promise<boolean>} - Whether the preference was stored successfully
 */
async function storePreference(preference, importance = CONFIG.importanceLevels.high, metadata = {}) {
  return storeMemory(preference, {
    category: CONFIG.categories.preference,
    importance,
    metadata: {
      ...metadata,
      type: 'preference'
    }
  });
}

/**
 * Store an error and its resolution
 *
 * @param {string} error - The error and its resolution to store
 * @param {string} importance - The importance level of the error (low, medium, high, critical)
 * @param {object} metadata - Additional metadata to store with the error
 * @returns {Promise<boolean>} - Whether the error was stored successfully
 */
async function storeError(error, importance = CONFIG.importanceLevels.medium, metadata = {}) {
  return storeMemory(error, {
    category: CONFIG.categories.error,
    importance,
    metadata: {
      ...metadata,
      type: 'error'
    }
  });
}

/**
 * Query for relevant knowledge
 *
 * @param {string} query - The query text to search for similar memories
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<object[]>} - The query results
 */
async function queryKnowledge(query, limit = CONFIG.queryLimit) {
  try {
    if (!server) {
      await initialize();
    }

    return await MemorySystem.queryKnowledge(server, query, limit);
  } catch (error) {
    console.error('Error querying knowledge:', error.message || error);
    return [];
  }
}

/**
 * Query for patterns
 *
 * @param {string} query - The query text to search for similar patterns
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<object[]>} - The query results
 */
async function queryPatterns(query, limit = CONFIG.queryLimit) {
  try {
    if (!server) {
      await initialize();
    }

    return await MemorySystem.queryMemories(server, query, MemorySystem.CONFIG.namespaces.patterns, limit);
  } catch (error) {
    console.error('Error querying patterns:', error.message || error);
    return [];
  }
}

/**
 * Query for interactions
 *
 * @param {string} query - The query text to search for similar interactions
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<object[]>} - The query results
 */
async function queryInteractions(query, limit = CONFIG.queryLimit) {
  try {
    if (!server) {
      await initialize();
    }

    return await MemorySystem.queryMemories(server, query, MemorySystem.CONFIG.namespaces.interactions, limit);
  } catch (error) {
    console.error('Error querying interactions:', error.message || error);
    return [];
  }
}

/**
 * Update a markdown file with a new memory
 *
 * @param {string} text - The text content to add
 * @param {string} category - The category of the memory
 * @param {string} importance - The importance level of the memory
 * @returns {Promise<boolean>} - Whether the file was updated successfully
 */
async function updateMarkdownFile(text, category, importance) {
  try {
    // Get the appropriate markdown file for this category
    const markdownFile = CONFIG.markdownFiles[category];
    if (!markdownFile) {
      return false;
    }

    // Read the current content of the file
    const content = fs.readFileSync(markdownFile, 'utf8');

    // Determine where to add the new content based on the file and category
    let updatedContent;

    if (markdownFile === '.clinerules') {
      // For .clinerules, add to the appropriate section
      if (category === CONFIG.categories.learning) {
        // Add to the Learning History section
        const learningHistorySection = '## Learning History';
        if (content.includes(learningHistorySection)) {
          const parts = content.split(learningHistorySection);
          updatedContent = parts[0] + learningHistorySection + '\n\n' +
            `${parts[1].trim().startsWith('1.') ? '' : '1. '}**New Learning (${new Date().toISOString().split('T')[0]})**\n   - ${text}\n\n` +
            parts[1];
        } else {
          updatedContent = content + '\n\n' + learningHistorySection + '\n\n1. **New Learning (' + new Date().toISOString().split('T')[0] + ')**\n   - ' + text + '\n';
        }
      } else if (category === CONFIG.categories.preference) {
        // Add to the Project Preferences section
        const preferencesSection = '## Project Preferences';
        if (content.includes(preferencesSection)) {
          const parts = content.split(preferencesSection);
          updatedContent = parts[0] + preferencesSection + '\n\n' +
            `${parts[1].trim().startsWith('1.') ? '' : '1. '}**User Preference**\n   - ${text}\n\n` +
            parts[1];
        } else {
          updatedContent = content + '\n\n' + preferencesSection + '\n\n1. **User Preference**\n   - ' + text + '\n';
        }
      } else {
        // No appropriate section found
        return false;
      }
    } else if (markdownFile === 'systemPatterns.md' && category === CONFIG.categories.pattern) {
      // For systemPatterns.md, add to the appropriate section based on the pattern type
      // This is a simplified approach; in a real implementation, you would parse the pattern
      // to determine which section to add it to
      const implementationPatternsSection = '## Implementation Patterns';
      if (content.includes(implementationPatternsSection)) {
        const parts = content.split(implementationPatternsSection);
        updatedContent = parts[0] + implementationPatternsSection + '\n\n' +
          `### ${importance.charAt(0).toUpperCase() + importance.slice(1)} Priority Pattern\n${text}\n\n` +
          parts[1];
      } else {
        updatedContent = content + '\n\n' + implementationPatternsSection + '\n\n' +
          `### ${importance.charAt(0).toUpperCase() + importance.slice(1)} Priority Pattern\n${text}\n`;
      }
    } else if (markdownFile === 'activeContext.md' && category === CONFIG.categories.decision) {
      // For activeContext.md, add to the Active Decisions section
      const activeDecisionsSection = '## Active Decisions';
      if (content.includes(activeDecisionsSection)) {
        const parts = content.split(activeDecisionsSection);

        // Count existing decision points to determine the next number
        const decisionCount = (parts[1].match(/\d+\./g) || []).length;
        const nextDecisionNumber = decisionCount + 1;

        updatedContent = parts[0] + activeDecisionsSection + '\n\n' +
          `${nextDecisionNumber}. **${importance.charAt(0).toUpperCase() + importance.slice(1)} Priority Decision**\n   - ${text}\n\n` +
          parts[1];
      } else {
        updatedContent = content + '\n\n' + activeDecisionsSection + '\n\n1. **' + importance.charAt(0).toUpperCase() + importance.slice(1) + ' Priority Decision**\n   - ' + text + '\n';
      }
    } else {
      // For other files, append to the end
      updatedContent = content + '\n\n## New ' + category.charAt(0).toUpperCase() + category.slice(1) + '\n\n' + text + '\n';
    }

    // Write the updated content back to the file
    fs.writeFileSync(markdownFile, updatedContent);

    return true;
  } catch (error) {
    console.error(`Error updating markdown file:`, error.message || error);
    return false;
  }
}

/**
 * Initialize the memory system by processing all markdown files
 *
 * @returns {Promise<boolean>} - Whether the initialization was successful
 */
async function initializeMemorySystem() {
  try {
    if (!server) {
      await initialize();
    }

    // Initialize the memory system
    return await MemorySystem.initialize();
  } catch (error) {
    console.error('Error initializing memory system:', error.message || error);
    return false;
  }
}

/**
 * Cline Memory Integration API
 */
const ClimeMemoryIntegration = {
  // System management
  initialize,
  shutdown,
  initializeMemorySystem,

  // Memory operations
  storeMemory,
  storePattern,
  storeLearning,
  storeDecision,
  storePreference,
  storeError,

  // Query operations
  queryKnowledge,
  queryPatterns,
  queryInteractions,

  // Configuration
  CONFIG
};

// Export the Cline Memory Integration API
module.exports = ClimeMemoryIntegration;

// If this script is run directly, initialize the memory system
if (require.main === module) {
  initializeMemorySystem()
    .then(() => {
      console.log('Memory system initialized successfully.');
      shutdown();
    })
    .catch(error => console.error('Unhandled error:', error.message || error));
}
