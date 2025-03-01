/**
 * MCP Direct Access Utility
 *
 * This utility provides a simple way to interact with MCP servers directly,
 * bypassing the VSCode extension. It can be used as an alternative approach
 * while the MCP connection issues are being resolved.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Base paths
const mcpDir = 'C:/Users/jaked/OneDrive/Documents/Cline/MCP';

/**
 * Server configurations
 */
const servers = {
  'knowledge-system': {
    path: path.join(mcpDir, 'knowledge-system/src/index.js'),
    command: 'node',
    env: {
      PINECONE_API_KEY: process.env.PINECONE_API_KEY,
      PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
      PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'cline-memory',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    }
  },
  'file-operations': {
    path: path.join(mcpDir, 'file-operations-server/src/index.js'),
    command: 'node',
    env: {}
  },
  'api-integration': {
    path: path.join(mcpDir, 'api-integration-server/start.ps1'),
    command: 'pwsh',
    args: ['-File'],
    env: {}
  }
};

/**
 * Start an MCP server
 * @param {string} serverName - The name of the server to start
 * @param {boolean} enhanced - Whether to use the enhanced version of the server
 * @returns {object} - The server process
 */
function startServer(serverName, enhanced = false) {
  if (!servers[serverName]) {
    throw new Error(`Unknown server: ${serverName}`);
  }

  const server = servers[serverName];
  let serverPath = server.path;

  // Use enhanced version if requested
  if (enhanced) {
    const pathInfo = path.parse(serverPath);
    serverPath = path.join(pathInfo.dir, pathInfo.name + '-enhanced' + pathInfo.ext);

    if (!fs.existsSync(serverPath)) {
      throw new Error(`Enhanced server not found: ${serverPath}. Run the diagnostic setup script first.`);
    }
  }

  console.log(`Starting ${enhanced ? 'enhanced ' : ''}${serverName} server...`);

  const args = server.args || [];
  args.push(serverPath);

  const serverProcess = spawn(server.command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...server.env }
  });

  // Log server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`[${serverName}] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[${serverName}] ${data.toString().trim()}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`[${serverName}] Server process exited with code ${code}`);
  });

  return serverProcess;
}

/**
 * Send a request to an MCP server
 * @param {object} serverProcess - The server process
 * @param {object} request - The request to send
 * @returns {Promise<object|string>} - The response from the server
 */
function sendRequest(serverProcess, request) {
  return new Promise((resolve, reject) => {
    let responseData = '';
    let responseTimeout;

    // Set up response handler
    const dataHandler = (data) => {
      const dataStr = data.toString();
      responseData += dataStr;

      // Reset timeout on data received
      clearTimeout(responseTimeout);
      responseTimeout = setTimeout(() => {
        // If we've waited long enough without getting more data, assume the response is complete
        serverProcess.stdout.removeListener('data', dataHandler);

        try {
          // Try to parse the response as JSON
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          // If it's not valid JSON, return the raw string
          resolve(responseData);
        }
      }, 500);

      try {
        // Try to parse the response as JSON
        const response = JSON.parse(responseData);

        // Remove the handler to avoid processing the same response multiple times
        serverProcess.stdout.removeListener('data', dataHandler);
        clearTimeout(responseTimeout);

        resolve(response);
      } catch (error) {
        // Not a complete JSON response yet, continue collecting data
      }
    };

    // Set up error handler
    const errorHandler = (data) => {
      const errorStr = data.toString();
      console.error(`Server error: ${errorStr}`);

      // Don't reject immediately, as some servers output to stderr but still function correctly
      if (errorStr.includes('Error') || errorStr.includes('error')) {
        serverProcess.stderr.removeListener('data', errorHandler);
        reject(new Error(errorStr));
      }
    };

    // Add handlers
    serverProcess.stdout.on('data', dataHandler);
    serverProcess.stderr.on('data', errorHandler);

    // Set a timeout for the initial response
    responseTimeout = setTimeout(() => {
      serverProcess.stdout.removeListener('data', dataHandler);
      reject(new Error('Request timed out'));
    }, 10000);

    // Send the request
    const requestStr = JSON.stringify(request) + '\n';
    serverProcess.stdin.write(requestStr);
  });
}

/**
 * List available tools for a server
 * @param {object} serverProcess - The server process
 * @returns {Promise<object>} - The list of available tools
 */
async function listTools(serverProcess) {
  const request = { type: 'list_tools' };
  return sendRequest(serverProcess, request);
}

/**
 * Call a tool on a server
 * @param {object} serverProcess - The server process
 * @param {string} toolName - The name of the tool to call
 * @param {object} arguments - The arguments to pass to the tool
 * @returns {Promise<object|string>} - The result of the tool call
 */
async function callTool(serverProcess, toolName, arguments) {
  const request = {
    type: 'call_tool',
    name: toolName,
    arguments: arguments
  };

  return sendRequest(serverProcess, request);
}

/**
 * Store a memory in the knowledge system
 * @param {object} serverProcess - The knowledge system server process
 * @param {string} text - The text content to store
 * @param {object} metadata - Additional metadata to store with the memory
 * @returns {Promise<object|string>} - The result of storing the memory
 */
async function storeMemory(serverProcess, text, metadata = {}) {
  try {
    const result = await callTool(serverProcess, 'store_memory', {
      text,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });

    // Handle different response formats
    if (typeof result === 'object' && result.content && Array.isArray(result.content)) {
      // Extract text from content array if available
      const textContent = result.content.find(item => item.type === 'text');
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }

    return result;
  } catch (error) {
    console.error('Error storing memory:', error.message || error);
    throw error;
  }
}

/**
 * Query memories from the knowledge system
 * @param {object} serverProcess - The knowledge system server process
 * @param {string} query - The query text to search for similar memories
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<object|string>} - The query results
 */
async function queryMemories(serverProcess, query, limit = 5) {
  try {
    const result = await callTool(serverProcess, 'query_memories', {
      query,
      limit
    });

    // Handle different response formats
    if (typeof result === 'object' && result.content && Array.isArray(result.content)) {
      // Extract text from content array if available
      const textContent = result.content.find(item => item.type === 'text');
      if (textContent && textContent.text) {
        return textContent.text;
      }
    }

    return result;
  } catch (error) {
    console.error('Error querying memories:', error.message || error);
    throw error;
  }
}

/**
 * Read a file using the file operations server
 * @param {object} serverProcess - The file operations server process
 * @param {string} path - The path of the file to read
 * @returns {Promise<object|string>} - The file contents
 */
async function readFile(serverProcess, path) {
  return callTool(serverProcess, 'read_file', {
    path
  });
}

/**
 * Write to a file using the file operations server
 * @param {object} serverProcess - The file operations server process
 * @param {string} path - The path of the file to write to
 * @param {string} content - The content to write to the file
 * @returns {Promise<object|string>} - The result of writing the file
 */
async function writeFile(serverProcess, path, content) {
  return callTool(serverProcess, 'write_file', {
    path,
    content
  });
}

// Export the utility functions
module.exports = {
  startServer,
  sendRequest,
  listTools,
  callTool,
  storeMemory,
  queryMemories,
  readFile,
  writeFile
};
