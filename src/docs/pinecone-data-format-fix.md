# Pinecone Data Format Fix

## Overview

This document details the resolution of the Pinecone data format issue that was preventing the knowledge-system MCP server from storing memories in the Pinecone vector database.

## Issue Description

The knowledge-system server was encountering an error when attempting to store memories in Pinecone:

```
Error storing memory: The argument to upsert had type errors: argument must be array.
```

This error occurred because the Pinecone API expected the data to be formatted as an array, but our implementation was providing it as an object with a `vectors` property containing an array.

## Investigation Process

1. **Diagnostic Tools**: We created several diagnostic tools to investigate the issue:
   - `mcp-direct-access.js`: A utility for direct server communication
   - `mcp-connection-test.js`: A script for comprehensive connection testing
   - `mcp-connection-monitor.js`: A script for monitoring server communication

2. **Root Cause Analysis**: Through our diagnostic tools, we identified that the issue was in the `storeMemory` method of the knowledge-system server. The method was formatting the data as:

   ```javascript
   await this.index.upsert({
     vectors: [{
       id,
       values: embedding,
       metadata: {
         ...metadata,
         text,
         timestamp: new Date().toISOString(),
       },
     }],
   });
   ```

   But Pinecone expected the data to be formatted as:

   ```javascript
   await this.index.upsert([{
     id,
     values: embedding,
     metadata: {
       ...metadata,
       text,
       timestamp: new Date().toISOString(),
     },
   }]);
   ```

## Solution Implementation

1. **Enhanced Server Version**: We created an enhanced version of the knowledge-system server (`index-enhanced.js`) with the following changes:
   - Modified the `storeMemory` method to format the data as an array
   - Added detailed logging to track the data flow
   - Included clear version indicators in the logs

2. **MCP Settings Update**: We updated the MCP settings to use the enhanced version of the server:
   ```json
   "knowledge-system": {
     "command": "node",
     "args": [
       "C:/Users/jaked/OneDrive/Documents/Cline/MCP/knowledge-system/src/index-enhanced.js"
     ],
     "env": {
       "PINECONE_API_KEY": "...",
       "PINECONE_ENVIRONMENT": "us-west1-gcp",
       "PINECONE_INDEX_NAME": "cline-memory",
       "OPENAI_API_KEY": "..."
     },
     "disabled": false,
     "autoApprove": [
       "store_memory",
       "query_memories",
       "list_tools"
     ]
   }
   ```

3. **Testing**: We created a test script (`test-enhanced-server.js`) to verify the fix:
   - The script starts the enhanced server
   - Lists available tools
   - Tests storing a memory
   - Tests querying memories

## Results

The enhanced version of the server successfully stores memories in Pinecone. The logs show:

```
[knowledge-system] ENHANCED VERSION: Using fixed Pinecone data format
[knowledge-system] ENHANCED VERSION: Preparing data for Pinecone upsert
[knowledge-system] ENHANCED VERSION: Data prepared: {"id":"mem_1740561670108","metadata":{"category":"test","tags":["fixed-format","pinecone-array"],"timestamp":"2025-02-26T09:21:09.867Z"}}
[knowledge-system] ENHANCED VERSION: Upsert completed successfully
[knowledge-system] {"content":[{"type":"text","text":"Memory stored successfully with ID: mem_1740561670108"}]}
```

## Lessons Learned

1. **API Changes**: The Pinecone API may have changed its expected data format, requiring us to update our implementation.
2. **Diagnostic Approach**: The direct access approach proved valuable for diagnosing and fixing issues with MCP servers.
3. **Enhanced Logging**: Detailed logging was crucial for identifying and resolving the issue.

## Next Steps

1. **VSCode Extension Integration**: Implement the direct access approach in the VSCode extension to provide a more reliable connection method.
2. **Monitoring**: Add monitoring to detect and alert on similar issues in the future.
3. **Documentation**: Update the knowledge-system documentation to reflect the new data format requirements.

## References

- [MCP Diagnostic Results](mcp-diagnostic-results.md)
- [Knowledge System Integration](knowledge-system-integration.md)
- [MCP Connection Troubleshooting](mcp-connection-troubleshooting.md)
