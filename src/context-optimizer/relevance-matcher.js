/**
 * Relevance Matcher
 *
 * This component matches task keywords to file content to determine
 * the most relevant files for a given task.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Calculate relevance score between keywords and file content
 * @param {string[]} keywords - Array of keywords
 * @param {string} fileContent - Content of the file
 * @returns {number} Relevance score
 */
function calculateRelevanceScore(keywords, fileContent) {
  const contentLower = fileContent.toLowerCase();
  let score = 0;

  // Simple TF (Term Frequency) scoring
  keywords.forEach((keyword, index) => {
    // Count occurrences of the keyword in the content
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = contentLower.match(regex);
    const occurrences = matches ? matches.length : 0;

    // Weight by position in keywords array (earlier = more important)
    const positionWeight = 1 - (index / (keywords.length * 2));

    // Add to score
    score += occurrences * positionWeight;
  });

  return score;
}

/**
 * Find most relevant files for a task
 * @param {string[]} keywords - Array of keywords
 * @param {string[]} filePaths - Array of file paths to check
 * @param {number} maxFiles - Maximum number of files to return
 * @returns {Promise<Array<{path: string, score: number}>>} Sorted array of files with relevance scores
 */
async function findRelevantFiles(keywords, filePaths, maxFiles = 5) {
  const results = [];

  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const score = calculateRelevanceScore(keywords, content);
      results.push({ path: filePath, score });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  // Sort by score (descending) and take top maxFiles
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles);
}

/**
 * Get all files in a directory matching a pattern
 * @param {string} dirPath - Directory path
 * @param {RegExp} pattern - File pattern to match
 * @param {boolean} recursive - Whether to search recursively
 * @returns {Promise<string[]>} Array of file paths
 */
async function getFilesInDirectory(dirPath, pattern = /\.md$/, recursive = true) {
  const results = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && recursive) {
        const subDirFiles = await getFilesInDirectory(fullPath, pattern, recursive);
        results.push(...subDirFiles);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return results;
}

/**
 * Find relevant files for a task type
 * @param {string} taskType - Type of task (implementation, architecture, documentation, bugfix)
 * @param {string} memoryBankPath - Path to Memory Bank directory
 * @returns {Promise<string[]>} Array of relevant file paths
 */
async function getFilesForTaskType(taskType, memoryBankPath) {
  // Define patterns for different task types
  const patterns = {
    implementation: [
      { dir: memoryBankPath, pattern: /^(projectbrief|activeContext|progress)\.md$/ },
      { dir: path.join(memoryBankPath, 'src'), pattern: /\.(ts|js)$/, recursive: true }
    ],
    architecture: [
      { dir: memoryBankPath, pattern: /^(projectbrief|systemPatterns|techContext|activeContext)\.md$/ },
      { dir: path.join(memoryBankPath, 'src', 'types'), pattern: /\.ts$/, recursive: true }
    ],
    documentation: [
      { dir: memoryBankPath, pattern: /^(projectbrief|productContext|progress)\.md$/ },
      { dir: path.join(memoryBankPath, 'docs'), pattern: /\.md$/, recursive: true }
    ],
    bugfix: [
      { dir: memoryBankPath, pattern: /^activeContext\.md$/ },
      { dir: path.join(memoryBankPath, 'src'), pattern: /\.(ts|js)$/, recursive: true }
    ]
  };

  // Get patterns for the task type
  const relevantPatterns = patterns[taskType] || patterns.implementation;

  // Get files for each pattern
  const filePromises = relevantPatterns.map(async ({ dir, pattern, recursive = true }) => {
    try {
      return await getFilesInDirectory(dir, pattern, recursive);
    } catch (error) {
      console.error(`Error getting files for pattern ${pattern}:`, error);
      return [];
    }
  });

  // Combine all files
  const fileArrays = await Promise.all(filePromises);
  return fileArrays.flat();
}

module.exports = {
  calculateRelevanceScore,
  findRelevantFiles,
  getFilesInDirectory,
  getFilesForTaskType
};
