/**
 * Type declarations for mcp-direct-access.js
 */

declare module '../utils/mcp-direct-access' {
  /**
   * Start an MCP server
   * @param serverName - The name of the server to start
   * @param enhanced - Whether to use the enhanced version of the server
   * @returns The server process
   */
  export function startServer(serverName: string, enhanced?: boolean): any;

  /**
   * Send a request to an MCP server
   * @param serverProcess - The server process
   * @param request - The request to send
   * @returns The response from the server
   */
  export function sendRequest(serverProcess: any, request: any): Promise<any>;

  /**
   * List available tools for a server
   * @param serverProcess - The server process
   * @returns The list of available tools
   */
  export function listTools(serverProcess: any): Promise<any>;

  /**
   * Call a tool on a server
   * @param serverProcess - The server process
   * @param toolName - The name of the tool to call
   * @param arguments - The arguments to pass to the tool
   * @returns The result of the tool call
   */
  export function callTool(serverProcess: any, toolName: string, arguments: any): Promise<any>;

  /**
   * Store a memory in the knowledge system
   * @param serverProcess - The knowledge system server process
   * @param text - The text content to store
   * @param metadata - Additional metadata to store with the memory
   * @returns The result of storing the memory
   */
  export function storeMemory(serverProcess: any, text: string, metadata?: any): Promise<any>;

  /**
   * Query memories from the knowledge system
   * @param serverProcess - The knowledge system server process
   * @param query - The query text to search for similar memories
   * @param limit - Maximum number of results to return
   * @returns The query results
   */
  export function queryMemories(serverProcess: any, query: string, limit?: number): Promise<any>;

  /**
   * Read a file using the file operations server
   * @param serverProcess - The file operations server process
   * @param path - The path of the file to read
   * @returns The file contents
   */
  export function readFile(serverProcess: any, path: string): Promise<any>;

  /**
   * Write to a file using the file operations server
   * @param serverProcess - The file operations server process
   * @param path - The path of the file to write to
   * @param content - The content to write to the file
   * @returns The result of writing the file
   */
  export function writeFile(serverProcess: any, path: string, content: string): Promise<any>;
}
