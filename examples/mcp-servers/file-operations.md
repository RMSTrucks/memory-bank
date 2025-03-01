# MCP Server: File Operations

## Overview
The File Operations MCP server provides tools and resources for managing file system operations in a safe and controlled manner. It enables reading, writing, searching, and validating files while maintaining proper access controls and error handling.

## Tools Provided

### read_file
```typescript
interface ToolSchema {
    name: 'read_file',
    description: 'Read the contents of a file at the specified path',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path to the file to read'
            }
        },
        required: ['path']
    }
}
```

#### Usage Example
```typescript
const result = await mcpServer.callTool('read_file', {
    path: 'src/config.json'
});
```

#### Response Format
```typescript
interface ToolResponse {
    content: Array<{
        type: 'text',
        text: string
    }>;
    isError?: boolean;
}
```

### write_to_file
```typescript
interface ToolSchema {
    name: 'write_to_file',
    description: 'Write content to a file at the specified path',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path where to write the file'
            },
            content: {
                type: 'string',
                description: 'Content to write to the file'
            }
        },
        required: ['path', 'content']
    }
}
```

## Resources Provided

### Directory Contents
```typescript
interface ResourceSchema {
    uri: 'file://directory/*',
    name: 'Directory Contents',
    description: 'List of files in a directory',
    mimeType: 'application/json'
}
```

#### Access Pattern
```typescript
const resource = await mcpServer.accessResource('file://src/components/*');
```

### File Status
```typescript
interface ResourceSchema {
    uri: 'file://status/{path}',
    name: 'File Status',
    description: 'Status and metadata for a file',
    mimeType: 'application/json'
}
```

## Server Configuration

### Environment Variables
```env
FILE_OPS_ROOT_DIR=/path/to/root
FILE_OPS_MAX_SIZE=10485760
FILE_OPS_ALLOWED_EXT=.txt,.md,.json
LOG_LEVEL=info
```

### Runtime Configuration
```typescript
interface ServerConfig {
    name: 'file-operations',
    version: '1.0.0',
    capabilities: {
        tools: true,
        resources: true
    },
    settings: {
        rootDir: string;
        maxFileSize: number;
        allowedExtensions: string[];
    }
}
```

## Communication Protocol

### Request Format
```typescript
interface McpRequest {
    type: 'list_tools' | 'call_tool' | 'list_resources' | 'read_resource';
    name?: string;
    arguments?: {
        path?: string;
        content?: string;
        [key: string]: any;
    };
}
```

### Response Format
```typescript
interface McpResponse {
    content: Array<{
        type: 'text' | 'json' | 'binary';
        text?: string;
        data?: Buffer;
    }>;
    isError?: boolean;
}
```

## Error Handling

### Common Errors
| Error Code | Description | Handling Strategy |
|------------|-------------|------------------|
| INVALID_PATH | Invalid file path | Validate path format |
| FILE_NOT_FOUND | File doesn't exist | Check existence first |
| ACCESS_DENIED | Permission error | Verify permissions |
| SIZE_EXCEEDED | File too large | Check size before operation |

### Error Recovery
```typescript
try {
    await mcpServer.handleRequest(request);
} catch (error) {
    if (error instanceof McpError) {
        // Handle MCP-specific error
        logError(error);
        return createErrorResponse(error);
    } else {
        // Handle general error
        throw new McpError(ErrorCode.InternalError, error.message);
    }
}
```

## Performance

### Optimization
- File caching for frequently accessed files
- Stream large files in chunks
- Batch operations when possible
- Asynchronous processing

### Limits
- Maximum file size: 10MB
- Rate limit: 100 requests/minute
- Concurrent operations: 10
- Directory depth: 10 levels

## Security

### Authentication
- Method: API Key
- Key rotation: Every 30 days
- Key storage: Environment variables
- Access logging enabled

### Authorization
- Path restrictions
- File type limitations
- Size restrictions
- Operation quotas

## Monitoring

### Health Checks
```typescript
interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    details: {
        diskSpace: {
            total: number;
            used: number;
            available: number;
        };
        operations: {
            total: number;
            failed: number;
            pending: number;
        };
        uptime: number;
    };
}
```

### Metrics
- Operation latency
- Error rates
- Disk usage
- Request volume

## Development

### Local Setup
1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment:
   ```bash
   cp .env.example .env
   ```
4. Start server:
   ```bash
   npm start
   ```

### Testing
```typescript
describe('File Operations Server', () => {
    it('should handle file reading', async () => {
        const result = await server.callTool('read_file', {
            path: 'test.txt'
        });
        expect(result.content[0].text).toBeDefined();
    });

    it('should manage resources', async () => {
        const listing = await server.accessResource('file://test/*');
        expect(listing.content).toBeInstanceOf(Array);
    });
});
```

## Deployment

### Requirements
- Node.js 18+
- 1GB RAM minimum
- 10GB disk space
- Network access

### Steps
1. Build project:
   ```bash
   npm run build
   ```
2. Configure environment
3. Start server:
   ```bash
   node dist/index.js
   ```
4. Verify health check

## Maintenance

### Updates
- Version management
- Dependency updates
- Security patches
- Performance tuning

### Troubleshooting
- Check logs
- Verify permissions
- Monitor disk space
- Test file access

## Integration

### Client Setup
```typescript
const client = new McpClient({
    serverName: 'file-operations',
    timeout: 5000,
    retries: 3
});
```

### Usage Examples
```typescript
// Read a file
const content = await client.callTool('read_file', {
    path: 'config.json'
});

// List directory
const files = await client.accessResource('file://src/*');
```

## Notes
- All paths are relative to root directory
- Binary files are handled as base64
- Operations are atomic when possible
- Backup system recommended
