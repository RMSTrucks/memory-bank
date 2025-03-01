/**
 * MCP Connection Monitor
 *
 * This script monitors MCP connections by starting a server and logging all communication.
 * It helps diagnose issues with MCP connections by providing detailed logs of the connection process.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Base paths
const scriptDir = __dirname;
const projectDir = path.resolve(scriptDir, '../..');
const mcpDir = 'C:/Users/jaked/OneDrive/Documents/Cline/MCP';
const logsDir = path.join(projectDir, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(logsDir, `mcp-connection-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log function
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;

  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Start a server
function startServer(serverName) {
  log(`Starting ${serverName} server...`);

  // Server paths
  const serverPaths = {
    'knowledge-system': path.join(mcpDir, 'knowledge-system/src/index.js'),
    'file-operations': path.join(mcpDir, 'file-operations-server/src/index.js'),
    'api-integration': path.join(mcpDir, 'api-integration-server/start.ps1')
  };

  // Server commands
  const serverCommands = {
    'knowledge-system': 'node',
    'file-operations': 'node',
    'api-integration': 'pwsh'
  };

  // Server arguments
  const serverArgs = {
    'knowledge-system': [],
    'file-operations': [],
    'api-integration': ['-File']
  };

  // Check if server exists
  const serverPath = serverPaths[serverName];
  if (!serverPath) {
    log(`Error: Unknown server: ${serverName}`);
    return null;
  }

  if (!fs.existsSync(serverPath)) {
    log(`Error: Server file not found: ${serverPath}`);
    return null;
  }

  // Start server
  const command = serverCommands[serverName];
  const args = [...serverArgs[serverName], serverPath];

  log(`Starting server with command: ${command} ${args.join(' ')}`);

  const server = spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  });

  // Log server output
  server.stdout.on('data', (data) => {
    log(`[${serverName}] STDOUT`, data.toString().trim());
  });

  server.stderr.on('data', (data) => {
    log(`[${serverName}] STDERR`, data.toString().trim());
  });

  // Log server exit
  server.on('close', (code) => {
    log(`[${serverName}] Server process exited with code ${code}`);
  });

  // Log server error
  server.on('error', (error) => {
    log(`[${serverName}] Server error`, error.toString());
  });

  return server;
}

// Monitor VSCode MCP connections
function monitorVSCodeConnections() {
  log('Starting VSCode MCP connection monitor...');

  // TODO: Implement VSCode MCP connection monitoring
  // This would require hooking into the VSCode extension process
  // which is beyond the scope of this script

  log('VSCode MCP connection monitoring not implemented yet.');
}

// Process command line arguments
function processArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node mcp-connection-monitor.js [server-name]');
    console.log('Available servers: knowledge-system, file-operations, api-integration');
    process.exit(1);
  }

  const serverName = args[0];

  // Start server
  const server = startServer(serverName);

  if (!server) {
    process.exit(1);
  }

  // Log startup
  log(`MCP Connection Monitor started for ${serverName}`);
  log(`Log file: ${logFile}`);

  // Handle process exit
  process.on('SIGINT', () => {
    log('Received SIGINT. Shutting down...');
    server.kill();
    logStream.end();
    process.exit(0);
  });
}

// Run the script
processArgs();
