/**
 * Pattern Manager for the Cognitive Tools Integration
 *
 * Responsible for detecting, optimizing, and managing patterns.
 */

import { config } from '../config';
import { logger } from '../utils/logger';
import {
  Pattern,
  PatternType,
  PatternMetadata,
  ErrorCode,
  CognitiveToolsError
} from '../types';

// Mock implementation of MCP tool for development
interface McpToolOptions {
  server_name: string;
  tool_name: string;
  arguments: any;
}

// Mock implementation of use_mcp_tool
async function use_mcp_tool(options: McpToolOptions): Promise<any> {
  // In a real implementation, this would call the actual MCP tool
  // For now, we'll just log the call and return a mock response
  console.log(`[MCP] Called ${options.tool_name} on ${options.server_name}`, options.arguments);

  // Return mock responses based on the tool name
  switch (options.tool_name) {
    case 'detectPatterns':
      return {
        success: true,
        patterns: [
          {
            id: `mock-pattern-${Date.now()}`,
            name: 'Mock Pattern',
            description: 'This is a mock pattern detected in the content',
            type: 'semantic',
            content: options.arguments.content.substring(0, 50) + '...',
            examples: [options.arguments.content.substring(0, 30) + '...'],
            metadata: {
              effectiveness: 0.85,
              confidence: 0.92,
              usageCount: 1,
              tags: ['mock', 'detected']
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      };
    case 'optimizeWithPatterns':
      return {
        success: true,
        optimizedContent: options.arguments.content,
        appliedPatterns: options.arguments.patterns || []
      };
    case 'getPatternById':
      return {
        success: true,
        pattern: {
          id: options.arguments.id,
          name: 'Mock Pattern',
          description: 'This is a mock pattern',
          type: 'semantic',
          content: 'Mock pattern content',
          examples: ['Example 1', 'Example 2'],
          metadata: {
            effectiveness: 0.85,
            confidence: 0.92,
            usageCount: 5,
            tags: ['mock', 'development']
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    case 'storePattern':
      return {
        success: true,
        id: `mock-pattern-${Date.now()}`,
        pattern: {
          id: `mock-pattern-${Date.now()}`,
          ...options.arguments.pattern,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    case 'updatePattern':
      return {
        success: true,
        pattern: {
          id: options.arguments.id,
          name: options.arguments.updates.name || 'Updated Mock Pattern',
          description: options.arguments.updates.description || 'This is an updated mock pattern',
          type: options.arguments.updates.type || 'semantic',
          content: options.arguments.updates.content || 'Updated mock pattern content',
          examples: options.arguments.updates.examples || ['Updated Example 1', 'Updated Example 2'],
          metadata: options.arguments.updates.metadata || {
            effectiveness: 0.9,
            confidence: 0.95,
            usageCount: 10,
            tags: ['mock', 'updated']
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    case 'deletePattern':
      return {
        success: true
      };
    case 'searchPatterns':
      return {
        success: true,
        patterns: []
      };
    default:
      return {
        success: false,
        error: `Unknown tool: ${options.tool_name}`
      };
  }
}

/**
 * Pattern Manager class
 */
export class PatternManager {
  private static instance: PatternManager;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get PatternManager instance (singleton)
   */
  public static getInstance(): PatternManager {
    if (!PatternManager.instance) {
      PatternManager.instance = new PatternManager();
    }
    return PatternManager.instance;
  }

  /**
   * Detect patterns in content
   * @param content Content to detect patterns in
   */
  public async detectPatterns(content: string): Promise<Pattern[]> {
    try {
      logger.info('Detecting patterns in content');

      if (!config.pattern.patternSystemEnabled) {
        logger.warn('Pattern system is disabled');
        return [];
      }

      const response = await use_mcp_tool({
        server_name: 'pattern-system',
        tool_name: 'detectPatterns',
        arguments: { content }
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Pattern detection failed: ${response.error || 'Unknown error'}`
        );
      }

      return response.patterns || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to detect patterns: ${message}`, { error });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Pattern detection failed: ${message}`
      );
    }
  }

  /**
   * Optimize content with patterns
   * @param content Content to optimize
   * @param patterns Patterns to apply (optional, will use detected patterns if not provided)
   */
  public async optimizeWithPatterns(content: string, patterns?: Pattern[]): Promise<{ optimizedContent: string; appliedPatterns: Pattern[] }> {
    try {
      logger.info('Optimizing content with patterns');

      if (!config.pattern.patternSystemEnabled || !config.pattern.optimizationEnabled) {
        logger.warn('Pattern optimization is disabled');
        return { optimizedContent: content, appliedPatterns: [] };
      }

      // If patterns are not provided, detect them first
      const patternsToApply = patterns || await this.detectPatterns(content);

      // Filter patterns by confidence threshold
      const filteredPatterns = patternsToApply.filter(
        pattern => pattern.metadata.confidence >= config.pattern.defaultConfidenceThreshold
      );

      if (filteredPatterns.length === 0) {
        logger.info('No patterns meet the confidence threshold for optimization');
        return { optimizedContent: content, appliedPatterns: [] };
      }

      const response = await use_mcp_tool({
        server_name: 'pattern-system',
        tool_name: 'optimizeWithPatterns',
        arguments: { content, patterns: filteredPatterns }
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Pattern optimization failed: ${response.error || 'Unknown error'}`
        );
      }

      return {
        optimizedContent: response.optimizedContent || content,
        appliedPatterns: response.appliedPatterns || []
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to optimize with patterns: ${message}`, { error });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Pattern optimization failed: ${message}`
      );
    }
  }

  /**
   * Get pattern by ID
   * @param id Pattern ID
   */
  public async getPatternById(id: string): Promise<Pattern> {
    try {
      logger.info(`Getting pattern by ID: ${id}`);

      const response = await use_mcp_tool({
        server_name: 'pattern-system',
        tool_name: 'getPatternById',
        arguments: { id }
      });

      if (!response.success || !response.pattern) {
        throw new CognitiveToolsError(
          ErrorCode.NOT_FOUND,
          `Pattern not found with ID: ${id}`
        );
      }

      return response.pattern;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to get pattern by ID: ${message}`, { error, id });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to get pattern by ID: ${message}`
      );
    }
  }

  /**
   * Store pattern
   * @param pattern Pattern to store
   */
  public async storePattern(pattern: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      logger.info('Storing pattern', { pattern });

      const response = await use_mcp_tool({
        server_name: 'pattern-system',
        tool_name: 'storePattern',
        arguments: { pattern }
      });

      if (!response.success || !response.id) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to store pattern: ${response.error || 'Unknown error'}`
        );
      }

      return response.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to store pattern: ${message}`, { error, pattern });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to store pattern: ${message}`
      );
    }
  }

  /**
   * Update pattern
   * @param id Pattern ID
   * @param updates Pattern updates
   */
  public async updatePattern(id: string, updates: Partial<Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      logger.info(`Updating pattern with ID: ${id}`, { updates });

      const response = await use_mcp_tool({
        server_name: 'pattern-system',
        tool_name: 'updatePattern',
        arguments: { id, updates }
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to update pattern: ${response.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update pattern: ${message}`, { error, id, updates });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to update pattern: ${message}`
      );
    }
  }

  /**
   * Delete pattern
   * @param id Pattern ID
   */
  public async deletePattern(id: string): Promise<void> {
    try {
      logger.info(`Deleting pattern with ID: ${id}`);

      const response = await use_mcp_tool({
        server_name: 'pattern-system',
        tool_name: 'deletePattern',
        arguments: { id }
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to delete pattern: ${response.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to delete pattern: ${message}`, { error, id });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to delete pattern: ${message}`
      );
    }
  }

  /**
   * Search patterns
   * @param query Search query
   * @param type Pattern type filter (optional)
   * @param tags Tags filter (optional)
   * @param limit Result limit (optional)
   */
  public async searchPatterns(query: string, type?: PatternType, tags?: string[], limit?: number): Promise<Pattern[]> {
    try {
      logger.info(`Searching patterns with query: ${query}`, { type, tags, limit });

      const response = await use_mcp_tool({
        server_name: 'pattern-system',
        tool_name: 'searchPatterns',
        arguments: { query, type, tags, limit }
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Pattern search failed: ${response.error || 'Unknown error'}`
        );
      }

      return response.patterns || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to search patterns: ${message}`, { error, query, type, tags, limit });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Pattern search failed: ${message}`
      );
    }
  }
}

/**
 * Export a default instance
 */
export const patternManager = PatternManager.getInstance();
