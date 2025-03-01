/**
 * Direct Store Tensor Operations Milestone
 *
 * This script directly uses the mcp-direct-access utility to store the tensor operations milestone
 * in Pinecone, bypassing the higher-level abstractions that might be causing issues.
 */

const mcpDirectAccess = require('../utils/mcp-direct-access');

// Define the milestone content
const milestoneContent = "Completed the implementation of tensor operations in the Neural Computation Framework on February 26, 2025. This includes element-wise operations (add, subtract, multiply, divide), matrix operations (matmul, transpose), reduction operations (sum, mean, max, min), and activation functions (sigmoid, tanh, relu, softmax). This milestone marks a significant step forward in the development of our Neural Computation Framework.";

// Define the metadata
const milestoneMetadata = {
  category: "milestone",
  importance: "high",
  title: "Tensor Operations Implementation Complete",
  tags: ["tensor-operations", "neural-computation", "typescript", "milestone"],
  namespace: "cline-patterns", // Explicitly set the namespace
  type: "pattern",
  source: "direct-access"
};

async function storeTensorMilestone() {
  console.log('Storing tensor operations milestone directly...');

  try {
    // Start the knowledge system server
    console.log('Starting knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', true); // Use enhanced server

    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Store the memory directly
    console.log('Storing memory...');
    const result = await mcpDirectAccess.storeMemory(
      server,
      milestoneContent,
      milestoneMetadata
    );

    console.log('Result:', result);

    if (result && (typeof result === 'string' && result.includes("Memory stored successfully"))) {
      console.log('Tensor operations milestone stored successfully!');
    } else {
      console.error('Failed to store tensor operations milestone.');
    }

    // Shutdown the server
    console.log('Shutting down server...');
    server.kill();
  } catch (error) {
    console.error('Error storing tensor operations milestone:', error.message || error);
  }
}

// Execute the function
storeTensorMilestone().catch(error => {
  console.error('Unhandled error:', error.message || error);
});
