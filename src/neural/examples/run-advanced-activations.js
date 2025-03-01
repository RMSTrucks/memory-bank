/**
 * Runner for Advanced Activation Functions Example
 *
 * This script compiles and runs the advanced activation functions example.
 * It demonstrates the usage of LeakyReLU, ELU, GELU, and Swish/SiLU activation functions
 * in the Neural Computation Framework.
 */

// Import the example module
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Check if the TypeScript file exists
const tsFilePath = path.join(__dirname, 'advanced_activations_example.ts');
if (!fs.existsSync(tsFilePath)) {
  console.error(`Error: Could not find ${tsFilePath}`);
  process.exit(1);
}

// Compile the TypeScript file
console.log('Compiling TypeScript file...');
try {
  execSync('npx tsc --esModuleInterop ' + tsFilePath, { stdio: 'inherit' });
  console.log('Compilation successful.\n');
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}

// Run the compiled JavaScript file
const jsFilePath = tsFilePath.replace('.ts', '.js');
if (!fs.existsSync(jsFilePath)) {
  console.error(`Error: Compiled file ${jsFilePath} not found.`);
  process.exit(1);
}

console.log('Running advanced activation functions example...\n');
try {
  // Import and run the example
  const example = require('./advanced_activations_example');
  example.runExamples();
} catch (error) {
  console.error('Error running example:', error);
  process.exit(1);
}
