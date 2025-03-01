/**
 * Cognitive Tools API Utility
 *
 * This module provides a simplified interface for using the Cognitive Tools Integration.
 */

import { cognitiveTools } from './index';
import {
  Knowledge,
  KnowledgeType,
  KnowledgeMetadata,
  KnowledgeResult,
  SearchOptions,
  Pattern,
  PatternType,
  PatternMetadata,
  Memory,
  MemoryType,
  MemoryMetadata,
  MemoryOptions,
  DiagramType
} from './types';

/**
 * Initialize the Cognitive Tools
 * @param options Optional initialization options
 */
export async function initialize(options?: any): Promise<void> {
  return cognitiveTools.initialize(options);
}

/**
 * Knowledge API
 */
export const knowledge = {
  /**
   * Search for knowledge
   * @param query Search query
   * @param options Search options
   */
  search: async (query: string, options?: SearchOptions): Promise<KnowledgeResult[]> => {
    return cognitiveTools.searchKnowledge(query, options);
  },

  /**
   * Get knowledge by ID
   * @param id Knowledge ID
   */
  getById: async (id: string): Promise<Knowledge> => {
    return cognitiveTools.getKnowledgeById(id);
  },

  /**
   * Store knowledge
   * @param knowledge Knowledge to store
   */
  store: async (knowledge: Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return cognitiveTools.storeKnowledge(knowledge);
  },

  /**
   * Update knowledge
   * @param id Knowledge ID
   * @param updates Knowledge updates
   */
  update: async (id: string, updates: Partial<Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    return cognitiveTools.updateKnowledge(id, updates);
  },

  /**
   * Delete knowledge
   * @param id Knowledge ID
   */
  delete: async (id: string): Promise<void> => {
    return cognitiveTools.deleteKnowledge(id);
  }
};

/**
 * Memory API
 */
export const memory = {
  /**
   * Retrieve memories
   * @param query Search query
   * @param options Memory options
   */
  retrieve: async (query: string, options?: MemoryOptions): Promise<Memory[]> => {
    return cognitiveTools.retrieveMemories(query, options);
  },

  /**
   * Get memory by ID
   * @param id Memory ID
   */
  getById: async (id: string): Promise<Memory> => {
    return cognitiveTools.getMemoryById(id);
  },

  /**
   * Store memory
   * @param memory Memory to store
   */
  store: async (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return cognitiveTools.storeMemory(memory);
  },

  /**
   * Update memory
   * @param id Memory ID
   * @param updates Memory updates
   */
  update: async (id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    return cognitiveTools.updateMemory(id, updates);
  },

  /**
   * Delete memory
   * @param id Memory ID
   */
  delete: async (id: string): Promise<void> => {
    return cognitiveTools.deleteMemory(id);
  },

  /**
   * Update memory bank files with memory
   * @param memory Memory to update in memory bank files
   */
  updateMemoryBank: async (memory: Memory): Promise<string[]> => {
    return cognitiveTools.updateMemoryBank(memory);
  },

  /**
   * Sync all memories with memory bank files
   */
  syncMemoryBank: async (): Promise<string[]> => {
    return cognitiveTools.syncMemoryBank();
  }
};

/**
 * Pattern API
 */
export const pattern = {
  /**
   * Detect patterns in content
   * @param content Content to detect patterns in
   */
  detect: async (content: string): Promise<Pattern[]> => {
    return cognitiveTools.detectPatterns(content);
  },

  /**
   * Optimize content with patterns
   * @param content Content to optimize
   * @param patterns Patterns to apply (optional, will use detected patterns if not provided)
   */
  optimize: async (content: string, patterns?: Pattern[]): Promise<{ optimizedContent: string; appliedPatterns: Pattern[] }> => {
    return cognitiveTools.optimizeWithPatterns(content, patterns);
  },

  /**
   * Get pattern by ID
   * @param id Pattern ID
   */
  getById: async (id: string): Promise<Pattern> => {
    return cognitiveTools.getPatternById(id);
  },

  /**
   * Store pattern
   * @param pattern Pattern to store
   */
  store: async (pattern: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return cognitiveTools.storePattern(pattern);
  },

  /**
   * Update pattern
   * @param id Pattern ID
   * @param updates Pattern updates
   */
  update: async (id: string, updates: Partial<Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    return cognitiveTools.updatePattern(id, updates);
  },

  /**
   * Delete pattern
   * @param id Pattern ID
   */
  delete: async (id: string): Promise<void> => {
    return cognitiveTools.deletePattern(id);
  },

  /**
   * Search patterns
   * @param query Search query
   * @param type Pattern type filter (optional)
   * @param tags Tags filter (optional)
   * @param limit Result limit (optional)
   */
  search: async (query: string, type?: PatternType, tags?: string[], limit?: number): Promise<Pattern[]> => {
    return cognitiveTools.searchPatterns(query, type, tags, limit);
  }
};

/**
 * Visualization API
 */
export const visualization = {
  /**
   * Generate a Mermaid diagram
   * @param type Diagram type
   * @param content Diagram content
   */
  generateMermaidDiagram: (type: DiagramType, content: string): string => {
    return cognitiveTools.generateMermaidDiagram(type, content);
  },

  /**
   * Generate a knowledge graph visualization
   * @param knowledgeIds Array of knowledge IDs to include in the graph
   * @param depth Depth of relationships to include (default: 1)
   */
  generateKnowledgeGraph: (knowledgeIds: string[], depth?: number): string => {
    return cognitiveTools.generateKnowledgeGraph(knowledgeIds, depth);
  },

  /**
   * Generate a pattern relationship visualization
   * @param patternIds Array of pattern IDs to include in the visualization
   */
  generatePatternRelationships: (patternIds: string[]): string => {
    return cognitiveTools.generatePatternRelationships(patternIds);
  },

  /**
   * Generate a memory timeline visualization
   * @param memoryIds Array of memory IDs to include in the timeline
   */
  generateMemoryTimeline: (memoryIds: string[]): string => {
    return cognitiveTools.generateMemoryTimeline(memoryIds);
  },

  /**
   * Generate a memory bank structure visualization
   */
  generateMemoryBankStructure: (): string => {
    return cognitiveTools.generateMemoryBankStructure();
  }
};

/**
 * Utility API
 */
export const utils = {
  /**
   * Get logger instance
   */
  getLogger: () => cognitiveTools.getLogger(),

  /**
   * Get current configuration
   */
  getConfig: () => cognitiveTools.getConfig(),

  /**
   * Update configuration
   * @param newConfig Partial configuration to merge with current config
   */
  updateConfig: (newConfig: any) => cognitiveTools.updateConfig(newConfig),

  /**
   * Reset configuration to defaults
   */
  resetConfig: () => cognitiveTools.reset()
};

/**
 * Default export for the entire API
 */
export default {
  initialize,
  knowledge,
  memory,
  pattern,
  visualization,
  utils
};
