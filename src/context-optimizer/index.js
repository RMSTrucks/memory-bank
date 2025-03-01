/**
 * Context Optimizer
 *
 * This is the main entry point for the Context Optimizer system.
 * It provides a simple interface for optimizing context for Claude
 * to stay within token limits while preserving the most relevant information.
 */

const { getContextForTask, selectContext, loadContext } = require('./context-selector');
const { createLiteVersion, createAllLiteVersions, archiveHistory } = require('./file-summarizer');
const { analyzeTask } = require('./task-analyzer');
const { countTokens, countFileTokens } = require('./token-counter');
const config = require('./config');

/**
 * Optimize context for a task
 * @param {string} taskDescription - Description of the task
 * @param {Object} options - Options for context optimization
 * @param {number} options.maxTokens - Maximum tokens allowed (default: config.MAX_TOKENS)
 * @param {boolean} options.useLiteVersions - Whether to use lite versions of files when available (default: true)
 * @param {boolean} options.verbose - Whether to log detailed information (default: false)
 * @param {boolean} options.createLiteVersions - Whether to create lite versions if they don't exist (default: false)
 * @returns {Promise<{content: string, files: string[], totalTokens: number, analysis: Object}>} Optimized context
 */
async function optimizeContext(taskDescription, options = {}) {
  const {
    maxTokens = config.MAX_TOKENS,
    useLiteVersions = true,
    verbose = false,
    createLiteVersions = false
  } = options;

  // Step 1: Create lite versions if requested
  if (createLiteVersions) {
    if (verbose) {
      console.log('Creating lite versions of core files...');
    }
    await createAllLiteVersions();
  }

  // Step 2: Get context for the task
  if (verbose) {
    console.log(`Optimizing context for task: "${taskDescription}"`);
    console.log(`Max tokens: ${maxTokens}`);
  }

  const result = await getContextForTask(taskDescription, {
    maxTokens,
    useLiteVersions,
    verbose
  });

  if (verbose) {
    console.log(`Selected ${result.files.length} files with ${result.totalTokens} tokens`);
    console.log('Task type:', result.analysis.taskType);
    console.log('Top keywords:', result.analysis.keywords.slice(0, 5));
  }

  return result;
}

/**
 * Prepare Memory Bank for optimal context usage
 * @param {Object} options - Options for preparation
 * @param {boolean} options.createLiteVersions - Whether to create lite versions of core files (default: true)
 * @param {boolean} options.archiveHistory - Whether to archive history from activeContext.md (default: true)
 * @param {boolean} options.verbose - Whether to log detailed information (default: false)
 * @returns {Promise<{liteVersions: Array, historyArchived: boolean}>} Results of preparation
 */
async function prepareMemoryBank(options = {}) {
  const {
    createLiteVersions = true,
    archiveHistory: shouldArchiveHistory = true,
    verbose = false
  } = options;

  const results = {
    liteVersions: [],
    historyArchived: false
  };

  // Step 1: Create lite versions of core files
  if (createLiteVersions) {
    if (verbose) {
      console.log('Creating lite versions of core files...');
    }
    results.liteVersions = await createAllLiteVersions();

    if (verbose) {
      console.log('Lite versions created:');
      results.liteVersions.forEach(({ file, original, compressed, reduction }) => {
        console.log(`- ${file}: ${original} → ${compressed} tokens (${reduction} reduction)`);
      });
    }
  }

  // Step 2: Archive history from activeContext.md
  if (shouldArchiveHistory) {
    if (verbose) {
      console.log('Archiving history from activeContext.md...');
    }

    const archiveResult = await archiveHistory();
    results.historyArchived = archiveResult.archived;

    if (verbose) {
      if (archiveResult.archived) {
        console.log(`History archived to ${archiveResult.path}`);
      } else {
        console.log('No history to archive or archiving failed');
        if (archiveResult.error) {
          console.error('Error:', archiveResult.error);
        }
      }
    }
  }

  return results;
}

/**
 * Get token usage statistics for Memory Bank files
 * @param {boolean} verbose - Whether to log detailed information (default: false)
 * @returns {Promise<{total: number, byFile: Object, byCategory: Object}>} Token usage statistics
 */
async function getTokenUsageStats(verbose = false) {
  const stats = {
    total: 0,
    byFile: {},
    byCategory: {
      core: 0,
      documentation: 0,
      source: 0,
      other: 0
    }
  };

  // Get all files from task templates
  const allFiles = new Set();

  for (const taskType in config.TASK_TEMPLATES) {
    const template = config.TASK_TEMPLATES[taskType];

    // Add core files
    template.coreFiles.forEach(file => allFiles.add(file));
  }

  // Count tokens for each file
  for (const filePath of allFiles) {
    try {
      const tokens = await countFileTokens(filePath);
      const fileName = filePath.split('/').pop();

      stats.byFile[fileName] = tokens;
      stats.total += tokens;

      // Categorize file
      if (filePath.endsWith('.md') && ['projectbrief.md', 'activeContext.md', 'systemPatterns.md', 'techContext.md', 'productContext.md', 'progress.md'].includes(fileName)) {
        stats.byCategory.core += tokens;
      } else if (filePath.includes('/docs/') || filePath.endsWith('.md')) {
        stats.byCategory.documentation += tokens;
      } else if (filePath.includes('/src/')) {
        stats.byCategory.source += tokens;
      } else {
        stats.byCategory.other += tokens;
      }
    } catch (error) {
      if (verbose) {
        console.error(`Error counting tokens for ${filePath}:`, error);
      }
    }
  }

  if (verbose) {
    console.log('Token usage statistics:');
    console.log(`Total tokens: ${stats.total}`);
    console.log('By category:');
    for (const [category, tokens] of Object.entries(stats.byCategory)) {
      console.log(`- ${category}: ${tokens} tokens (${(tokens / stats.total * 100).toFixed(1)}%)`);
    }
    console.log('Top files by token usage:');
    Object.entries(stats.byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([file, tokens]) => {
        console.log(`- ${file}: ${tokens} tokens (${(tokens / stats.total * 100).toFixed(1)}%)`);
      });
  }

  return stats;
}

module.exports = {
  optimizeContext,
  prepareMemoryBank,
  getTokenUsageStats,
  getContextForTask,
  selectContext,
  loadContext,
  createLiteVersion,
  createAllLiteVersions,
  archiveHistory,
  analyzeTask,
  countTokens,
  countFileTokens,
  config
};
