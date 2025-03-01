/**
 * Context Optimizer Configuration
 *
 * This file contains configuration settings for the Context Optimizer system,
 * including paths, token limits, and task templates.
 */

const path = require('path');

// Base path for Memory Bank
const MEMORY_BANK_PATH = 'c:/Users/jaked/PowerAgent/memory-bank';

// Token limits
const MAX_TOKENS = 180000; // Leave room for the response
const RESERVED_TOKENS = 20000; // Reserve tokens for the response

// Core files that should always be considered
const CORE_FILES = [
  'projectbrief.md',
  'activeContext.md'
];

// Task-specific templates
const TASK_TEMPLATES = {
  implementation: {
    coreFiles: ['projectbrief.md', 'activeContext.md', 'progress.md'],
    additionalPaths: [
      { dir: 'src/cognitive-tools', pattern: /\.(ts|js)$/, recursive: true },
      { dir: 'src/services', pattern: /\.(ts|js)$/, recursive: true },
      { dir: 'src/types', pattern: /\.(ts|js)$/, recursive: true }
    ],
    priorities: {
      'projectbrief.md': 1,
      'activeContext.md': 2,
      'progress.md': 3
    }
  },

  architecture: {
    coreFiles: ['projectbrief.md', 'systemPatterns.md', 'techContext.md', 'activeContext.md'],
    additionalPaths: [
      { dir: 'src/types', pattern: /\.(ts|js)$/, recursive: true },
      { dir: 'docs', pattern: /\.md$/, recursive: true },
      { dir: 'src/services', pattern: /\.(ts|js)$/, recursive: true }
    ],
    priorities: {
      'projectbrief.md': 1,
      'systemPatterns.md': 2,
      'techContext.md': 3,
      'activeContext.md': 4
    }
  },

  documentation: {
    coreFiles: ['projectbrief.md', 'productContext.md', 'progress.md'],
    additionalPaths: [
      { dir: 'docs', pattern: /\.md$/, recursive: true },
      { dir: 'templates', pattern: /\.md$/, recursive: true },
      { dir: 'examples', pattern: /\.md$/, recursive: true }
    ],
    priorities: {
      'projectbrief.md': 1,
      'productContext.md': 2,
      'progress.md': 3
    }
  },

  bugfix: {
    coreFiles: ['activeContext.md'],
    additionalPaths: [
      { dir: 'src', pattern: /\.(ts|js)$/, recursive: true },
      { dir: 'src/test', pattern: /\.(ts|js)$/, recursive: true }
    ],
    priorities: {
      'activeContext.md': 1
    }
  }
};

// File summarization settings
const SUMMARIZATION = {
  // Target token counts for lite versions of core files
  targetTokens: {
    'projectbrief.md': 5000,
    'productContext.md': 5000,
    'systemPatterns.md': 7000,
    'techContext.md': 5000,
    'activeContext.md': 10000,
    'progress.md': 5000
  },

  // Sections that can be safely summarized or removed
  compressibleSections: {
    'activeContext.md': [
      '### Strategic Approach: Implementation Partnership System',
      '### Cognitive Tools Integration',
      '### Neural Computation Framework',
      '### Pattern Evolution System',
      '### System Intelligence',
      '## Recent Changes',
      '## Active Decisions',
      '## Next Steps',
      '### Implementation Efficiency Metrics',
      '### Project Management Effectiveness',
      '### Optimization Targets',
      '### Recent Achievements'
    ],
    'progress.md': ['## Detailed Timeline', '## Performance Metrics'],
    'systemPatterns.md': ['### Implementation Examples']
  }
};

// Convert relative paths to absolute paths
function getAbsolutePath(relativePath) {
  return path.join(MEMORY_BANK_PATH, relativePath);
}

// Process templates to use absolute paths
function getProcessedTemplates() {
  const processed = {};

  for (const [taskType, template] of Object.entries(TASK_TEMPLATES)) {
    processed[taskType] = {
      ...template,
      coreFiles: template.coreFiles.map(file => getAbsolutePath(file)),
      additionalPaths: template.additionalPaths.map(({ dir, pattern, recursive }) => ({
        dir: getAbsolutePath(dir),
        pattern,
        recursive
      }))
    };
  }

  return processed;
}

module.exports = {
  MEMORY_BANK_PATH,
  MAX_TOKENS,
  RESERVED_TOKENS,
  CORE_FILES: CORE_FILES.map(file => getAbsolutePath(file)),
  TASK_TEMPLATES: getProcessedTemplates(),
  SUMMARIZATION,
  getAbsolutePath
};
