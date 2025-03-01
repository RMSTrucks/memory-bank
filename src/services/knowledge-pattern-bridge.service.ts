/**
 * Knowledge-Pattern Bridge Service
 *
 * This service connects the Pattern System with the Knowledge System,
 * enabling self-improvement capabilities through pattern storage,
 * retrieval, and feedback loops. It serves as a cognitive tool to enhance
 * my capabilities as Cline, providing bidirectional communication between
 * the Knowledge System and Pattern System.
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { Cache } from '../utils/cache';
import { EventBus } from './event-bus.service';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingService } from './embedding.service';
import { PatternSystem } from './pattern-system';
import { Pattern } from '../types/patterns';
// Import with type assertion to handle JavaScript module
// @ts-ignore
import * as mcpDirectAccess from '../utils/mcp-direct-access';
import {
  PatternKnowledge,
  PatternMetadata,
  PatternCategory,
  PatternSource,
  PatternContext,
  ComputationContext,
  KnowledgePatternQuery,
  PatternExecutionResult,
  PatternEffectivenessMetrics,
  KnowledgePatternEventType
} from '../types/knowledge-pattern-integration';
import { ComputationGraph } from '../neural/types/computation';
import { Vector } from '../types/vector-knowledge';
import { ExtendedVectorMetadata } from '../types/extended-vector-knowledge';

/**
 * Service for bridging between Pattern System and Knowledge System
 *
 * This service provides bidirectional communication between the Knowledge System
 * and Pattern System, enabling cognitive tool integration for my use as Cline.
 */
export class KnowledgePatternBridge {
  private static instance: KnowledgePatternBridge;
  private logger: Logger;
  private cache: Cache;
  private eventBus: EventBus;
  private knowledgeService: KnowledgeService;
  private embeddingService: EmbeddingService;
  private patternSystem: PatternSystem;
  private effectivenessMetrics: Map<string, PatternEffectivenessMetrics>;
  private patternVersionHistory: Map<string, string[]>; // patternId -> version history (oldest to newest)
  private patternRelationships: Map<string, Set<string>>; // patternId -> related pattern IDs
  private mcpServer: any; // MCP server process for direct access

  private constructor(
    knowledgeService: KnowledgeService,
    embeddingService: EmbeddingService,
    patternSystem: PatternSystem
  ) {
    this.logger = new Logger('KnowledgePatternBridge');
    this.cache = new Cache(
      'knowledge-pattern-bridge', // namespace
      1000, // maxSize
      30 * 60 // ttl in seconds
    );
    this.eventBus = EventBus.getInstance();
    this.knowledgeService = knowledgeService;
    this.embeddingService = embeddingService;
    this.patternSystem = patternSystem;
    this.effectivenessMetrics = new Map();
    this.patternVersionHistory = new Map();
    this.patternRelationships = new Map();
    this.mcpServer = null;

    this.setupEventHandlers();
    this.initializeMcpConnection();
  }

