/**
 * Query Tensor Operations Milestone
 *
 * This script queries for tensor operations-related memories in Pinecone
 * to verify that the milestone was stored correctly.
 */

const mcpDirectAccess = require('../utils/mcp-direct-access');

async function queryTensorMilestone() {
  console.log('Querying for tensor operations milestone...');

  try {
    // Start the knowledge system server
    console.log('Starting knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', true); // Use enhanced server

    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Query for tensor operations-related memories
    console.log('Querying memories...');
    const result = await mcpDirectAccess.queryMemories(
      server,
      "tensor operations neural computation framework", // Query text
      5 // Limit (default is 5)
    );

    console.log('Query results:');
    console.log(JSON.stringify(result, null, 2));

    // Shutdown the server
    console.log('Shutting down server...');
    server.kill();
  } catch (error) {
    console.error('Error querying tensor operations milestone:', error.message || error);
  }
}

// Execute the function
queryTensorMilestone().catch(error => {
  console.error('Unhandled error:', error.message || error);
});
