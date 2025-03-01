/**
 * MCP Diagnostic Setup Script
 *
 * This script sets up the diagnostic environment for troubleshooting MCP connection issues.
 * It creates an enhanced version of the knowledge-system server with detailed logging
 * and prepares directories for logs and test results.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Base paths
const scriptDir = __dirname;
const projectDir = path.resolve(scriptDir, '../..');
const mcpDir = 'C:/Users/jaked/OneDrive/Documents/Cline/MCP';

// Create logs directory
const logsDir = path.join(projectDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log(`Created logs directory: ${logsDir}`);
}

// Create results directory
const resultsDir = path.join(projectDir, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
  console.log(`Created results directory: ${resultsDir}`);
}

// Create enhanced server for knowledge-system
function createEnhancedServer(serverName) {
  console.log(`Creating enhanced server for ${serverName}...`);

  // Path to the original server file
  const originalServerPath = path.join(mcpDir, serverName, 'src/index.js');
  // Path to the enhanced server file
  const enhancedServerPath = path.join(mcpDir, serverName, 'src/index-enhanced.js');

  // Check if original server exists
  if (!fs.existsSync(originalServerPath)) {
    console.error(`Error: Original server file not found at ${originalServerPath}`);
    return false;
  }

  try {
    // Read the original server file
    let serverCode = fs.readFileSync(originalServerPath, 'utf8');

// Add enhanced logging
const enhancedLogging = `
// Enhanced logging for MCP connection diagnostics

// Create log directory and file path
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFile = join(__dirname, '../logs/connection.log');
const logDir = dirname(logFile);

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log function that writes to both console and file
function logDiagnostic(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = \`[\${timestamp}] \${message}\${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n\`;

  console.error(logMessage);

  // Append to log file
  fs.appendFileSync(logFile, logMessage);
}

// Log server startup
logDiagnostic('Enhanced diagnostic server starting');
logDiagnostic('Process ID', process.pid);
logDiagnostic('Node version', process.version);
logDiagnostic('Environment variables', {
  PINECONE_API_KEY: process.env.PINECONE_API_KEY ? 'Set (length: ' + process.env.PINECONE_API_KEY.length + ')' : 'Not set',
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'Not set'
});

// Monkey patch the server's connection handling
const originalStdin = process.stdin;
const originalStdout = process.stdout;

// Wrap stdin to log incoming data
const wrappedStdin = Object.create(originalStdin);
wrappedStdin.on = function(event, listener) {
  if (event === 'data') {
    const wrappedListener = (data) => {
      logDiagnostic('Received data from stdin', data.toString());
      listener(data);
    };
    return originalStdin.on(event, wrappedListener);
  }
  return originalStdin.on(event, listener);
};
process.stdin = wrappedStdin;

// Wrap stdout to log outgoing data
const wrappedStdout = Object.create(originalStdout);
wrappedStdout.write = function(chunk, encoding, callback) {
  logDiagnostic('Writing data to stdout', chunk.toString());
  return originalStdout.write(chunk, encoding, callback);
};
process.stdout = wrappedStdout;

// Log process exit
process.on('exit', (code) => {
  logDiagnostic(\`Process exiting with code \${code}\`);
});

// Log uncaught exceptions
process.on('uncaughtException', (err) => {
  logDiagnostic('Uncaught exception', err.stack);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logDiagnostic('Unhandled promise rejection', { reason: reason.toString(), promise });
});
`;

    // Insert the enhanced logging at the beginning of the file
    serverCode = enhancedLogging + '\n' + serverCode;

    // Write the enhanced server file
    fs.writeFileSync(enhancedServerPath, serverCode);

    console.log(`Enhanced server created at: ${enhancedServerPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating enhanced server: ${error.message}`);
    return false;
  }
}

// Create enhanced servers for all MCP servers
const servers = ['knowledge-system', 'file-operations-server'];
let success = true;

for (const server of servers) {
  if (!createEnhancedServer(server)) {
    success = false;
  }
}

// Create test result template files
function createTestResultTemplate(testNumber, testName) {
  const templateContent = `# Test ${testNumber}: ${testName}

## Date and Time
${new Date().toISOString()}

## Environment
- VSCode Version: [Version]
- Claude Extension Version: [Version]
- OS: Windows 11
- Node.js Version: ${process.version}

## Steps Performed
1. [Step 1]
2. [Step 2]
3. ...

## Expected Result
[What was expected to happen]

## Actual Result
[What actually happened]

## Observations
[Any additional observations or notes]

## Logs/Screenshots
[Include relevant logs or screenshots]

## Conclusion
[What this test tells us about the issue]

## Next Steps
[Recommended next steps based on this test]
`;

  const fileName = `Test_${testNumber}_${testName.replace(/\s+/g, '_')}.md`;
  const filePath = path.join(resultsDir, fileName);

  fs.writeFileSync(filePath, templateContent);
  console.log(`Created test result template: ${filePath}`);
}

// Create test result templates
createTestResultTemplate(1, 'VSCode Extension Logs Analysis');
createTestResultTemplate(2, 'Enhanced Server Logging');
createTestResultTemplate(3, 'Process Monitoring Test');
createTestResultTemplate(4, 'VSCode Profile Test');
createTestResultTemplate(5, 'Firewall Antivirus Test');

// Create a simple wrapper script for starting the enhanced servers
const wrapperScriptContent = `#!/usr/bin/env node
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
    console.error(\`Error: Unknown server name: \${serverName}\`);
    console.error('Available servers: knowledge-system, file-operations');
    process.exit(1);
}

console.log(\`Starting enhanced \${serverName} server...\`);
console.log(\`Server path: \${serverPath}\`);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('close', (code) => {
  console.log(\`Server process exited with code \${code}\`);
});

console.log('Server started. Press Ctrl+C to stop.');
`;

const wrapperScriptPath = path.join(scriptDir, 'start-enhanced-server.js');
fs.writeFileSync(wrapperScriptPath, wrapperScriptContent);
console.log(`Created server starter script: ${wrapperScriptPath}`);

// Print summary
console.log('\n=== Diagnostic Setup Summary ===');
console.log(`Logs directory: ${logsDir}`);
console.log(`Results directory: ${resultsDir}`);
console.log(`Enhanced servers created: ${success ? 'Yes' : 'Partially'}`);
console.log(`Test result templates created: Yes`);
console.log(`Server starter script created: ${wrapperScriptPath}`);
console.log('\n=== Next Steps ===');
console.log('1. Run the diagnostic tests as outlined in the MCP Prioritized Diagnostic Plan');
console.log('2. Use the start-enhanced-server.js script to start the enhanced servers:');
console.log('   node src/scripts/start-enhanced-server.js knowledge-system');
console.log('3. Document your findings in the test result templates');
console.log('4. Check the logs directory for detailed server logs');