  /**
   * Initialize MCP connection for direct access to Knowledge System
   */
  private async initializeMcpConnection(): Promise<void> {
    try {
      // Start the knowledge system MCP server
      this.mcpServer = mcpDirectAccess.startServer('knowledge-system', true);
      this.logger.info('Connected to Knowledge System MCP server');

      // Test the connection
      const tools = await mcpDirectAccess.listTools(this.mcpServer);
      this.logger.info(`Available Knowledge System tools: ${JSON.stringify(tools)}`);
    } catch (error) {
      this.logger.error('Failed to initialize MCP connection', error);
      this.logger.info('Falling back to internal Knowledge Service');
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(
    knowledgeService: KnowledgeService,
    embeddingService: EmbeddingService,
    patternSystem: PatternSystem
  ): KnowledgePatternBridge {
    if (!KnowledgePatternBridge.instance) {
      KnowledgePatternBridge.instance = new KnowledgePatternBridge(
        knowledgeService,
        embeddingService,
        patternSystem
      );
    }
    return KnowledgePatternBridge.instance;
  }

  /**
   * Check if MCP connection is available
   */
  private isMcpAvailable(): boolean {
    return this.mcpServer !== null;
  }

  /**
   * Store a pattern as knowledge in the vector database
   */
  public async storePatternAsKnowledge(pattern: Pattern): Promise<string> {
    try {
      // Create pattern knowledge object
      const patternKnowledge = await this.createPatternKnowledge(pattern);

      // Store in knowledge system
      const patternContent = this.serializePattern(pattern);

      // Create metadata for indexing
      const metadata: Partial<ExtendedVectorMetadata> = {
        source: 'pattern',
        confidence: pattern.confidence,
        tags: pattern.tags,
        categories: [pattern.type],
        sourcePath: `pattern:${pattern.id}`,
        sourceId: patternKnowledge.id,
        timestamp: new Date(),
        context: {
          domain: 'pattern',
          type: pattern.type,
          version: patternKnowledge.version
        },
        performance: {
          computeTime: 0,
          quality: pattern.metrics.successRate
        }
      };

      let ids: string[] = [];

      // Try to use MCP direct access first
      if (this.isMcpAvailable()) {
        try {
          const result = await mcpDirectAccess.storeMemory(this.mcpServer, patternContent, metadata);
          this.logger.info(`Stored pattern via MCP: ${result}`);
          ids = [patternKnowledge.id]; // Use the knowledge ID as the vector ID for MCP storage
        } catch (mcpError) {
          this.logger.warn(`MCP storage failed, falling back to KnowledgeService: ${mcpError}`);
          ids = await this.knowledgeService.indexDocument(patternContent, metadata);
        }
      } else {
        // Fall back to KnowledgeService
        ids = await this.knowledgeService.indexDocument(patternContent, metadata);
      }

      // Update pattern version history
      this.updatePatternVersionHistory(pattern.id, patternKnowledge.id);

      // Emit event
      await this.eventBus.emit(KnowledgePatternEventType.PATTERN_STORED, {
        patternId: pattern.id,
        knowledgeId: patternKnowledge.id,
        vectorIds: ids
      });

      this.logger.info(`Stored pattern ${pattern.id} as knowledge ${patternKnowledge.id}`);
      return patternKnowledge.id;
    } catch (error) {
      this.logger.error(`Failed to store pattern ${pattern.id} as knowledge`, error);
      throw error;
    }
  }

  /**
   * Store multiple patterns as knowledge in batch
   */
  public async storePatternBatch(patterns: Pattern[]): Promise<string[]> {
    try {
      const knowledgeIds: string[] = [];

      // Process patterns in batches of 10
      const batchSize = 10;
      for (let i = 0; i < patterns.length; i += batchSize) {
        const batch = patterns.slice(i, i + batchSize);
        const batchPromises = batch.map(pattern => this.storePatternAsKnowledge(pattern));
        const batchResults = await Promise.all(batchPromises);
        knowledgeIds.push(...batchResults);
      }

      this.logger.info(`Stored ${knowledgeIds.length} patterns as knowledge`);
      return knowledgeIds;
    } catch (error) {
      this.logger.error('Failed to store pattern batch', error);
      throw error;
    }
  }

  /**
   * Update pattern version history
   */
  private updatePatternVersionHistory(patternId: string, knowledgeId: string): void {
    // Get existing history or create new one
    const history = this.patternVersionHistory.get(patternId) || [];

    // Add new version
    history.push(knowledgeId);

    // Update history
    this.patternVersionHistory.set(patternId, history);
  }

  /**
   * Get pattern version history
   */
  public getPatternVersionHistory(patternId: string): string[] {
    return this.patternVersionHistory.get(patternId) || [];
  }

  /**
   * Retrieve patterns from knowledge for optimization based on computation context
   */
  public async retrievePatternsForOptimization(context: ComputationContext): Promise<Pattern[]> {
    try {
      // Create query from context
      const query = this.createQueryFromContext(context);

      // Search knowledge system
      const queryText = this.serializeContext(context);

      let searchResults;

      // Try to use MCP direct access first
      if (this.isMcpAvailable()) {
        try {
          const mcpResults = await mcpDirectAccess.queryMemories(
            this.mcpServer,
            queryText,
            query.limit || 10
          );

          // Parse MCP results
          if (typeof mcpResults === 'string') {
            searchResults = { matches: JSON.parse(mcpResults) };
          } else {
            searchResults = mcpResults;
          }

          this.logger.info(`Retrieved patterns via MCP: ${JSON.stringify(searchResults)}`);
        } catch (mcpError) {
          this.logger.warn(`MCP query failed, falling back to KnowledgeService: ${mcpError}`);
          searchResults = await this.knowledgeService.searchKnowledge(queryText, {
            filter: {
              source: ['pattern'],
              tags: query.tags,
              categories: query.category ? [query.category] : undefined
            },
            topK: query.limit || 10
          });
        }
      } else {
        // Fall back to KnowledgeService
        searchResults = await this.knowledgeService.searchKnowledge(queryText, {
          filter: {
            source: ['pattern'],
            tags: query.tags,
            categories: query.category ? [query.category] : undefined
          },
          topK: query.limit || 10
        });
      }

      // Extract patterns from search results
      const patterns: Pattern[] = [];

      if (searchResults && searchResults.matches) {
        for (const match of searchResults.matches) {
          try {
            const pattern = this.deserializePattern(match.metadata?.content || match.content);
            if (pattern && this.isPatternApplicableToContext(pattern, context)) {
              patterns.push(pattern);

              // Cache the pattern for future use
              this.cache.set(`pattern:${pattern.id}`, pattern);
            }
          } catch (error) {
            this.logger.warn(`Failed to deserialize pattern from knowledge`, error);
          }
        }
      }

      // Emit event
      await this.eventBus.emit(KnowledgePatternEventType.PATTERN_RETRIEVED, {
        context,
        patternCount: patterns.length
      });

      this.logger.info(`Retrieved ${patterns.length} patterns for optimization`);
      return patterns;
    } catch (error) {
      this.logger.error('Failed to retrieve patterns for optimization', error);
      throw error;
    }
  }

  /**
   * Retrieve patterns by category
   */
  public async retrievePatternsByCategory(category: PatternCategory, limit: number = 10): Promise<Pattern[]> {
    try {
      // Create query text
      const queryText = `Patterns in category: ${category}`;

      let searchResults;

      // Try to use MCP direct access first
      if (this.isMcpAvailable()) {
        try {
          const mcpResults = await mcpDirectAccess.queryMemories(
            this.mcpServer,
            queryText,
            limit
          );

          // Parse MCP results
          if (typeof mcpResults === 'string') {
            searchResults = { matches: JSON.parse(mcpResults) };
          } else {
            searchResults = mcpResults;
          }
        } catch (mcpError) {
          this.logger.warn(`MCP query failed, falling back to KnowledgeService: ${mcpError}`);
          searchResults = await this.knowledgeService.searchKnowledge(queryText, {
            filter: {
              source: ['pattern'],
              categories: [category]
            },
            topK: limit
          });
        }
      } else {
        // Fall back to KnowledgeService
        searchResults = await this.knowledgeService.searchKnowledge(queryText, {
          filter: {
            source: ['pattern'],
            categories: [category]
          },
          topK: limit
        });
      }

      // Extract patterns from search results
      const patterns: Pattern[] = [];

      if (searchResults && searchResults.matches) {
        for (const match of searchResults.matches) {
          try {
            const pattern = this.deserializePattern(match.metadata?.content || match.content);
            if (pattern) {
              patterns.push(pattern);

              // Cache the pattern for future use
              this.cache.set(`pattern:${pattern.id}`, pattern);
            }
          } catch (error) {
            this.logger.warn(`Failed to deserialize pattern from knowledge`, error);
          }
        }
      }

      this.logger.info(`Retrieved ${patterns.length} patterns for category ${category}`);
      return patterns;
    } catch (error) {
      this.logger.error(`Failed to retrieve patterns for category ${category}`, error);
      throw error;
    }
  }

  /**
   * Retrieve patterns by tags
   */
  public async retrievePatternsByTags(tags: string[], limit: number = 10): Promise<Pattern[]> {
    try {
      // Create query text
      const queryText = `Patterns with tags: ${tags.join(', ')}`;

      let searchResults;

      // Try to use MCP direct access first
      if (this.isMcpAvailable()) {
        try {
          const mcpResults = await mcpDirectAccess.queryMemories(
            this.mcpServer,
            queryText,
            limit
          );

          // Parse MCP results
          if (typeof mcpResults === 'string') {
            searchResults = { matches: JSON.parse(mcpResults) };
          } else {
            searchResults = mcpResults;
          }
        } catch (mcpError) {
          this.logger.warn(`MCP query failed, falling back to KnowledgeService: ${mcpError}`);
          searchResults = await this.knowledgeService.searchKnowledge(queryText, {
            filter: {
              source: ['pattern'],
              tags: tags
            },
            topK: limit
          });
        }
      } else {
        // Fall back to KnowledgeService
        searchResults = await this.knowledgeService.searchKnowledge(queryText, {
          filter: {
            source: ['pattern'],
            tags: tags
          },
          topK: limit
        });
      }

      // Extract patterns from search results
      const patterns: Pattern[] = [];

      if (searchResults && searchResults.matches) {
        for (const match of searchResults.matches) {
          try {
            const pattern = this.deserializePattern(match.metadata?.content || match.content);
            if (pattern) {
              patterns.push(pattern);

              // Cache the pattern for future use
              this.cache.set(`pattern:${pattern.id}`, pattern);
            }
          } catch (error) {
            this.logger.warn(`Failed to deserialize pattern from knowledge`, error);
          }
        }
      }

      this.logger.info(`Retrieved ${patterns.length} patterns for tags ${tags.join(', ')}`);
      return patterns;
    } catch (error) {
      this.logger.error(`Failed to retrieve patterns for tags ${tags.join(', ')}`, error);
      throw error;
    }
  }

  /**
   * Create feedback loop for pattern execution results
   */
  public async createFeedbackLoop(pattern: Pattern, result: PatternExecutionResult): Promise<void> {
    try {
      // Update effectiveness metrics
      await this.updateEffectivenessMetrics(pattern.id, result);

      // Store execution result
      await this.storeExecutionResult(pattern, result);

      // Emit event
      await this.eventBus.emit(KnowledgePatternEventType.PATTERN_EXECUTION_RESULT, {
        patternId: pattern.id,
        result
      });

      // Check if pattern needs refinement
      if (await this.shouldRefinePattern(pattern.id)) {
        await this.triggerPatternRefinement(pattern);
      }

      this.logger.info(`Created feedback loop for pattern ${pattern.id}`);
    } catch (error) {
      this.logger.error(`Failed to create feedback loop for pattern ${pattern.id}`, error);

      // Attempt recovery
      try {
        this.logger.info(`Attempting recovery for feedback loop of pattern ${pattern.id}`);

        // Store minimal execution result
        const minimalResult: PatternExecutionResult = {
          patternId: pattern.id,
          patternVersion: result.patternVersion,
          context: result.context,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error during feedback loop',
          timestamp: new Date().toISOString()
        };

        await this.storeExecutionResult(pattern, minimalResult);

        this.logger.info(`Recovery successful for feedback loop of pattern ${pattern.id}`);
      } catch (recoveryError) {
        this.logger.error(`Recovery failed for feedback loop of pattern ${pattern.id}`, recoveryError);
      }

      throw error;
    }
  }

  /**
   * Update pattern repository with patterns from knowledge system
   */
  public async updatePatternRepository(patterns: Pattern[]): Promise<void> {
    try {
      // Store patterns in repository
      for (const pattern of patterns) {
        await this.patternSystem.savePattern(pattern);

        // Update pattern relationships
        await this.updatePatternRelationships(pattern);
      }

      // Emit event
      await this.eventBus.emit(KnowledgePatternEventType.PATTERN_REFINED, {
        patternCount: patterns.length
      });

      this.logger.info(`Updated pattern repository with ${patterns.length} patterns`);
    } catch (error) {
      this.logger.error('Failed to update pattern repository', error);
      throw error;
    }
  }

  /**
   * Update pattern relationships
   */
  private async updatePatternRelationships(pattern: Pattern): Promise<void> {
    try {
      // Get existing relationships
      const existingRelationships = this.patternRelationships.get(pattern.id) || new Set<string>();

      // Find related patterns based on tags
      if (pattern.tags && pattern.tags.length > 0) {
        // Ensure we're working with resolved patterns
        const relatedPatternsPromise = this.retrievePatternsByTags(pattern.tags, 5);
        const relatedPatterns = await relatedPatternsPromise;

        // Add related pattern IDs to relationships
        for (const relatedPattern of relatedPatterns) {
          // Ensure relatedPattern is not a Promise
          if (relatedPattern && relatedPattern.id !== pattern.id) {
            existingRelationships.add(relatedPattern.id);
          }
        }
      }

      // Update relationships
      this.patternRelationships.set(pattern.id, existingRelationships);

      this.logger.info(`Updated relationships for pattern ${pattern.id}: ${Array.from(existingRelationships).join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to update relationships for pattern ${pattern.id}`, error);
    }
  }

  /**
   * Get related patterns
   */
  public async getRelatedPatterns(patternId: string): Promise<Pattern[]> {
    try {
      // Get related pattern IDs
      const relatedIds = Array.from(this.patternRelationships.get(patternId) || new Set<string>());

      if (relatedIds.length === 0) {
        return [];
      }

      // Get patterns from repository
      const patterns: Pattern[] = [];

      for (const id of relatedIds) {
        // Check cache first
        const cachedPattern = this.cache.get<Pattern>(`pattern:${id}`);

        if (cachedPattern) {
          patterns.push(cachedPattern);
        } else {
          try {
            // Retrieve the pattern and handle potential null result
            const pattern = await this.patternSystem.getPattern(id) as Pattern | null;
            if (pattern) {
              patterns.push(pattern);

              // Cache the pattern
              this.cache.set(`pattern:${id}`, pattern);
            }
          } catch (error) {
            this.logger.warn(`Failed to get related pattern ${id}`, error);
          }
        }
      }

      return patterns;
    } catch (error) {
      this.logger.error(`Failed to get related patterns for ${patternId}`, error);
      return [];
    }
  }

  /**
   * Get effectiveness metrics for a pattern
   */
  public async getEffectivenessMetrics(patternId: string): Promise<PatternEffectivenessMetrics | undefined> {
    return this.effectivenessMetrics.get(patternId);
  }

  /**
   * Get all effectiveness metrics
   */
  public async getAllEffectivenessMetrics(): Promise<PatternEffectivenessMetrics[]> {
    return Array.from(this.effectivenessMetrics.values());
  }

  /**
   * Get top performing patterns
   */
  public async getTopPerformingPatterns(limit: number = 10): Promise<{pattern: Pattern, metrics: PatternEffectivenessMetrics}[]> {
    try {
      // Get all metrics
      const allMetrics = await this.getAllEffectivenessMetrics();

      // Sort by performance improvement
      const sortedMetrics = allMetrics
        .filter(m => m.applicationCount >= 5) // Only consider patterns with enough applications
        .sort((a, b) => b.avgPerformanceImprovement - a.avgPerformanceImprovement)
        .slice(0, limit);

      // Get patterns for metrics
      const result: {pattern: Pattern, metrics: PatternEffectivenessMetrics}[] = [];

      // Process patterns sequentially to avoid race conditions
      for (const metrics of sortedMetrics) {
        try {
          // Retrieve the pattern and handle potential null result
          const patternResult = await this.patternSystem.getPattern(metrics.patternId) as Pattern | null;

          // Only add if pattern exists
          if (patternResult) {
            result.push({
              pattern: patternResult,
              metrics
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to get pattern ${metrics.patternId}`, error);
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to get top performing patterns', error);
      return [];
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Listen for pattern detection events
    this.eventBus.on('pattern.detected', async (event: any) => {
      try {
        const pattern = event.payload.pattern;
        if (pattern) {
          // Ensure pattern is not a Promise
          const resolvedPattern = pattern instanceof Promise ? await pattern : pattern;
          await this.storePatternAsKnowledge(resolvedPattern);
        }
      } catch (error) {
        this.logger.error('Failed to handle pattern detection event', error);
      }
    });

    // Listen for pattern optimization events
    this.eventBus.on('pattern.optimized', async (event: any) => {
      try {
        const pattern = event.payload.pattern;
        if (pattern) {
          // Ensure pattern is not a Promise
          const resolvedPattern = pattern instanceof Promise ? await pattern : pattern;
          await this.storePatternAsKnowledge(resolvedPattern);
        }
      } catch (error) {
        this.logger.error('Failed to handle pattern optimization event', error);
      }
    });
  }

  /**
   * Create pattern knowledge object from pattern
   */
  private async createPatternKnowledge(pattern: Pattern): Promise<PatternKnowledge> {
    // Create pattern content for embedding
    const patternContent = this.serializePattern(pattern);

    // Generate embedding
    const embeddingValues = await this.embeddingService.embed(patternContent);

    // Create Vector object
    const embedding: Vector = {
      dimensions: embeddingValues.length,
      values: embeddingValues,
      metadata: {
        source: 'pattern',
        timestamp: new Date(),
        confidence: pattern.confidence,
        context: {
          domain: 'pattern',
          type: pattern.type,
          version: 1
        },
        performance: {
          computeTime: 0,
          quality: pattern.metrics.successRate
        }
      }
    };

    // Create metadata
    const metadata: PatternMetadata = {
      category: this.mapPatternTypeToCategory(pattern.type),
      tags: pattern.tags,
      complexity: pattern.metrics.complexityScore,
      reliability: pattern.metrics.successRate,
      performanceImpact: pattern.impact,
      applicationCount: pattern.metrics.usageCount,
      successCount: Math.round(pattern.metrics.usageCount * pattern.metrics.successRate),
      source: PatternSource.DETECTION,
      applicableContext: this.extractContextFromPattern(pattern)
    };

    // Create pattern knowledge
    return {
      id: uuidv4(),
      pattern,
      embedding,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
  }

  /**
   * Map pattern type to category
   */
  private mapPatternTypeToCategory(type: string): PatternCategory {
    switch (type) {
      case 'workflow':
        return PatternCategory.WORKFLOW;
      case 'learning':
        return PatternCategory.LEARNING;
      case 'integration':
        return PatternCategory.INTEGRATION;
      case 'command':
      case 'automation':
        return PatternCategory.OPTIMIZATION;
      case 'document':
        return PatternCategory.ARCHITECTURE;
      default:
        return PatternCategory.COMPUTATION;
    }
  }

  /**
   * Extract context from pattern
   */
  private extractContextFromPattern(pattern: Pattern): PatternContext[] {
    const contexts: PatternContext[] = [];

    // Add context based on pattern type
    contexts.push({
      type: pattern.type,
      constraints: {},
      priority: 1
    });

    // Add context based on tags
    if (pattern.tags.length > 0) {
      contexts.push({
        type: 'tags',
        constraints: {
          tags: pattern.tags
        },
        priority: 0.8
      });
    }

    // Add context based on implementation
    if (pattern.implementation.requirements && pattern.implementation.requirements.length > 0) {
      contexts.push({
        type: 'requirements',
        constraints: {
          requirements: pattern.implementation.requirements
        },
        priority: 0.7
      });
    }

    return contexts;
  }

  /**
   * Create query from computation context
   */
  private createQueryFromContext(context: ComputationContext): KnowledgePatternQuery {
    const query: KnowledgePatternQuery = {
      context
    };

    // Add category based on operation types
    if (context.operationTypes && context.operationTypes.length > 0) {
      // Map operation types to categories
      const categoryMap: Record<string, PatternCategory> = {
        'matmul': PatternCategory.COMPUTATION,
        'conv': PatternCategory.COMPUTATION,
        'add': PatternCategory.COMPUTATION,
        'sub': PatternCategory.COMPUTATION,
        'mul': PatternCategory.COMPUTATION,
        'div': PatternCategory.COMPUTATION,
        'relu': PatternCategory.COMPUTATION,
        'sigmoid': PatternCategory.COMPUTATION,
        'tanh': PatternCategory.COMPUTATION,
        'softmax': PatternCategory.COMPUTATION,
        'batch_norm': PatternCategory.OPTIMIZATION,
        'layer_norm': PatternCategory.OPTIMIZATION,
        'dropout': PatternCategory.OPTIMIZATION,
        'pooling': PatternCategory.OPTIMIZATION
      };

      // Find the most common category
      const categoryCounts: Record<string, number> = {};
      for (const opType of context.operationTypes) {
        const category = categoryMap[opType] || PatternCategory.COMPUTATION;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }

      // Set the most common category
      let maxCount = 0;
      let maxCategory: PatternCategory | undefined;
      for (const [category, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
          maxCount = count;
          maxCategory = category as PatternCategory;
        }
      }

      if (maxCategory) {
        query.category = maxCategory;
      }
    }

    // Add tags based on data types and shapes
    const tags: string[] = [];
    if (context.dataTypes) {
      tags.push(...context.dataTypes);
    }
    if (context.inputShapes) {
      tags.push(`input_rank_${context.inputShapes[0].length}`);
    }
    if (context.outputShapes) {
      tags.push(`output_rank_${context.outputShapes[0].length}`);
    }

    if (tags.length > 0) {
      query.tags = tags;
    }

    // Set reliability threshold based on performance constraints
    if (context.performanceConstraints) {
      query.minReliability = 0.8; // Higher reliability for performance-critical contexts
    } else {
      query.minReliability = 0.6;
    }

    // Set complexity threshold
    query.maxComplexity = 8;

    // Set limit
    query.limit = 10;

    return query;
  }

  /**
   * Check if pattern is applicable to context
   */
  private isPatternApplicableToContext(pattern: Pattern, context: ComputationContext): boolean {
    // Check operation types
    if (context.operationTypes && context.operationTypes.length > 0) {
      // Check if pattern has relevant tags
      const hasRelevantTags = context.operationTypes.some(opType =>
        pattern.tags.includes(opType) ||
        pattern.tags.includes(`op_${opType}`)
      );

      if (!hasRelevantTags) {
        return false;
      }
    }

    // Check performance constraints
    if (context.performanceConstraints) {
      // For performance-critical contexts, require high reliability
      if (pattern.metrics.successRate < 0.8) {
        return false;
      }

      // Check execution time constraints
      if (
        context.performanceConstraints.maxExecutionTime &&
        pattern.metrics.averageExecutionTime > context.performanceConstraints.maxExecutionTime
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update effectiveness metrics for a pattern
   */
  private async updateEffectivenessMetrics(
    patternId: string,
    result: PatternExecutionResult
  ): Promise<void> {
    // Get current metrics or create new ones
    let metrics = this.effectivenessMetrics.get(patternId);
    if (!metrics) {
      // Create new metrics with all fields initialized
      metrics = {
        patternId,
        patternVersion: result.patternVersion,
        successRate: 0,
        avgPerformanceImprovement: 0,
        avgExecutionTimeImprovement: 0,
        avgMemoryUsageImprovement: 0,
        // Initialize with 0 instead of undefined
        avgThroughputImprovement: 0,
        applicationCount: 0,
        updatedAt: new Date().toISOString()
      };
    }
    // No need to check for undefined since avgThroughputImprovement is now required

    // Update metrics
    const oldCount = metrics.applicationCount;
    const newCount = oldCount + 1;

    // Update success rate
    metrics.successRate = (metrics.successRate * oldCount + (result.success ? 1 : 0)) / newCount;

    // Update performance improvements if available
    if (result.baselineMetrics && result.resultMetrics) {
      // Execution time improvement (lower is better)
      const executionTimeImprovement = result.baselineMetrics.executionTime /
        Math.max(0.001, result.resultMetrics.executionTime);
      metrics.avgExecutionTimeImprovement =
        (metrics.avgExecutionTimeImprovement * oldCount + executionTimeImprovement) / newCount;

      // Memory usage improvement (lower is better)
      const memoryUsageImprovement = result.baselineMetrics.memoryUsage /
        Math.max(0.001, result.resultMetrics.memoryUsage);
      metrics.avgMemoryUsageImprovement =
        (metrics.avgMemoryUsageImprovement * oldCount + memoryUsageImprovement) / newCount;

      // Throughput improvement (higher is better)
      if (result.baselineMetrics.throughput && result.resultMetrics.throughput) {
        const throughputImprovement = result.resultMetrics.throughput /
          Math.max(0.001, result.baselineMetrics.throughput);

        // Initialize avgThroughputImprovement if it's undefined
        if (metrics.avgThroughputImprovement === undefined) {
          metrics.avgThroughputImprovement = 0;
        }

        // Now safely update the value
        metrics.avgThroughputImprovement =
          (metrics.avgThroughputImprovement * oldCount + throughputImprovement) / newCount;
      } else if (metrics.avgThroughputImprovement === undefined) {
        // Ensure avgThroughputImprovement is initialized even if no throughput data
        metrics.avgThroughputImprovement = 0;
      }

      // Calculate overall performance improvement
      // First ensure all metrics have default values
      // Use default value of 1 if these are 0 or falsy
      const execTime = metrics.avgExecutionTimeImprovement || 1;
      const memUsage = metrics.avgMemoryUsageImprovement || 1;

      // Handle throughput separately since it's optional
      let divisor = 2; // Default to just execution time and memory usage
      let totalImprovement = execTime + memUsage;

      // Handle the optional avgThroughputImprovement property
      if (metrics.avgThroughputImprovement !== undefined &&
          metrics.avgThroughputImprovement !== null) {
        // Only count throughput in the average if it's not the default value
        if (metrics.avgThroughputImprovement !== 0) {
          totalImprovement += metrics.avgThroughputImprovement;
          divisor = 3;
        }
      }

      // Calculate the average
      metrics.avgPerformanceImprovement = totalImprovement / divisor;
    }

    // Update count and timestamp
    metrics.applicationCount = newCount;
    metrics.updatedAt = new Date().toISOString();

    // Store updated metrics
    this.effectivenessMetrics.set(patternId, metrics);

    // Emit event
    await this.eventBus.emit(KnowledgePatternEventType.PATTERN_EFFECTIVENESS_UPDATED, {
      patternId,
      metrics
    });
  }

  /**
   * Store execution result
   */
  private async storeExecutionResult(
    pattern: Pattern,
    result: PatternExecutionResult
  ): Promise<void> {
    // Create result content
    const resultContent = JSON.stringify({
      pattern: pattern.name,
      patternId: pattern.id,
      patternVersion: result.patternVersion,
      success: result.success,
      context: result.context,
      baselineMetrics: result.baselineMetrics,
      resultMetrics: result.resultMetrics,
      timestamp: result.timestamp,
      errorMessage: result.errorMessage
    }, null, 2);

    // Store in knowledge system
    const metadata: Partial<ExtendedVectorMetadata> = {
      source: 'pattern_result',
      confidence: result.success ? 0.9 : 0.5,
      tags: [...pattern.tags, result.success ? 'success' : 'failure'],
      categories: ['execution_result', pattern.type],
      sourcePath: `pattern_result:${pattern.id}`,
      sourceId: result.patternId,
      timestamp: new Date(),
      context: {
        domain: 'pattern_result',
        type: pattern.type,
        version: result.patternVersion
      },
      performance: {
        computeTime: 0,
        quality: result.success ? 0.9 : 0.5
      }
    };

    await this.knowledgeService.indexDocument(resultContent, metadata);
  }

  /**
   * Check if pattern should be refined
   */
  private async shouldRefinePattern(patternId: string): Promise<boolean> {
    const metrics = this.effectivenessMetrics.get(patternId);
    if (!metrics) {
      return false;
    }

    // Refine if:
    // 1. Success rate is below threshold and has been applied enough times
    if (metrics.successRate < 0.7 && metrics.applicationCount >= 5) {
      return true;
    }

    // 2. Performance improvement is below threshold and has been applied enough times
    if (metrics.avgPerformanceImprovement < 1.1 && metrics.applicationCount >= 10) {
      return true;
    }

    // 3. Has been applied many times without refinement
    if (metrics.applicationCount >= 20) {
      return true;
    }

    return false;
  }

  /**
   * Trigger pattern refinement
   */
  private async triggerPatternRefinement(pattern: Pattern): Promise<void> {
    try {
      // Get effectiveness metrics
      const metrics = this.effectivenessMetrics.get(pattern.id);
      if (!metrics) {
        return;
      }

      // Optimize pattern and handle potential null result
      const optimizedPattern = await this.patternSystem.optimizePattern(pattern) as Pattern | null;

      if (optimizedPattern) {
        // Store optimized pattern
        await this.storePatternAsKnowledge(optimizedPattern);

        // Update pattern repository
        await this.patternSystem.savePattern(optimizedPattern);

        // Emit event
        await this.eventBus.emit(KnowledgePatternEventType.PATTERN_EVOLUTION_TRIGGERED, {
          originalPatternId: pattern.id,
          newPatternId: optimizedPattern.id,
          metrics
        });

        this.logger.info(`Triggered refinement for pattern ${pattern.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to trigger refinement for pattern ${pattern.id}`, error);
    }
  }

  /**
   * Serialize pattern to string
   */
  private serializePattern(pattern: Pattern): string {
    return JSON.stringify({
      id: pattern.id,
      type: pattern.type,
      name: pattern.name,
      description: pattern.description,
      tags: pattern.tags,
      confidence: pattern.confidence,
      impact: pattern.impact,
      metadata: pattern.metadata,
      metrics: pattern.metrics,
      implementation: pattern.implementation,
      validation: pattern.validation,
      evolution: pattern.evolution
    }, null, 2);
  }

  /**
   * Deserialize pattern from string
   */
  private deserializePattern(content: string): Pattern | null {
    try {
      const data = JSON.parse(content);
      return {
        ...data,
        timestamp: new Date(data.timestamp || Date.now())
      };
    } catch (error) {
      this.logger.error('Failed to deserialize pattern', error);
      return null;
    }
  }

  /**
   * Serialize context to string
   */
  private serializeContext(context: ComputationContext): string {
    let content = 'Computation Context:\n\n';

    // Add operation types
    if (context.operationTypes && context.operationTypes.length > 0) {
      content += `Operations: ${context.operationTypes.join(', ')}\n\n`;
    }

    // Add input shapes
    if (context.inputShapes && context.inputShapes.length > 0) {
      content += 'Input Shapes:\n';
      context.inputShapes.forEach((shape, i) => {
        content += `- Input ${i}: [${shape.join(', ')}]\n`;
      });
      content += '\n';
    }

    // Add output shapes
    if (context.outputShapes && context.outputShapes.length > 0) {
      content += 'Output Shapes:\n';
      context.outputShapes.forEach((shape, i) => {
        content += `- Output ${i}: [${shape.join(', ')}]\n`;
      });
      content += '\n';
    }

    // Add data types
    if (context.dataTypes && context.dataTypes.length > 0) {
      content += `Data Types: ${context.dataTypes.join(', ')}\n\n`;
    }

    // Add performance constraints
    if (context.performanceConstraints) {
      content += 'Performance Constraints:\n';
      if (context.performanceConstraints.maxMemoryUsage) {
        content += `- Max Memory: ${context.performanceConstraints.maxMemoryUsage} bytes\n`;
      }
      if (context.performanceConstraints.maxExecutionTime) {
        content += `- Max Execution Time: ${context.performanceConstraints.maxExecutionTime} ms\n`;
      }
      if (context.performanceConstraints.minThroughput) {
        content += `- Min Throughput: ${context.performanceConstraints.minThroughput} ops/s\n`;
      }
      content += '\n';
    }

    // Add graph summary if available
    if (context.graph) {
      content += this.summarizeGraph(context.graph);
    }

    return content;
  }

  /**
   * Summarize computation graph
   */
  private summarizeGraph(graph: ComputationGraph): string {
    let summary = 'Computation Graph Summary:\n\n';

    // Count nodes by type
    const nodeTypes: Record<string, number> = {};
    for (const [_, node] of graph.nodes.entries()) {
      nodeTypes[node.opType] = (nodeTypes[node.opType] || 0) + 1;
    }

    // Add node type counts
    summary += 'Node Types:\n';
    for (const [type, count] of Object.entries(nodeTypes)) {
      summary += `- ${type}: ${count}\n`;
    }
    summary += '\n';

    // Add total nodes and edges
    summary += `Total Nodes: ${graph.nodes.size}\n`;
    summary += `Total Edges: ${graph.edges.length}\n\n`;

    // Add input and output nodes
    summary += `Input Nodes: ${graph.inputs.length}\n`;
    summary += `Output Nodes: ${graph.outputs.length}\n\n`;

    return summary;
  }
}
