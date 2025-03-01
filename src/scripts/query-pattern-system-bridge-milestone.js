/**
 * Query Pattern System Bridge Milestone
 *
 * This script queries the Pattern System Bridge milestone from the memory system
 * to verify it was stored correctly.
 */

const mcpDirectAccess = require('../utils/mcp-direct-access');

async function queryPatternSystemBridgeMilestone() {
  console.log('Querying Pattern System Bridge milestone...');

  try {
    // Start the knowledge system server
    console.log('Starting knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', true); // Use enhanced server

    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Query for the milestone
    console.log('Querying memory...');
    const query = "Pattern System Bridge Implementation";

    const result = await mcpDirectAccess.queryMemories(
      server,
      query,
      5 // Limit to 5 results
    );

    console.log('Query results:');
    console.log(JSON.stringify(result, null, 2));

    // Shutdown the server
    console.log('Shutting down server...');
    server.kill();
  } catch (error) {
    console.error('Error querying Pattern System Bridge milestone:', error.message || error);
  }
}

// Execute the function
queryPatternSystemBridgeMilestone().catch(error => {
  console.error('Unhandled error:', error.message || error);
});
