# MCP Connection Troubleshooting Guide

## Summary

This guide provides steps for troubleshooting MCP connection issues with the VSCode extension. It's designed to help diagnose and resolve issues when MCP servers are correctly configured but not connecting properly with the VSCode extension.

## Diagnostic Results

Our comprehensive diagnostic has confirmed that all components of the Knowledge System MCP integration are working correctly:

1. Environment variables are properly configured
2. Server starts successfully and connects to all required services
3. Direct communication with the server works properly
4. MCP configuration in VSCode is valid

However, when attempting to use MCP tools directly from VSCode, we encounter connection errors:

- Knowledge System: "Connection closed" error
- File Operations: "Not connected" error

This suggests that the issue is with the VSCode extension's ability to connect to the MCP servers, not with the servers themselves or their configuration.

## Troubleshooting Steps

### 1. Restart VSCode

The most common solution is to completely restart VSCode (not just the window):

1. Close all VSCode windows
2. End any VSCode processes in Task Manager if necessary
3. Restart VSCode
4. Wait a few minutes for all extensions to initialize

### 2. Check VSCode Extension Logs

If restarting doesn't help, check the VSCode extension logs:

1. Open VSCode
2. Go to the "Output" panel (View > Output)
3. Select "Claude" from the dropdown
4. Look for any errors related to MCP connections

### 3. Verify Extension Version

Make sure you're using the latest version of the Claude extension:

1. Go to Extensions (Ctrl+Shift+X)
2. Find the Claude extension
3. Check if an update is available
4. If available, update the extension

### 4. Reinstall the Extension

If updating doesn't help, try reinstalling the extension:

1. Go to Extensions (Ctrl+Shift+X)
2. Find the Claude extension
3. Click the gear icon and select "Uninstall"
4. Restart VSCode
5. Reinstall the Claude extension

### 5. System Restart

If all else fails, restart your computer:

1. Save all your work
2. Restart your computer
3. Start VSCode
4. Wait a few minutes for all extensions to initialize

### 6. Alternative Usage Methods

If you need to use the MCP servers immediately, you can use them directly through the command line:

```bash
# For Knowledge System
cd C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system
node start-server.js

# For File Operations
cd C:/Users/jaked/OneDrive/Documents/Cline/MCP/file-operations-server
node src/index.js

# For API Integration
cd C:/Users/jaked/OneDrive/Documents/Cline/MCP/api-integration-server
pwsh -File start.ps1
```

Then send requests directly to the server using stdin.

## Common Issues and Solutions

### Connection Closed Error

This error typically occurs when:

1. The server starts successfully but then closes the connection
2. The VSCode extension is unable to maintain the connection
3. There's a timeout in the connection process

**Solutions:**
- Restart VSCode
- Check if any antivirus or firewall is blocking the connection
- Increase the timeout in the VSCode settings (if available)

### Not Connected Error

This error typically occurs when:

1. The VSCode extension is unable to establish a connection to the server
2. The server process is not running
3. There's a configuration issue

**Solutions:**
- Verify the server is running
- Check the server path in the MCP settings
- Restart VSCode

## Conclusion

MCP connection issues are often related to the VSCode extension rather than the servers themselves. By following the troubleshooting steps above, you should be able to resolve most connection issues. If problems persist, consider reporting the issue to the Claude extension developers.
