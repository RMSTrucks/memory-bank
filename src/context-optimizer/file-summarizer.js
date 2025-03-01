/**
 * File Summarizer
 *
 * This component provides utilities for summarizing and compressing files
 * to reduce token usage while preserving the most important information.
 */

const fs = require('fs').promises;
const path = require('path');
const { countTokens } = require('./token-counter');
const config = require('./config');

/**
 * Compress markdown content by removing or summarizing verbose sections
 * @param {string} content - Markdown content
 * @param {string[]} compressibleSections - Section headers that can be compressed
 * @returns {string} Compressed content
 */
function compressMarkdown(content, compressibleSections = []) {
  // Remove code blocks if they're large
  let compressed = content.replace(/```[\s\S]*?```/g, (match) => {
    if (countTokens(match) > 100) {
      return '```\n// Code block removed to save tokens\n```';
    }
    return match;
  });

  // Remove large mermaid diagrams
  compressed = compressed.replace(/```mermaid[\s\S]*?```/g, (match) => {
    if (countTokens(match) > 100) {
      return '```mermaid\n// Diagram removed to save tokens\n```';
    }
    return match;
  });

  // Compress lists with many items
  compressed = compressed.replace(/(?:- .*\n)+/g, (match) => {
    const lines = match.split('\n').filter(Boolean);
    if (lines.length > 10) {
      return lines.slice(0, 5).join('\n') + '\n- ...\n' + lines.slice(-3).join('\n') + '\n';
    }
    return match;
  });

  // Compress specified sections and implementation status sections
  if (compressibleSections && compressibleSections.length > 0) {
    for (const sectionHeader of compressibleSections) {
      const sectionRegex = new RegExp(`(${sectionHeader}[^\n]*\n)([\\s\\S]*?)(?=\n#|$)`, 'g');
      compressed = compressed.replace(sectionRegex, (match, header, content) => {
        // Always compress sections that are marked for compression
        const tokens = countTokens(content);
        if (tokens > 100) {
          // For implementation status sections, create a summary
          if (content.includes('**Implementation Status:**')) {
            const lines = content.split('\n').filter(Boolean);
            const summary = lines.reduce((acc, line) => {
              if (line.includes('✅')) acc.done++;
              else if (line.includes('🔄')) acc.inProgress++;
              else if (line.includes('❌')) acc.todo++;
              return acc;
            }, { done: 0, inProgress: 0, todo: 0 });

            return `${header}\n**Status Summary:**\n` +
                   `- ✅ ${summary.done} completed\n` +
                   `- 🔄 ${summary.inProgress} in progress\n` +
                   `- ❌ ${summary.todo} pending\n\n`;
          }
          // For other sections, just show a summary message
          return `${header}\n*This section has been summarized to save tokens (${tokens} tokens).*\n\n`;
        }
        return match;
      });
    }
  }

  // Compress implementation status sections
  compressed = compressed.replace(/(\*\*Implementation Status:\*\*\n(?:- [✅🔄❌][^\n]*\n)+)/g, (match) => {
    const lines = match.split('\n').filter(Boolean);
    const summary = lines.reduce((acc, line) => {
      if (line.includes('✅')) acc.done++;
      else if (line.includes('🔄')) acc.inProgress++;
      else if (line.includes('❌')) acc.todo++;
      return acc;
    }, { done: 0, inProgress: 0, todo: 0 });

    return `**Implementation Status Summary:**\n` +
           `- ✅ ${summary.done} completed\n` +
           `- 🔄 ${summary.inProgress} in progress\n` +
           `- ❌ ${summary.todo} pending\n\n`;
  });

  // Compress detailed status sections
  compressed = compressed.replace(/(\*\*Status:\*\*\n(?:- [✅🔄❌][^\n]*\n)+)/g, (match) => {
    const lines = match.split('\n').filter(Boolean);
    const summary = lines.reduce((acc, line) => {
      if (line.includes('✅')) acc.done++;
      else if (line.includes('🔄')) acc.inProgress++;
      else if (line.includes('❌')) acc.todo++;
      return acc;
    }, { done: 0, inProgress: 0, todo: 0 });

    return `**Status Summary:**\n` +
           `- ✅ ${summary.done} completed\n` +
           `- 🔄 ${summary.inProgress} in progress\n` +
           `- ❌ ${summary.todo} pending\n\n`;
  });

  return compressed;
}

/**
 * Create a lite version of a file
 * @param {string} filePath - Path to file
 * @param {number} targetTokens - Target token count (if not specified, uses config)
 * @returns {Promise<{original: number, compressed: number, path: string}>} Result with token counts
 */
