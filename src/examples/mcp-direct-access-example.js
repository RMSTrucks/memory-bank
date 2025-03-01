/**
 * MCP Direct Access Example
 *
 * This example demonstrates how to use the MCP direct access utility
 * to interact with MCP servers directly, bypassing the VSCode extension.
 *
 * Usage:
 *   node src/examples/mcp-direct-access-example.js
 */

const mcpDirectAccess = require('../utils/mcp-direct-access');

// Example 1: Knowledge System - Store and Query Memories
async function knowledgeSystemExample() {
  console.log('=== Knowledge System Example ===');

  try {
    // Start the knowledge system server
    console.log('Starting knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system');

    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // List available tools
    console.log('Listing available tools...');
    const toolsResponse = await mcpDirectAccess.listTools(server);
    console.log('Available tools:', toolsResponse.tools.map(tool => tool.name));

    // Store a memory
    console.log('Storing a memory...');
    const storeResponse = await mcpDirectAccess.storeMemory(server, 'This is a test memory for direct access', {
      category: 'test',
      tags: ['direct-access', 'example']
    });
    console.log('Store response:', storeResponse);

    // Query memories
    console.log('Querying memories...');
    const queryResponse = await mcpDirectAccess.queryMemories(server, 'test memory');
    console.log('Query response:', queryResponse);

    // Clean up
    console.log('Cleaning up...');
    server.kill();

    console.log('Knowledge system example completed successfully.');
  } catch (error) {
    console.error('Error in knowledge system example:', error);
  }
}

// Example 2: File Operations - Read and Write Files
async function fileOperationsExample() {
  console.log('\n=== File Operations Example ===');

  try {
    // Start the file operations server
    console.log('Starting file operations server...');
    const server = mcpDirectAccess.startServer('file-operations');

    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // List available tools
    console.log('Listing available tools...');
    const toolsResponse = await mcpDirectAccess.listTools(server);
    console.log('Available tools:', toolsResponse.tools.map(tool => tool.name));

    // Write a file
    const testFilePath = 'test-mcp-direct-access.txt';
    console.log(`Writing to file: ${testFilePath}...`);
    const writeResponse = await mcpDirectAccess.writeFile(server, testFilePath, 'This is a test file created using MCP direct access.');
    console.log('Write response:', writeResponse);

    // Read the file
    console.log(`Reading file: ${testFilePath}...`);
    const readResponse = await mcpDirectAccess.readFile(server, testFilePath);
    console.log('Read response:', readResponse);

    // Clean up
    console.log('Cleaning up...');
    server.kill();

    console.log('File operations example completed successfully.');
  } catch (error) {
    console.error('Error in file operations example:', error);
  }
}

// Example 3: Enhanced Server for Diagnostics
async function enhancedServerExample() {
  console.log('\n=== Enhanced Server Example ===');

  try {
    // Start the enhanced knowledge system server
    console.log('Starting enhanced knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', true);

    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // List available tools
    console.log('Listing available tools...');
    const toolsResponse = await mcpDirectAccess.listTools(server);
    console.log('Available tools:', toolsResponse.tools.map(tool => tool.name));

    // Store a memory
    console.log('Storing a memory...');
    const storeResponse = await mcpDirectAccess.storeMemory(server, 'This is a test memory for enhanced server', {
      category: 'diagnostic',
      tags: ['enhanced-server', 'example']
    });
    console.log('Store response:', storeResponse);

    // Clean up
    console.log('Cleaning up...');
    server.kill();

    console.log('Enhanced server example completed successfully.');
    console.log('Check the logs directory for detailed connection logs.');
  } catch (error) {
    console.error('Error in enhanced server example:', error);
  }
}

// Run the examples
async function runExamples() {
  try {
    // Run the knowledge system example
    await knowledgeSystemExample();

    // Run the file operations example
    await fileOperationsExample();

    // Run the enhanced server example
    // Note: This requires running the diagnostic setup script first
    // await enhancedServerExample();

    console.log('\nAll examples completed.');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run the examples
runExamples();

/**
 * Notes:
 *
 * 1. Error Handling:
 *    - The examples include basic error handling, but in a real application,
 *      you would want to implement more robust error handling and recovery.
 *
 * 2. Server Management:
 *    - In a real application, you might want to implement a more sophisticated
 *      server management system that can handle server restarts, connection
 *      failures, etc.
 *
 * 3. Enhanced Server:
 *    - The enhanced server example requires running the diagnostic setup script first:
 *      node src/scripts/mcp-diagnostic-setup.js
 *
 * 4. Environment Variables:
 *    - The knowledge system server requires environment variables for Pinecone and OpenAI.
 *      These are loaded from process.env in the mcp-direct-access.js utility.
 *      Make sure these variables are set in your environment or in a .env file.
 */
