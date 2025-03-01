#!/usr/bin/env node
/**
 * MCP Enhanced Server Starter
 *
 * This script provides a simple way to start the enhanced MCP servers
 * for diagnostic purposes.
 *
 * Usage:
 *   node start-enhanced-server.js knowledge-system
 *   node start-enhanced-server.js file-operations
 */

const { spawn } = require('child_process');
const path = require('path');

const serverName = process.argv[2];
if (!serverName) {
  console.error('Error: Server name is required');
  console.error('Usage: node start-enhanced-server.js [server-name]');
  console.error('Available servers: knowledge-system, file-operations');
  process.exit(1);
}

const mcpDir = 'C:/Users/jaked/OneDrive/Documents/Cline/MCP';
let serverPath;

switch (serverName) {
  case 'knowledge-system':
    serverPath = path.join(mcpDir, 'knowledge-system/src/index-enhanced.js');
    break;
  case 'file-operations':
    serverPath = path.join(mcpDir, 'file-operations-server/src/index-enhanced.js');
    break;
  default:
    console.error(`Error: Unknown server name: ${serverName}`);
    console.error('Available servers: knowledge-system, file-operations');
    process.exit(1);
}

console.log(`Starting enhanced ${serverName} server...`);
console.log(`Server path: ${serverPath}`);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

console.log('Server started. Press Ctrl+C to stop.');
