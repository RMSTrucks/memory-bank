/**
 * Knowledge Manager for the Cognitive Tools Integration
 *
 * Responsible for interacting with the Knowledge System MCP to store and retrieve knowledge.
 */

// Mock implementation of MCP tool for development
// In a real implementation, this would be imported from '@modelcontextprotocol/sdk/client'
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
    case 'searchKnowledge':
      return {
        success: true,
        results: []
      };
    case 'getKnowledgeById':
      return {
        success: true,
        knowledge: {
          id: options.arguments.id,
          content: 'Mock knowledge content',
          type: 'concept',
          metadata: {
            title: 'Mock Knowledge',
            description: 'This is mock knowledge for development',
            tags: ['mock', 'development'],
            importance: 'medium'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    case 'storeKnowledge':
      return {
        success: true,
        id: `mock-${Date.now()}`,
        knowledge: {
          id: `mock-${Date.now()}`,
          ...options.arguments.knowledge,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    case 'updateKnowledge':
      return {
        success: true,
        knowledge: {
          id: options.arguments.id,
          content: options.arguments.updates.content || 'Updated mock content',
          type: options.arguments.updates.type || 'concept',
          metadata: options.arguments.updates.metadata || {
            title: 'Updated Mock Knowledge',
            description: 'This is updated mock knowledge',
            tags: ['mock', 'updated'],
            importance: 'medium'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    case 'deleteKnowledge':
      return {
        success: true
      };
    default:
      return {
        success: false,
        error: `Unknown tool: ${options.tool_name}`
      };
  }
}
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  Knowledge,
  KnowledgeType,
  KnowledgeMetadata,
  KnowledgeResult,
  SearchOptions,
  ErrorCode,
  CognitiveToolsError
} from '../types';

/**
 * Knowledge Manager class
 */
export class KnowledgeManager {
  private static instance: KnowledgeManager;
  private cache: Map<string, { knowledge: Knowledge, timestamp: number }> = new Map();

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get KnowledgeManager instance (singleton)
   */
  public static getInstance(): KnowledgeManager {
    if (!KnowledgeManager.instance) {
      KnowledgeManager.instance = new KnowledgeManager();
    }
    return KnowledgeManager.instance;
  }

  /**
   * Search for knowledge
   * @param query Search query
   * @param options Search options
   */
  public async searchKnowledge(query: string, options?: SearchOptions): Promise<KnowledgeResult[]> {
    try {
      logger.info(`Searching knowledge with query: ${query}`, { options });

      const searchOptions = {
        query,
        limit: options?.limit || config.knowledge.defaultSearchLimit,
        types: options?.types,
        importance: options?.importance,
        tags: options?.tags,
        fromDate: options?.fromDate,
        toDate: options?.toDate
      };

      const response = await use_mcp_tool({
        server_name: config.knowledge.knowledgeSystemMcp,
        tool_name: 'searchKnowledge',
        arguments: searchOptions
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Knowledge search failed: ${response.error || 'Unknown error'}`
        );
      }

      // Update cache with results
      if (config.knowledge.cacheEnabled && response.results) {
        for (const result of response.results) {
          this.updateCache(result.knowledge);
        }
      }

      return response.results || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to search knowledge: ${message}`, { error, query, options });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Knowledge search failed: ${message}`
      );
    }
  }

  /**
   * Get knowledge by ID
   * @param id Knowledge ID
   */
  public async getKnowledgeById(id: string): Promise<Knowledge> {
    try {
      logger.info(`Getting knowledge by ID: ${id}`);

      // Check cache first if enabled
      if (config.knowledge.cacheEnabled) {
        const cached = this.cache.get(id);
        if (cached && Date.now() - cached.timestamp < config.knowledge.cacheTtl) {
          logger.debug(`Cache hit for knowledge ID: ${id}`);
          return cached.knowledge;
        }
      }

      const response = await use_mcp_tool({
        server_name: config.knowledge.knowledgeSystemMcp,
        tool_name: 'getKnowledgeById',
        arguments: { id }
      });

      if (!response.success || !response.knowledge) {
        throw new CognitiveToolsError(
          ErrorCode.NOT_FOUND,
          `Knowledge not found with ID: ${id}`
        );
      }

      // Update cache
      if (config.knowledge.cacheEnabled) {
        this.updateCache(response.knowledge);
      }

      return response.knowledge;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to get knowledge by ID: ${message}`, { error, id });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to get knowledge by ID: ${message}`
      );
    }
  }

  /**
   * Store knowledge
   * @param knowledge Knowledge to store
   */
  public async storeKnowledge(knowledge: Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      logger.info('Storing knowledge', { knowledge });

      const response = await use_mcp_tool({
        server_name: config.knowledge.knowledgeSystemMcp,
        tool_name: 'storeKnowledge',
        arguments: { knowledge }
      });

      if (!response.success || !response.id) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to store knowledge: ${response.error || 'Unknown error'}`
        );
      }

      // Update cache with the stored knowledge if it was returned
      if (config.knowledge.cacheEnabled && response.knowledge) {
        this.updateCache(response.knowledge);
      }

      return response.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to store knowledge: ${message}`, { error, knowledge });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to store knowledge: ${message}`
      );
    }
  }

  /**
   * Update knowledge
   * @param id Knowledge ID
   * @param updates Knowledge updates
   */
  public async updateKnowledge(id: string, updates: Partial<Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      logger.info(`Updating knowledge with ID: ${id}`, { updates });

      const response = await use_mcp_tool({
        server_name: config.knowledge.knowledgeSystemMcp,
        tool_name: 'updateKnowledge',
        arguments: { id, updates }
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to update knowledge: ${response.error || 'Unknown error'}`
        );
      }

      // Update cache with the updated knowledge if it was returned
      if (config.knowledge.cacheEnabled && response.knowledge) {
        this.updateCache(response.knowledge);
      } else if (config.knowledge.cacheEnabled) {
        // Remove from cache if not returned
        this.cache.delete(id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to update knowledge: ${message}`, { error, id, updates });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to update knowledge: ${message}`
      );
    }
  }

  /**
   * Delete knowledge
   * @param id Knowledge ID
   */
  public async deleteKnowledge(id: string): Promise<void> {
    try {
      logger.info(`Deleting knowledge with ID: ${id}`);

      const response = await use_mcp_tool({
        server_name: config.knowledge.knowledgeSystemMcp,
        tool_name: 'deleteKnowledge',
        arguments: { id }
      });

      if (!response.success) {
        throw new CognitiveToolsError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Failed to delete knowledge: ${response.error || 'Unknown error'}`
        );
      }

      // Remove from cache
      if (config.knowledge.cacheEnabled) {
        this.cache.delete(id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to delete knowledge: ${message}`, { error, id });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `Failed to delete knowledge: ${message}`
      );
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    logger.info('Clearing knowledge cache');
    this.cache.clear();
  }

  /**
   * Update cache with knowledge
   * @param knowledge Knowledge to cache
   */
  private updateCache(knowledge: Knowledge): void {
    this.cache.set(knowledge.id, {
      knowledge,
      timestamp: Date.now()
    });

    // Trim cache if it gets too large
    if (this.cache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      for (let i = 0; i < entries.length - 1000; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }
}

/**
 * Export a default instance
 */
export const knowledgeManager = KnowledgeManager.getInstance();
