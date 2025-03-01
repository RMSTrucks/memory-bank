# MCP Prioritized Diagnostic Plan

This document outlines a prioritized approach to diagnosing the MCP connection issues we're experiencing. The tests are arranged in order of priority, focusing on the most likely causes first.

## Test 1: VSCode Extension Logs Analysis

**Objective**: Examine VSCode extension logs to identify specific error messages related to MCP connections.

**Steps**:
1. Open VSCode
2. Open the Output panel (View > Output)
3. Select "Claude" from the dropdown menu
4. Attempt to use an MCP tool
5. Record any error messages that appear

**Expected Result**: Specific error messages that provide insight into the connection issue.

**Analysis Guide**:
- Look for error codes or specific messages about connection failures
- Note any timeout messages or connection refused errors
- Check for any permission-related issues

## Test 2: Enhanced Server Logging

**Objective**: Add detailed logging to the MCP server to track connection attempts and identify where the connection fails.

**Implementation**:

```javascript
// Create a modified version of the knowledge-system server with enhanced logging
const fs = require('fs');
const path = require('path');

// Path to the original server file
const originalServerPath = 'C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system/src/index.js';
// Path to the enhanced server file
const enhancedServerPath = 'C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system/src/index-enhanced.js';

// Read the original server file
let serverCode = fs.readFileSync(originalServerPath, 'utf8');

// Add enhanced logging
const enhancedLogging = `
// Enhanced logging for MCP connection diagnostics
const logFile = path.join(__dirname, '../logs/connection.log');
const logDir = path.dirname(logFile);

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

console.log('Enhanced server created at:', enhancedServerPath);
```

**Steps**:
1. Run the script to create an enhanced version of the server
2. Start the enhanced server: `node C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system/src/index-enhanced.js`
3. Attempt to use an MCP tool from VSCode
4. Examine the log file for connection details

**Expected Result**: Detailed logs showing the connection process and where it fails.

**Analysis Guide**:
- Check if the server receives any connection attempts
- Look for any errors during the connection process
- Identify if the connection is established but then closed
- Note any timeout patterns

## Test 3: Process Monitoring Test

**Objective**: Monitor process activity to determine if the issue is with process creation or connection.

**Steps**:
1. Start an MCP server manually: `node C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system/src/index.js`
2. Open Task Manager and locate the Node.js process
3. Attempt to use an MCP tool from VSCode
4. Observe if new processes are created or if the existing process receives communication

**Expected Result**: Insights into whether VSCode is creating new processes or attempting to communicate with the existing one.

**Analysis Guide**:
- If new processes are created, the issue may be with process management
- If no new processes are created, the issue may be with connection establishment
- Check if the existing process shows increased CPU or memory usage during connection attempts

## Test 4: VSCode Profile Test

**Objective**: Create a clean VSCode environment to eliminate potential conflicts with other extensions or settings.

**Steps**:
1. Create a new VSCode profile (File > Preferences > Profiles > Create Profile)
2. Install only the Claude extension
3. Configure the MCP settings
4. Test MCP connections in this clean environment

**Expected Result**: Determine if the issue is related to other extensions or settings.

**Analysis Guide**:
- If the issue persists in a clean profile, it's likely a core issue with the extension or MCP
- If the issue is resolved, identify which extensions or settings might be causing conflicts

## Test 5: Firewall/Antivirus Test

**Objective**: Determine if security software is interfering with the MCP connections.

**Steps**:
1. Temporarily disable Windows Defender and any other security software
2. Test MCP connections
3. Re-enable security software after testing

**Expected Result**: Insights into whether security software is blocking the connections.

**Analysis Guide**:
- If the issue is resolved with security software disabled, check the security logs
- Look for any blocked connections or processes
- Consider adding exceptions for VSCode and Node.js processes

## Test Results Documentation Template

Use this template to document the results of each test:

```
# Test X: [Test Name]

## Date and Time
[Date and time the test was performed]

## Environment
- VSCode Version: [Version]
- Claude Extension Version: [Version]
- OS: [OS Version]
- Node.js Version: [Version]

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
```

## Diagnostic Script

The following script can be used to automate the creation of the enhanced server and set up the testing environment:

```javascript
// mcp-diagnostic-setup.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create logs directory
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create results directory
const resultsDir = path.join(__dirname, '../results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Create enhanced server (code from Test 2)
// ... [Insert the enhanced server creation code here]

console.log('Diagnostic setup complete.');
console.log('Logs will be saved to:', logsDir);
console.log('Test results should be documented in:', resultsDir);
console.log('\nReady to begin testing. Please follow the test steps in the diagnostic plan.');
```

## Parallel Development Approach

While conducting these diagnostic tests, we should continue development using the direct server access approach:

1. **Create wrapper utilities** for common operations:
   - Server startup and management
   - Request formatting and sending
   - Response parsing and handling

2. **Document the approach** for team members:
   - How to start and interact with MCP servers
   - Common operations and their wrapper functions
   - Error handling and troubleshooting

3. **Implement knowledge storage and retrieval** using direct server access:
   - Create functions to store memories
   - Implement query functionality
   - Add error handling and retry logic

This parallel approach ensures that we can make progress on the project while we work to resolve the MCP connection issues.
