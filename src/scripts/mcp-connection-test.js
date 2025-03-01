/**
 * MCP Connection Test
 *
 * This script tests the connection to an MCP server using the direct access utility.
 * It helps diagnose issues with MCP connections by testing direct communication with the server.
 */

// Use CommonJS imports to avoid ES module issues
const mcpDirectAccess = require('../utils/mcp-direct-access');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Base paths
const scriptDir = __dirname;
const projectDir = path.resolve(scriptDir, '../..');
const logsDir = path.join(projectDir, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(logsDir, `mcp-connection-test-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log function
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;

  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Test connection to a server
async function testConnection(serverName) {
  log(`Testing connection to ${serverName} server...`);

  try {
    // Start server
    log(`Starting ${serverName} server...`);
    const server = mcpDirectAccess.startServer(serverName);

    // Wait for server to initialize
    log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // List available tools
    log('Listing available tools...');
    try {
      const toolsResponse = await mcpDirectAccess.listTools(server);
      log('Available tools', toolsResponse.tools.map(tool => tool.name));

      // Test each tool
      for (const tool of toolsResponse.tools) {
        log(`Testing tool: ${tool.name}...`);

        try {
          // Create test arguments based on tool name
          let args = {};

          if (tool.name === 'store_memory') {
            args = {
              text: 'This is a test memory for connection testing',
              metadata: {
                category: 'test',
                tags: ['connection-test']
              }
            };
          } else if (tool.name === 'query_memories') {
            args = {
              query: 'test memory',
              limit: 1
            };
          } else if (tool.name === 'read_file') {
            args = {
              path: 'test.txt'
            };
          } else if (tool.name === 'write_file') {
            args = {
              path: 'test.txt',
              content: 'This is a test file for connection testing'
            };
          }

          // Call tool
          const response = await mcpDirectAccess.callTool(server, tool.name, args);
          log(`Tool ${tool.name} response`, response);
        } catch (error) {
          log(`Error testing tool ${tool.name}`, error.toString());
        }
      }
    } catch (error) {
      log('Error listing tools', error.toString());
    }

    // Clean up
    log('Cleaning up...');
    server.kill();

    log(`Connection test for ${serverName} completed.`);
  } catch (error) {
    log(`Error testing connection to ${serverName}`, error.toString());
  }
}

// Process command line arguments
function processArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node mcp-connection-test.js [server-name]');
    console.log('Available servers: knowledge-system, file-operations');
    process.exit(1);
  }

  const serverName = args[0];

  // Log startup
  log(`MCP Connection Test started for ${serverName}`);
  log(`Log file: ${logFile}`);

  // Run test
  testConnection(serverName)
    .then(() => {
      log('Test completed.');
      logStream.end();
    })
    .catch(error => {
      log('Test failed', error.toString());
      logStream.end();
      process.exit(1);
    });
}

// Run the script
processArgs();
