/**
 * Run Neural Network Example
 *
 * This script demonstrates the neural network example by training a simple
 * neural network on the XOR problem using our automatic differentiation system.
 */

// Import the example
const { runXORExample } = require('./neural-network');

console.log('=== Neural Network Example with Automatic Differentiation ===');
console.log('This example demonstrates training a simple neural network on the XOR problem');
console.log('using our automatic differentiation system for backpropagation.\n');

// Run the example
runXORExample();
