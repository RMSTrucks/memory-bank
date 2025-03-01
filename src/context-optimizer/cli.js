#!/usr/bin/env node
/**
 * Context Optimizer CLI
 *
 * This script provides a command-line interface for the Context Optimizer system.
 * It allows users to optimize context, prepare Memory Bank, and get token usage statistics.
 */

const fs = require('fs').promises;
const path = require('path');
const {
  optimizeContext,
  prepareMemoryBank,
  getTokenUsageStats,
  createLiteVersion,
  archiveHistory
} = require('./index');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Help text
const helpText = `
Context Optimizer CLI

Usage:
  node cli.js <command> [options]

Commands:
  optimize <task>       Optimize context for a task
  prepare               Prepare Memory Bank for optimal context usage
  stats                 Get token usage statistics
  create-lite <file>    Create a lite version of a specific file
  archive-history       Archive history from activeContext.md
  help                  Show this help text

Options:
  --max-tokens <n>      Maximum tokens allowed (default: 180000)
  --no-lite             Don't use lite versions of files
  --create-lite         Create lite versions if they don't exist
  --verbose             Show detailed information
  --output <file>       Write output to a file instead of stdout

Examples:
  node cli.js optimize "Implement a new feature for the project"
  node cli.js optimize "Fix the bug in the event system" --max-tokens 150000 --verbose
  node cli.js prepare --verbose
  node cli.js stats --verbose
  node cli.js create-lite activeContext.md --verbose
  node cli.js archive-history --verbose
`;

// Parse options
const options = {
  maxTokens: 180000,
  useLiteVersions: true,
  createLiteVersions: false,
  verbose: false,
  output: null
};

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--max-tokens' && i + 1 < args.length) {
    options.maxTokens = parseInt(args[++i], 10);
  } else if (args[i] === '--no-lite') {
    options.useLiteVersions = false;
  } else if (args[i] === '--create-lite') {
    options.createLiteVersions = true;
  } else if (args[i] === '--verbose') {
    options.verbose = true;
  } else if (args[i] === '--output' && i + 1 < args.length) {
    options.output = args[++i];
  }
}

// Helper function to write output
async function writeOutput(content) {
  if (options.output) {
    await fs.writeFile(options.output, content);
    console.log(`Output written to ${options.output}`);
  } else {
    console.log(content);
  }
}

// Execute command
async function run() {
  try {
    switch (command) {
      case 'optimize': {
        const task = args[1];
        if (!task) {
          console.error('Error: Task description is required');
          console.log(helpText);
          process.exit(1);
        }

        console.log(`Optimizing context for task: "${task}"`);
        const result = await optimizeContext(task, options);

        // Format output
        const output = [
          `Task: ${task}`,
          `Task Type: ${result.analysis.taskType}`,
          `Keywords: ${result.analysis.keywords.slice(0, 10).join(', ')}`,
          `Selected ${result.files.length} files with ${result.totalTokens} tokens`,
          `Files:`,
          ...result.files.map(file => `- ${path.basename(file)}`),
          '',
          result.content
        ].join('\n');

        await writeOutput(output);
        break;
      }

      case 'prepare': {
        console.log('Preparing Memory Bank for optimal context usage...');
        const result = await prepareMemoryBank(options);

        // Format output
        const output = [
          'Memory Bank Preparation Results:',
          '',
          'Lite Versions Created:',
          ...result.liteVersions.map(({ file, original, compressed, reduction }) =>
            `- ${file}: ${original} → ${compressed} tokens (${reduction} reduction)`
          ),
          '',
          `History Archived: ${result.historyArchived ? 'Yes' : 'No'}`
        ].join('\n');

        await writeOutput(output);
        break;
      }

      case 'stats': {
        console.log('Getting token usage statistics...');
        const stats = await getTokenUsageStats(options.verbose);

        // Format output
        const output = [
          'Token Usage Statistics:',
          '',
          `Total Tokens: ${stats.total}`,
          '',
          'By Category:',
          ...Object.entries(stats.byCategory)
            .map(([category, tokens]) =>
              `- ${category}: ${tokens} tokens (${(tokens / stats.total * 100).toFixed(1)}%)`
            ),
          '',
          'Top Files by Token Usage:',
          ...Object.entries(stats.byFile)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([file, tokens]) =>
              `- ${file}: ${tokens} tokens (${(tokens / stats.total * 100).toFixed(1)}%)`
            )
        ].join('\n');

        await writeOutput(output);
        break;
      }

      case 'create-lite': {
        const file = args[1];
        if (!file) {
          console.error('Error: File path is required');
          console.log(helpText);
          process.exit(1);
        }

        console.log(`Creating lite version of ${file}...`);
        const result = await createLiteVersion(file);

        // Format output
        const output = [
          `Lite Version Created:`,
          `- Original: ${result.original} tokens`,
          `- Compressed: ${result.compressed} tokens`,
          `- Reduction: ${((result.original - result.compressed) / result.original * 100).toFixed(1)}%`,
          `- Path: ${result.path}`
        ].join('\n');

        await writeOutput(output);
        break;
      }

      case 'archive-history': {
        console.log('Archiving history from activeContext.md...');
        const result = await archiveHistory();

        // Format output
        const output = result.archived
          ? `History archived to ${result.path}`
          : 'No history to archive or archiving failed';

        await writeOutput(output);
        break;
      }

      case 'help':
      default:
        console.log(helpText);
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the CLI
run().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
