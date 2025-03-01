#!/usr/bin/env node
/**
 * Context Optimizer Demo
 *
 * This script demonstrates how to use the Context Optimization System
 * in a real-world scenario to optimize context for Claude.
 */

const {
  optimizeContext,
  prepareMemoryBank,
  getTokenUsageStats
} = require('./index');

// Sample tasks for different scenarios
const tasks = [
  {
    type: 'implementation',
    description: 'Implement knowledge-project integration for the cognitive tools system',
    maxTokens: 50000
  },
  {
    type: 'architecture',
    description: 'Design the architecture for the neural computation framework',
    maxTokens: 50000
  },
  {
    type: 'documentation',
    description: 'Document the implementation partnership vision',
    maxTokens: 50000
  },
  {
    type: 'bugfix',
    description: 'Fix TypeScript errors in the knowledge-pattern bridge service',
    maxTokens: 50000
  }
];

/**
 * Run the demo
 */
async function runDemo() {
  try {
    console.log('=== Context Optimizer Demo ===\n');

    // Step 1: Get token usage statistics
    console.log('Step 1: Getting token usage statistics...');
    const stats = await getTokenUsageStats(true);
    console.log(`Total tokens in Memory Bank: ${stats.total}`);
    console.log('Top files by token usage:');
    Object.entries(stats.byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([file, tokens]) => {
        console.log(`- ${file}: ${tokens} tokens (${(tokens / stats.total * 100).toFixed(1)}%)`);
      });
    console.log();

    // Step 2: Prepare Memory Bank
    console.log('Step 2: Preparing Memory Bank...');
    const prepResult = await prepareMemoryBank({ verbose: true });
    console.log(`History archived: ${prepResult.historyArchived ? 'Yes' : 'No'}`);
    console.log(`Lite versions created: ${prepResult.liteVersions.length}`);
    console.log();

    // Step 3: Get updated token usage statistics
    console.log('Step 3: Getting updated token usage statistics...');
    const updatedStats = await getTokenUsageStats(true);
    console.log(`Total tokens in Memory Bank: ${updatedStats.total}`);
    console.log(`Token reduction: ${stats.total - updatedStats.total} tokens (${((stats.total - updatedStats.total) / stats.total * 100).toFixed(1)}%)`);
    console.log();

    // Step 4: Optimize context for different tasks
    console.log('Step 4: Optimizing context for different tasks...');

    for (const task of tasks) {
      console.log(`\nTask: ${task.description}`);
      console.log(`Type: ${task.type}`);
      console.log(`Max tokens: ${task.maxTokens}`);

      const result = await optimizeContext(task.description, {
        maxTokens: task.maxTokens,
        useLiteVersions: true,
        verbose: true
      });

      console.log(`Selected ${result.files.length} files with ${result.totalTokens} tokens`);
      console.log('Selected files:');
      result.files.forEach(file => {
        console.log(`- ${file.split('/').pop()}`);
      });

      // Don't print the actual content to keep the output clean
      console.log(`Content length: ${result.content.length} characters`);
    }

    console.log('\n=== Demo Complete ===');
  } catch (error) {
    console.error('Error running demo:', error);
  }
}

// Run the demo
runDemo().catch(console.error);
