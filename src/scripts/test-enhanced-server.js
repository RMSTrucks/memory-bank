/**
 * Test Enhanced Knowledge System Server
 *
 * This script tests the enhanced knowledge system server with the fixed Pinecone data format.
 */

const mcpDirectAccess = require('../utils/mcp-direct-access');

async function testEnhancedServer() {
  console.log('=== Testing Enhanced Knowledge System Server ===');

  try {
    // Start the enhanced knowledge system server
    console.log('Starting enhanced knowledge system server...');
    const server = mcpDirectAccess.startServer('knowledge-system', true);

    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // List available tools
    console.log('Listing available tools...');
    const toolsResponse = await mcpDirectAccess.listTools(server);
    console.log('Tools response:', toolsResponse);

    if (toolsResponse && toolsResponse.tools) {
      console.log('Available tools:', toolsResponse.tools.map(tool => tool.name));
    } else {
      console.log('No tools available or server not ready yet');

      // Wait a bit longer for the server to initialize
      console.log('Waiting for server to fully initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Store a memory
    console.log('Testing store_memory with fixed data format...');
    const storeResponse = await mcpDirectAccess.storeMemory(server, 'This is a test memory with the fixed Pinecone data format', {
      category: 'test',
      tags: ['fixed-format', 'pinecone-array']
    });
    console.log('Store response:', storeResponse);

    // Query memories
    console.log('Testing query_memories...');
    const queryResponse = await mcpDirectAccess.queryMemories(server, 'test memory');
    console.log('Query response:', queryResponse);

    // Clean up
    console.log('Cleaning up...');
    server.kill();

    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Error testing enhanced server:', error);
  }
}

// Run the test
testEnhancedServer();