async function createLiteVersion(filePath, targetTokens) {
  try {
    // Read the original file
    const content = await fs.readFile(filePath, 'utf8');
    const originalTokens = countTokens(content);

    // Get filename and determine target tokens
    const fileName = path.basename(filePath);
    const fileTargetTokens = targetTokens ||
      (config.SUMMARIZATION.targetTokens[fileName] || Math.floor(originalTokens * 0.6));

    // If already under target, just copy the file
    if (originalTokens <= fileTargetTokens) {
      const liteFilePath = filePath.replace(/\.md$/, '.lite.md');
      await fs.writeFile(liteFilePath, content);
      return {
        original: originalTokens,
        compressed: originalTokens,
        path: liteFilePath
      };
    }

    // Get compressible sections for this file
    const compressibleSections =
      Object.entries(config.SUMMARIZATION.compressibleSections)
        .find(([file]) => file === fileName)?.[1] || [];

    // Compress the content
    let compressed = compressMarkdown(content, compressibleSections);
    let compressedTokens = countTokens(compressed);

    // If still over target, apply more aggressive compression
    if (compressedTokens > fileTargetTokens) {
      // Remove all code blocks
      compressed = compressed.replace(/```[\s\S]*?```/g, '```\n// Code removed to save tokens\n```');

      // Remove all mermaid diagrams
      compressed = compressed.replace(/```mermaid[\s\S]*?```/g, '```mermaid\n// Diagram removed to save tokens\n```');

      // Compress all lists
      compressed = compressed.replace(/(?:- .*\n)+/g, (match) => {
        const lines = match.split('\n').filter(Boolean);
        if (lines.length > 5) {
          return lines.slice(0, 3).join('\n') + '\n- ...\n' + lines.slice(-2).join('\n') + '\n';
        }
        return match;
      });

      compressedTokens = countTokens(compressed);
    }

    // If still over target, truncate with a note
    if (compressedTokens > fileTargetTokens) {
      const ratio = fileTargetTokens / compressedTokens;
      const lines = compressed.split('\n');
      const keepLines = Math.floor(lines.length * ratio) - 5; // Leave room for the note

      compressed = lines.slice(0, keepLines).join('\n') +
        '\n\n---\n\n*Note: This file has been truncated to save tokens. See the original file for complete content.*';

      compressedTokens = countTokens(compressed);
    }

    // Write the lite version
    const liteFilePath = filePath.replace(/\.md$/, '.lite.md');
    await fs.writeFile(liteFilePath, compressed);

    return {
      original: originalTokens,
      compressed: compressedTokens,
      path: liteFilePath
    };
  } catch (error) {
    console.error(`Error creating lite version of ${filePath}:`, error);
    throw error;
  }
}

/**
 * Create lite versions of all core files
 * @returns {Promise<Array<{file: string, original: number, compressed: number, reduction: string}>>} Results
 */
async function createAllLiteVersions() {
  const results = [];

  // Process each core file
  for (const taskType in config.TASK_TEMPLATES) {
    const template = config.TASK_TEMPLATES[taskType];

    for (const filePath of template.coreFiles) {
      // Skip if not a markdown file
      if (!filePath.endsWith('.md')) continue;

      // Skip if already a lite version
      if (filePath.endsWith('.lite.md')) continue;

      try {
        // Check if file exists
        await fs.access(filePath);

        // Create lite version
        const result = await createLiteVersion(filePath);

        // Calculate reduction percentage
        const reduction = ((result.original - result.compressed) / result.original * 100).toFixed(1);

        results.push({
          file: path.basename(filePath),
          original: result.original,
          compressed: result.compressed,
          reduction: `${reduction}%`
        });
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }
  }

  return results;
}

/**
 * Archive historical sections from activeContext.md
 * @returns {Promise<{archived: boolean, path: string}>} Result
 */
async function archiveHistory() {
  try {
    const activeContextPath = path.join(config.MEMORY_BANK_PATH, 'activeContext.md');
    const historyArchivePath = path.join(config.MEMORY_BANK_PATH, 'history-archive');

    // Create archive directory if it doesn't exist
    try {
      await fs.mkdir(historyArchivePath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }

    // Read activeContext.md
    const content = await fs.readFile(activeContextPath, 'utf8');

    // Extract "Recent Changes" section
    const recentChangesMatch = content.match(/## Recent Changes\s+([\s\S]*?)(?=\n## |$)/);

    if (recentChangesMatch) {
      const recentChanges = recentChangesMatch[1];

      // Create archive file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveFilePath = path.join(historyArchivePath, `recent-changes-${timestamp}.md`);

      await fs.writeFile(archiveFilePath, `# Archived Recent Changes (${timestamp})\n\n${recentChanges}`);

      // Remove "Recent Changes" section from activeContext.md
      const updatedContent = content.replace(
        /## Recent Changes\s+([\s\S]*?)(?=\n## |$)/,
        '## Recent Changes\n\n*Historical changes have been archived to maintain context efficiency. See history-archive directory.*\n\n'
      );

      await fs.writeFile(activeContextPath, updatedContent);

      return {
        archived: true,
        path: archiveFilePath
      };
    }

    return {
      archived: false,
      path: ''
    };
  } catch (error) {
    console.error('Error archiving history:', error);
    return {
      archived: false,
      path: '',
      error: error.message
    };
  }
}

module.exports = {
  compressMarkdown,
  createLiteVersion,
  createAllLiteVersions,
  archiveHistory
};
