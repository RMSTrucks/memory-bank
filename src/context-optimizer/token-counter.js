/**
 * Token Counter Utility
 *
 * This utility provides accurate token counting using the OpenAI tiktoken library,
 * which is essential for managing context within token limits.
 */

const tiktoken = require('tiktoken');

// Cache the encoder to avoid recreating it for each call
let encoder = null;

/**
 * Get or create the tiktoken encoder
 * @returns {Object} Tiktoken encoder
 */
function getEncoder() {
  if (!encoder) {
    encoder = tiktoken.encoding_for_model('gpt-3.5-turbo');
  }
  return encoder;
}

/**
 * Count tokens in text using the actual GPT tokenizer
 * @param {string} text - Text to count tokens in
 * @returns {number} Token count
 */
function countTokens(text) {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }
  const enc = getEncoder();
  return enc.encode(text).length;
}

/**
 * Count tokens in a file
 * @param {string} filePath - Path to file
 * @returns {Promise<number>} Token count
 */
async function countFileTokens(filePath) {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }

  const fs = require('fs').promises;
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return countTokens(content);
  } catch (error) {
    console.error('Error reading file:', filePath, '-', error);
    return 0;
  }
}

/**
 * Count tokens in multiple files
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<Object>} Object with file paths and token counts
 */
async function countMultipleFileTokens(filePaths) {
  if (!Array.isArray(filePaths)) {
    throw new Error('File paths must be an array');
  }

  const results = {};
  for (const path of filePaths) {
    results[path] = await countFileTokens(path);
  }
  return results;
}

/**
 * Get total tokens from multiple files
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<number>} Total token count
 */
async function getTotalTokens(filePaths) {
  if (!Array.isArray(filePaths)) {
    throw new Error('File paths must be an array');
  }

  const counts = await countMultipleFileTokens(filePaths);
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

module.exports = {
  countTokens,
  countFileTokens,
  countMultipleFileTokens,
  getTotalTokens
};
