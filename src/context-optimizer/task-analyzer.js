/**
 * Task Analyzer
 *
 * This component analyzes task descriptions to extract keywords
 * and determine the type of task, which helps in selecting
 * the most relevant context files.
 */

/**
 * Extract keywords from a task description
 * @param {string} taskDescription - Description of the task
 * @returns {string[]} Array of keywords
 */
function extractKeywords(taskDescription) {
  // Tokenize and convert to lowercase
  const words = taskDescription.toLowerCase().split(/\s+/);

  // Simple stopwords list (would be more comprehensive in a real implementation)
  const stopwords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
                     'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with',
                     'by', 'about', 'as', 'of', 'this', 'that', 'these', 'those'];

  // Remove stopwords and short words
  const filteredWords = words.filter(word =>
    !stopwords.includes(word) && word.length > 2
  );

  // Return unique keywords
  return [...new Set(filteredWords)];
}

/**
 * Determine task type from description
 * @param {string} taskDescription - Description of the task
 * @returns {string} Task type (implementation, architecture, documentation, bugfix)
 */
function determineTaskType(taskDescription) {
  const taskLower = taskDescription.toLowerCase();

  // Simple keyword matching for task type
  if (taskLower.includes('implement') || taskLower.includes('build') ||
      taskLower.includes('create') || taskLower.includes('develop')) {
    return 'implementation';
  }

  if (taskLower.includes('design') || taskLower.includes('architect') ||
      taskLower.includes('structure') || taskLower.includes('pattern')) {
    return 'architecture';
  }

  if (taskLower.includes('document') || taskLower.includes('explain') ||
      taskLower.includes('describe') || taskLower.includes('write')) {
    return 'documentation';
  }

  if (taskLower.includes('fix') || taskLower.includes('bug') ||
      taskLower.includes('issue') || taskLower.includes('error') ||
      taskLower.includes('problem')) {
    return 'bugfix';
  }

  // Default to implementation if no clear type is found
  return 'implementation';
}

/**
 * Analyze a task description to extract relevant information
 * @param {string} taskDescription - Description of the task
 * @returns {Object} Analysis results
 */
function analyzeTask(taskDescription) {
  const keywords = extractKeywords(taskDescription);
  const taskType = determineTaskType(taskDescription);

  // Calculate keyword frequencies for better relevance matching
  const keywordFrequencies = {};
  keywords.forEach(keyword => {
    keywordFrequencies[keyword] = (keywordFrequencies[keyword] || 0) + 1;
  });

  // Sort keywords by frequency
  const sortedKeywords = Object.entries(keywordFrequencies)
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);

  return {
    taskType,
    keywords: sortedKeywords,
    originalDescription: taskDescription
  };
}

module.exports = {
  extractKeywords,
  determineTaskType,
  analyzeTask
};
