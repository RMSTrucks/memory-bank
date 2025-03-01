/**
 * Visualization Manager for the Cognitive Tools Integration
 *
 * Responsible for generating visualizations of knowledge, patterns, and memories.
 */

import { config } from '../config';
import { logger } from '../utils/logger';
import {
  DiagramType,
  ErrorCode,
  CognitiveToolsError
} from '../types';

/**
 * Visualization Manager class
 */
export class VisualizationManager {
  private static instance: VisualizationManager;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get VisualizationManager instance (singleton)
   */
  public static getInstance(): VisualizationManager {
    if (!VisualizationManager.instance) {
      VisualizationManager.instance = new VisualizationManager();
    }
    return VisualizationManager.instance;
  }

  /**
   * Generate a Mermaid diagram
   * @param type Diagram type
   * @param content Diagram content
   */
  public generateMermaidDiagram(type: DiagramType, content: string): string {
    try {
      logger.info(`Generating ${type} diagram`);

      // Validate diagram size
      if (content.length > config.visualization.maxDiagramSize) {
        throw new CognitiveToolsError(
          ErrorCode.VALIDATION_ERROR,
          `Diagram content exceeds maximum size of ${config.visualization.maxDiagramSize} characters`
        );
      }

      // Generate Mermaid diagram
      return this.formatMermaidDiagram(type, content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate Mermaid diagram: ${message}`, { error, type, content });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to generate Mermaid diagram: ${message}`
      );
    }
  }

  /**
   * Generate a knowledge graph visualization
   * @param knowledgeIds Array of knowledge IDs to include in the graph
   * @param depth Depth of relationships to include (default: 1)
   */
  public generateKnowledgeGraph(knowledgeIds: string[], depth: number = 1): string {
    try {
      logger.info(`Generating knowledge graph for ${knowledgeIds.length} knowledge items with depth ${depth}`);

      // Mock implementation - in a real implementation, this would fetch knowledge items and their relationships
      const mockNodes = knowledgeIds.map((id, index) => `    ${id}[Knowledge ${index + 1}]`);
      const mockEdges = [];

      // Generate some mock edges between nodes
      for (let i = 0; i < knowledgeIds.length - 1; i++) {
        mockEdges.push(`    ${knowledgeIds[i]} --> ${knowledgeIds[i + 1]}`);
      }

      // Create a mock circular reference for demonstration
      if (knowledgeIds.length > 2) {
        mockEdges.push(`    ${knowledgeIds[knowledgeIds.length - 1]} --> ${knowledgeIds[0]}`);
      }

      // Generate Mermaid graph diagram
      const content = [
        'graph TD',
        ...mockNodes,
        ...mockEdges
      ].join('\n');

      return this.formatMermaidDiagram(DiagramType.FLOWCHART, content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate knowledge graph: ${message}`, { error, knowledgeIds, depth });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to generate knowledge graph: ${message}`
      );
    }
  }

  /**
   * Generate a pattern relationship visualization
   * @param patternIds Array of pattern IDs to include in the visualization
   */
  public generatePatternRelationships(patternIds: string[]): string {
    try {
      logger.info(`Generating pattern relationships for ${patternIds.length} patterns`);

      // Mock implementation - in a real implementation, this would fetch patterns and their relationships
      const mockNodes = patternIds.map((id, index) => `    ${id}[Pattern ${index + 1}]`);
      const mockEdges = [];

      // Generate some mock edges between nodes
      for (let i = 0; i < patternIds.length - 1; i++) {
        if (i % 2 === 0) {
          mockEdges.push(`    ${patternIds[i]} --> |extends| ${patternIds[i + 1]}`);
        } else {
          mockEdges.push(`    ${patternIds[i]} --> |uses| ${patternIds[i + 1]}`);
        }
      }

      // Create a mock circular reference for demonstration
      if (patternIds.length > 2) {
        mockEdges.push(`    ${patternIds[patternIds.length - 1]} --> |related to| ${patternIds[0]}`);
      }

      // Generate Mermaid graph diagram
      const content = [
        'graph TD',
        ...mockNodes,
        ...mockEdges
      ].join('\n');

      return this.formatMermaidDiagram(DiagramType.FLOWCHART, content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate pattern relationships: ${message}`, { error, patternIds });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to generate pattern relationships: ${message}`
      );
    }
  }

  /**
   * Generate a memory timeline visualization
   * @param memoryIds Array of memory IDs to include in the timeline
   */
  public generateMemoryTimeline(memoryIds: string[]): string {
    try {
      logger.info(`Generating memory timeline for ${memoryIds.length} memories`);

      // Mock implementation - in a real implementation, this would fetch memories and their timestamps
      const mockSections = [];

      // Generate mock timeline sections
      mockSections.push('section Recent');
      for (let i = 0; i < Math.min(3, memoryIds.length); i++) {
        mockSections.push(`    Memory ${i + 1} : ${memoryIds[i]}`);
      }

      if (memoryIds.length > 3) {
        mockSections.push('section Earlier');
        for (let i = 3; i < Math.min(6, memoryIds.length); i++) {
          mockSections.push(`    Memory ${i + 1} : ${memoryIds[i]}`);
        }
      }

      if (memoryIds.length > 6) {
        mockSections.push('section Oldest');
        for (let i = 6; i < memoryIds.length; i++) {
          mockSections.push(`    Memory ${i + 1} : ${memoryIds[i]}`);
        }
      }

      // Generate Mermaid gantt diagram
      const content = [
        'gantt',
        '    title Memory Timeline',
        '    dateFormat  YYYY-MM-DD',
        '    axisFormat %m/%d',
        ...mockSections
      ].join('\n');

      return this.formatMermaidDiagram(DiagramType.GANTT, content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate memory timeline: ${message}`, { error, memoryIds });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to generate memory timeline: ${message}`
      );
    }
  }

  /**
   * Generate a memory bank structure visualization
   */
  public generateMemoryBankStructure(): string {
    try {
      logger.info('Generating memory bank structure visualization');

      // Generate Mermaid graph diagram for memory bank structure
      const content = [
        'graph TD',
        '    PB[projectbrief.md] --> PC[productContext.md]',
        '    PB --> SP[systemPatterns.md]',
        '    PB --> TC[techContext.md]',
        '    PC --> AC[activeContext.md]',
        '    SP --> AC',
        '    TC --> AC',
        '    AC --> P[progress.md]',
        '    style PB fill:#f9f,stroke:#333,stroke-width:2px',
        '    style PC fill:#bbf,stroke:#333,stroke-width:1px',
        '    style SP fill:#bbf,stroke:#333,stroke-width:1px',
        '    style TC fill:#bbf,stroke:#333,stroke-width:1px',
        '    style AC fill:#bfb,stroke:#333,stroke-width:1px',
        '    style P fill:#bfb,stroke:#333,stroke-width:1px'
      ].join('\n');

      return this.formatMermaidDiagram(DiagramType.FLOWCHART, content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to generate memory bank structure: ${message}`, { error });

      if (error instanceof CognitiveToolsError) {
        throw error;
      }

      throw new CognitiveToolsError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to generate memory bank structure: ${message}`
      );
    }
  }

  /**
   * Format a Mermaid diagram
   * @param type Diagram type
   * @param content Diagram content
   */
  private formatMermaidDiagram(type: DiagramType, content: string): string {
    // Add Mermaid code block markers
    return '```mermaid\n' + content + '\n```';
  }
}

/**
 * Export a default instance
 */
export const visualizationManager = VisualizationManager.getInstance();
