# MCP Diagnostic Guide

## Overview

This guide provides instructions for diagnosing and resolving issues with the Knowledge System MCP integration. We've created enhanced diagnostic tools to systematically identify and fix connection problems between VSCode and the MCP servers.

## Diagnostic Tools

We've developed three diagnostic tools to help troubleshoot MCP connection issues:

1. **Enhanced Test Connection Script**
   - Location: `../../OneDrive/Documents/Cline/MCP/knowledge-system/test-connection.js`
   - Purpose: Tests direct communication with the server and verifies environment variables

2. **Enhanced Start Server Script**
   - Location: `../../OneDrive/Documents/Cline/MCP/knowledge-system/start-server.js`
   - Purpose: Provides detailed logging about server startup and environment

3. **Comprehensive MCP Diagnostic Script**
   - Location: `../../OneDrive/Documents/Cline/MCP/knowledge-system/mcp-diagnostic.js`
   - Purpose: Runs a series of tests to isolate and identify MCP connection issues

## Running the Diagnostic Tests

### Method 1: Run the Comprehensive Diagnostic

The comprehensive diagnostic script runs a series of tests to identify the root cause of MCP connection issues:

```bash
cd C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system
node mcp-diagnostic.js
```

This script will:
1. Check environment variables
2. Test server startup
3. Test direct communication
4. Verify MCP configuration

### Method 2: Test Direct Server Communication

To test if the server itself is working correctly:

```bash
cd C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system
node test-connection.js
```

This will:
1. Log environment variables
2. Start the server
3. Send test requests
4. Display the server's response

### Method 3: Start Server with Enhanced Logging

To start the server with detailed logging:

```bash
cd C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system
node start-server.js
```

This will:
1. Log environment and system information
2. Start the server with debug logging enabled
3. Display detailed server output

## Interpreting Results

### Environment Variables

The diagnostic tools check if all required environment variables are present and correctly formatted:

- `PINECONE_API_KEY`: Required for vector database connection
- `PINECONE_ENVIRONMENT`: Specifies the Pinecone environment
- `PINECONE_INDEX_NAME`: Specifies the Pinecone index
- `OPENAI_API_KEY`: Required for OpenAI API access

The tools will also check the format of the OpenAI API key to ensure it's compatible with the API version.

### Server Startup

The diagnostic tools verify that the server starts successfully and connects to all required services:

- Server process creation
- Environment variable loading
- Service connections (OpenAI, Pinecone)
- Error handling

### Direct Communication

The diagnostic tools test direct communication with the server:

- Request sending
- Response handling
- Tool listing
- Memory storage

### MCP Configuration

The diagnostic tools check the MCP configuration in VSCode:

- Settings file existence
- Knowledge System configuration
- Script path validation
- Environment variable configuration

## Common Issues and Solutions

### 1. Environment Variable Issues

**Symptoms:**
- Server fails to connect to OpenAI or Pinecone
- Error messages about missing API keys

**Solutions:**
- Verify all required environment variables are set in `.env`
- Check API key formats
- Ensure API keys are valid and active

### 2. Server Startup Issues

**Symptoms:**
- Server fails to start
- Error messages during startup

**Solutions:**
- Check for Node.js version compatibility
- Verify all dependencies are installed
- Check for port conflicts

### 3. MCP Configuration Issues

**Symptoms:**
- VSCode cannot connect to the MCP server
- "Not connected" errors

**Solutions:**
- Verify MCP settings in VSCode
- Ensure the server is not disabled
- Check script paths
- Restart VSCode completely

### 4. VSCode Extension Issues

**Symptoms:**
- All tests pass but VSCode still cannot connect

**Solutions:**
- Restart VSCode completely
- Check VSCode extension logs
- Reinstall the Claude extension
- Restart your computer

## Next Steps

If the diagnostic tests identify issues:

1. Follow the specific recommendations provided by the diagnostic output
2. Make the necessary corrections
3. Run the tests again to verify the fixes
4. Restart VSCode completely

If all tests pass but issues persist:

1. Check VSCode extension logs
2. Restart your computer
3. Consider reinstalling the Claude extension

## Conclusion

These diagnostic tools provide a systematic approach to identifying and resolving MCP connection issues. By following the steps outlined in this guide, you should be able to diagnose and fix most common problems with the Knowledge System MCP integration.
