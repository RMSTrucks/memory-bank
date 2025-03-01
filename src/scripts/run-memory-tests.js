/**
 * Run Memory System Tests
 *
 * This script runs all the tests for the Memory System to ensure it's working correctly.
 * It uses Jest to run the tests and provides a summary of the results.
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  // Test files to run
  testFiles: [
    'memory-system.test.js',
    'cline-memory-integration.test.js',
    'memory-markdown-integration.test.js'
  ],

  // Jest options
  jestOptions: {
    verbose: true,
    coverage: true,
    bail: false, // Don't stop on first failure
    testTimeout: 30000 // 30 seconds
  }
};

/**
 * Run the tests
 */
function runTests() {
  console.log('=== Running Memory System Tests ===\n');

  try {
    // Build the Jest command
    const jestBin = path.join('node_modules', '.bin', 'jest');
    const testFilesArg = CONFIG.testFiles.map(file => `src/test/${file}`).join(' ');
    const jestOptionsArg = Object.entries(CONFIG.jestOptions)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? `--${key}` : '';
        } else {
          return `--${key}=${value}`;
        }
      })
      .filter(Boolean)
      .join(' ');

    const command = `${jestBin} ${testFilesArg} ${jestOptionsArg}`;

    console.log(`Running command: ${command}\n`);

    // Execute the command
    const output = execSync(command, { encoding: 'utf8' });

    console.log(output);
    console.log('\n=== Memory System Tests Completed ===');

    return true;
  } catch (error) {
    console.error('Error running tests:', error.message || error);
    if (error.stdout) {
      console.log('Test output:');
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error('Test errors:');
      console.error(error.stderr);
    }

    console.log('\n=== Memory System Tests Failed ===');

    return false;
  }
}

/**
 * Main function
 */
function main() {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

// Run the main function
main();
