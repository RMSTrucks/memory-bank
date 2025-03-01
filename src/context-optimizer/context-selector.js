/**
 * Context Selector
 *
 * This is the main component of the Context Optimizer system.
 * It selects the optimal context for a given task by analyzing the task,
 * finding relevant files, and ensuring the total token count stays within limits.
 */

const fs = require('fs').promises;
const path = require('path');
const { analyzeTask } = require('./task-analyzer');
const { findRelevantFiles, getFilesForTaskType } = require('./relevance-matcher');
const { countFileTokens, getTotalTokens } = require('./token-counter');
const config = require('./config');

/**
 * Select optimal context for a task
 * @param {string} taskDescription - Description of the task
 * @param {Object} options - Options for context selection
 * @param {number} options.maxTokens - Maximum tokens allowed (default: config.MAX_TOKENS)
 * @param {boolean} options.useLiteVersions - Whether to use lite versions of files when available (default: true)
 * @param {boolean} options.verbose - Whether to log detailed information (default: false)
 * @returns {Promise<{files: string[], totalTokens: number, analysis: Object}>} Selected files and token count
 */
async function selectContext(taskDescription, options = {}) {
  const {
    maxTokens = config.MAX_TOKENS,
    useLiteVersions = true,
    verbose = false
  } = options;

  // Step 1: Analyze the task
  const analysis = analyzeTask(taskDescription);
  if (verbose) {
    console.log('Task Analysis:', analysis);
  }

  // Step 2: Get files for the task type
  const taskTypeFiles = await getFilesForTaskType(analysis.taskType, config.MEMORY_BANK_PATH);
  if (verbose) {
    console.log(`Found ${taskTypeFiles.length} files for task type ${analysis.taskType}`);
  }

  // Step 3: Always include core files
  const template = config.TASK_TEMPLATES[analysis.taskType];
  let selectedFiles = [...template.coreFiles];

  // Step 4: Handle lite versions
  if (useLiteVersions) {
    const { createLiteVersion } = require('./file-summarizer');
    selectedFiles = await Promise.all(selectedFiles.map(async file => {
      if (!file.endsWith('.md')) return file;

      const liteVersion = file.replace(/\.md$/, '.lite.md');
      try {
        // Try to access existing lite version
        await fs.access(liteVersion);
        return liteVersion;
      } catch {
        // Create lite version if it doesn't exist
        if (verbose) {
          console.log(`Creating lite version for ${path.basename(file)}`);
        }
        const result = await createLiteVersion(file);
        return result.path;
      }
    }));
  }

  // Step 5: Calculate tokens for core files
  let coreTokens = await getTotalTokens(selectedFiles);
  if (verbose) {
    console.log(`Core files token count: ${coreTokens}`);
  }

  // Step 6: Find relevant files based on keywords
  const relevantFiles = await findRelevantFiles(
    analysis.keywords,
    taskTypeFiles.filter(file => !selectedFiles.includes(file)),
    20 // Get more files than we might need
  );

  if (verbose) {
    console.log('Relevant files:', relevantFiles.map(f => ({ path: path.basename(f.path), score: f.score })));
  }

  // Step 7: Add as many relevant files as possible within token limit
  const remainingTokens = maxTokens - coreTokens;
  let currentTokens = 0;

  for (const { path: filePath, score } of relevantFiles) {
    if (currentTokens >= remainingTokens) break;

    try {
      const tokenCount = await countFileTokens(filePath);

      if (currentTokens + tokenCount <= remainingTokens) {
        selectedFiles.push(filePath);
        currentTokens += tokenCount;

        if (verbose) {
          console.log(`Added ${path.basename(filePath)} (${tokenCount} tokens, score: ${score})`);
        }
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  // Step 8: Calculate final token count
  const totalTokens = coreTokens + currentTokens;

  if (verbose) {
    console.log(`Final selection: ${selectedFiles.length} files, ${totalTokens} tokens`);
  }

  return {
    files: selectedFiles,
    totalTokens,
    analysis
  };
}

/**
 * Load selected context files
 * @param {string[]} filePaths - Array of file paths to load
 * @returns {Promise<string>} Combined content of all files
 */
async function loadContext(filePaths) {
  const contents = [];

  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      contents.push(`\n\n# File: ${path.basename(filePath)}\n\n${content}`);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  return contents.join('\n');
}

/**
 * Select and load context for a task
 * @param {string} taskDescription - Description of the task
 * @param {Object} options - Options for context selection
 * @returns {Promise<{content: string, files: string[], totalTokens: number, analysis: Object}>} Context content and metadata
 */
async function getContextForTask(taskDescription, options = {}) {
  const result = await selectContext(taskDescription, options);
  const content = await loadContext(result.files);

  return {
    content,
    files: result.files,
    totalTokens: result.totalTokens,
    analysis: result.analysis
  };
}

module.exports = {
  selectContext,
  loadContext,
  getContextForTask
};
