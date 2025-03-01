/**
 * Cognitive Tools Integration
 *
 * This module provides a unified interface for accessing knowledge, patterns,
 * and memory systems to enhance Cline's cognitive capabilities.
 */

import { config, updateConfig, resetConfig, CognitiveToolsConfig } from './config';
import { logger } from './utils/logger';
import {
  ErrorCode,
  CognitiveToolsError,
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
  DiagramType,
  // Project types
  Project,
  ProjectType,
  ProjectStatus,
  ProjectMetadata,
  Requirement,
  RequirementType,
  RequirementPriority,
  RequirementStatus,
  ArchitectureComponent,
  ArchitectureComponentType,
  ImplementationComponent,
  ImplementationComponentType,
  ImplementationStatus,
  TestComponent,
  TestType,
  TestStatus,
  DeploymentComponent,
  DeploymentType,
  DeploymentStatus,
  ProjectSearchOptions,
  ProjectResult,
  KnowledgeProjectLink,
  KnowledgeProjectLinkType,
  KnowledgeProjectSearchOptions,
  // Code Generation types
  CodeTemplate,
  CodeTemplateType,
  ProgrammingLanguage,
  TemplateVariable,
  TemplateVariableType,
  CodeTemplateMetadata,
  ComplexityLevel,
  CodeGenerationRequest,
  CodeGenerationMetadata,
  CodeGenerationResult,
  CodeGenerationStatus,
  GeneratedFile,
  CodeGenerationResultMetadata,
  CodeTemplateSearchOptions,
  CodeGenerationSearchOptions,
  CodeTemplateResult,
  CodeOptimizationRequest,
  OptimizationType,
  OptimizationConstraint,
  OptimizationConstraintType,
  CodeOptimizationMetadata,
  CodeOptimizationResult,
  CodeOptimizationStatus,
  CodeChange,
  CodeChangeType,
  ImpactLevel,
  OptimizationMetrics
} from './types';

// Import from knowledge-project-integration
import {
  KnowledgeItem,
  KnowledgeItemType,
  ProjectContext,
  CreateProjectContextParams,
  RetrieveKnowledgeParams,
  KnowledgeRetrievalResult,
  LinkKnowledgeParams,
  ProjectDecision,
  DecisionStatus,
  CreateDecisionParams,
  ImplementationPlan,
  GenerateImplementationPlanParams,
  OptimizationCriteria,
  KnowledgeProjectLink as KnowledgeProjectIntegrationLink
} from './types/knowledge-project-integration';

import { knowledgeManager } from './managers/knowledge-manager';
import { memoryManager } from './managers/memory-manager';
import { patternManager } from './managers/pattern-manager';
import { visualizationManager } from './managers/visualization-manager';
import { projectManager } from './managers/project-manager';
import { knowledgeProjectIntegrationManager } from './managers/knowledge-project-integration-manager';
import { CodeGenerationManager } from './managers/code-generation-manager';

// Create an instance of the CodeGenerationManager
const codeGenerationManager = new CodeGenerationManager();

/**
 * Cognitive Tools API
 */
export class CognitiveTools {
  private static instance: CognitiveTools;
  private initialized: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get CognitiveTools instance (singleton)
   */
  public static getInstance(): CognitiveTools {
    if (!CognitiveTools.instance) {
      CognitiveTools.instance = new CognitiveTools();
    }
    return CognitiveTools.instance;
  }

  /**
   * Initialize the Cognitive Tools
   * @param customConfig Optional custom configuration
   */
  public async initialize(customConfig?: Partial<CognitiveToolsConfig>): Promise<void> {
    if (this.initialized) {
      logger.warn('CognitiveTools already initialized');
      return;
    }

    try {
      logger.info('Initializing CognitiveTools');

      // Update configuration if provided
      if (customConfig) {
        updateConfig(customConfig);
      }

      // Initialize managers (will be implemented later)
      // await this.initializeManagers();

      this.initialized = true;
      logger.info('CognitiveTools initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to initialize CognitiveTools: ${message}`, { error });
      throw new CognitiveToolsError(ErrorCode.INTERNAL_ERROR, `Initialization failed: ${message}`);
    }
  }

  /**
   * Check if CognitiveTools is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset CognitiveTools to default state
   */
  public reset(): void {
    logger.info('Resetting CognitiveTools');
    resetConfig();
    this.initialized = false;
  }

  /**
   * Get current configuration
   */
  public getConfig(): CognitiveToolsConfig {
    return { ...config };
  }

  /**
   * Update configuration
   * @param newConfig Partial configuration to merge with current config
   */
  public updateConfig(newConfig: Partial<CognitiveToolsConfig>): void {
    logger.info('Updating CognitiveTools configuration');
    updateConfig(newConfig);
  }

  /**
   * Get logger instance
   */
  public getLogger() {
    return logger;
  }

  // Knowledge Manager methods

  /**
   * Search for knowledge
   * @param query Search query
   * @param options Search options
   */
  public async searchKnowledge(query: string, options?: SearchOptions) {
    this.ensureInitialized();
    return knowledgeManager.searchKnowledge(query, options);
  }

  /**
   * Get knowledge by ID
   * @param id Knowledge ID
   */
  public async getKnowledgeById(id: string) {
    this.ensureInitialized();
    return knowledgeManager.getKnowledgeById(id);
  }

  /**
   * Store knowledge
   * @param knowledge Knowledge to store
   */
  public async storeKnowledge(knowledge: Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    return knowledgeManager.storeKnowledge(knowledge);
  }

  /**
   * Update knowledge
   * @param id Knowledge ID
   * @param updates Knowledge updates
   */
  public async updateKnowledge(id: string, updates: Partial<Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>>) {
    this.ensureInitialized();
    return knowledgeManager.updateKnowledge(id, updates);
  }

  /**
   * Delete knowledge
   * @param id Knowledge ID
   */
  public async deleteKnowledge(id: string) {
    this.ensureInitialized();
    return knowledgeManager.deleteKnowledge(id);
  }

  // Memory Manager methods

  /**
   * Retrieve memories
   * @param query Search query
   * @param options Memory options
   */
  public async retrieveMemories(query: string, options?: MemoryOptions) {
    this.ensureInitialized();
    return memoryManager.retrieveMemories(query, options);
  }

  /**
   * Get memory by ID
   * @param id Memory ID
   */
  public async getMemoryById(id: string) {
    this.ensureInitialized();
    return memoryManager.getMemoryById(id);
  }

  /**
   * Store memory
   * @param memory Memory to store
   */
  public async storeMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    return memoryManager.storeMemory(memory);
  }

  /**
   * Update memory
   * @param id Memory ID
   * @param updates Memory updates
   */
  public async updateMemory(id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>) {
    this.ensureInitialized();
    return memoryManager.updateMemory(id, updates);
  }

  /**
   * Delete memory
   * @param id Memory ID
   */
  public async deleteMemory(id: string) {
    this.ensureInitialized();
    return memoryManager.deleteMemory(id);
  }

  /**
   * Update memory bank files with memory
   * @param memory Memory to update in memory bank files
   */
  public async updateMemoryBank(memory: Memory) {
    this.ensureInitialized();
    return memoryManager.updateMemoryBank(memory);
  }

  /**
   * Sync all memories with memory bank files
   */
  public async syncMemoryBank() {
    this.ensureInitialized();
    return memoryManager.syncMemoryBank();
  }

  // Pattern Manager methods

  /**
   * Detect patterns in content
   * @param content Content to detect patterns in
   */
  public async detectPatterns(content: string) {
    this.ensureInitialized();
    return patternManager.detectPatterns(content);
  }

  /**
   * Optimize content with patterns
   * @param content Content to optimize
   * @param patterns Patterns to apply (optional, will use detected patterns if not provided)
   */
  public async optimizeWithPatterns(content: string, patterns?: Pattern[]) {
    this.ensureInitialized();
    return patternManager.optimizeWithPatterns(content, patterns);
  }

  /**
   * Get pattern by ID
   * @param id Pattern ID
   */
  public async getPatternById(id: string) {
    this.ensureInitialized();
    return patternManager.getPatternById(id);
  }

  /**
   * Store pattern
   * @param pattern Pattern to store
   */
  public async storePattern(pattern: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    return patternManager.storePattern(pattern);
  }

  /**
   * Update pattern
   * @param id Pattern ID
   * @param updates Pattern updates
   */
  public async updatePattern(id: string, updates: Partial<Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'>>) {
    this.ensureInitialized();
    return patternManager.updatePattern(id, updates);
  }

  /**
   * Delete pattern
   * @param id Pattern ID
   */
  public async deletePattern(id: string) {
    this.ensureInitialized();
    return patternManager.deletePattern(id);
  }

  /**
   * Search patterns
   * @param query Search query
   * @param type Pattern type filter (optional)
   * @param tags Tags filter (optional)
   * @param limit Result limit (optional)
   */
  public async searchPatterns(query: string, type?: PatternType, tags?: string[], limit?: number) {
    this.ensureInitialized();
    return patternManager.searchPatterns(query, type, tags, limit);
  }

  // Visualization Manager methods

  /**
   * Generate a Mermaid diagram
   * @param type Diagram type
   * @param content Diagram content
   */
  public generateMermaidDiagram(type: DiagramType, content: string) {
    this.ensureInitialized();
    return visualizationManager.generateMermaidDiagram(type, content);
  }

  /**
   * Generate a knowledge graph visualization
   * @param knowledgeIds Array of knowledge IDs to include in the graph
   * @param depth Depth of relationships to include (default: 1)
   */
  public generateKnowledgeGraph(knowledgeIds: string[], depth?: number) {
    this.ensureInitialized();
    return visualizationManager.generateKnowledgeGraph(knowledgeIds, depth);
  }

  /**
   * Generate a pattern relationship visualization
   * @param patternIds Array of pattern IDs to include in the visualization
   */
  public generatePatternRelationships(patternIds: string[]) {
    this.ensureInitialized();
    return visualizationManager.generatePatternRelationships(patternIds);
  }

  /**
   * Generate a memory timeline visualization
   * @param memoryIds Array of memory IDs to include in the timeline
   */
  public generateMemoryTimeline(memoryIds: string[]) {
    this.ensureInitialized();
    return visualizationManager.generateMemoryTimeline(memoryIds);
  }

  /**
   * Generate a memory bank structure visualization
   */
  public generateMemoryBankStructure() {
    this.ensureInitialized();
    return visualizationManager.generateMemoryBankStructure();
  }

  // Project Manager methods

  /**
   * Create a new project
   * @param project Project to create (without id, createdAt, updatedAt)
   * @returns Project ID
   */
  public async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    return projectManager.createProject(project);
  }

  /**
   * Get a project by ID
   * @param id Project ID
   * @returns Project
   */
  public async getProjectById(id: string) {
    this.ensureInitialized();
    return projectManager.getProjectById(id);
  }

  /**
   * Update a project
   * @param id Project ID
   * @param updates Project updates
   */
  public async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) {
    this.ensureInitialized();
    return projectManager.updateProject(id, updates);
  }

  /**
   * Delete a project
   * @param id Project ID
   */
  public async deleteProject(id: string) {
    this.ensureInitialized();
    return projectManager.deleteProject(id);
  }

  /**
   * Search for projects
   * @param query Search query
   * @param options Search options
   * @returns Project results
   */
  public async searchProjects(query: string, options?: ProjectSearchOptions) {
    this.ensureInitialized();
    return projectManager.searchProjects(query, options);
  }

  /**
   * Add a requirement to a project
   * @param projectId Project ID
   * @param requirement Requirement to add (without id)
   * @returns Requirement ID
   */
  public async addRequirement(projectId: string, requirement: Omit<Requirement, 'id'>) {
    this.ensureInitialized();
    return projectManager.addRequirement(projectId, requirement);
  }

  /**
   * Create a knowledge-project link
   * @param link Knowledge-project link to create (without id, createdAt, updatedAt)
   * @returns Link ID
   */
  public async createKnowledgeProjectLink(link: Omit<KnowledgeProjectLink, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    return projectManager.createKnowledgeProjectLink(link);
  }

  // Knowledge-Project Integration Manager methods

  /**
   * Create a project context with relevant knowledge items
   * @param params Parameters for creating a project context
   * @returns Project context
   */
  public async createProjectContext(params: CreateProjectContextParams): Promise<ProjectContext> {
    this.ensureInitialized();
    return knowledgeProjectIntegrationManager.createProjectContext(params);
  }

  /**
   * Retrieve knowledge items relevant to a query
   * @param params Parameters for retrieving knowledge
   * @returns Knowledge retrieval result
   */
  public async retrieveProjectKnowledge(params: RetrieveKnowledgeParams): Promise<KnowledgeRetrievalResult> {
    this.ensureInitialized();
    return knowledgeProjectIntegrationManager.retrieveKnowledge(params);
  }

  /**
   * Link a knowledge item to a project element
   * @param params Parameters for linking knowledge to a project element
   * @returns Knowledge-project link
   */
  public async linkKnowledgeToProject(params: LinkKnowledgeParams): Promise<KnowledgeProjectIntegrationLink> {
    this.ensureInitialized();
    return knowledgeProjectIntegrationManager.linkKnowledgeToProject(params);
  }

  /**
   * Create a project decision with knowledge references
   * @param params Parameters for creating a project decision
   * @returns Project decision
   */
  public async createProjectDecision(params: CreateDecisionParams): Promise<ProjectDecision> {
    this.ensureInitialized();
    return knowledgeProjectIntegrationManager.createDecision(params);
  }

  /**
   * Generate an implementation plan based on project requirements and knowledge
   * @param params Parameters for generating an implementation plan
   * @returns Implementation plan
   */
  public async generateImplementationPlan(params: GenerateImplementationPlanParams): Promise<ImplementationPlan> {
    this.ensureInitialized();
    return knowledgeProjectIntegrationManager.generateImplementationPlan(params);
  }

  // Code Generation Manager methods

  /**
   * Create a new code template
   * @param template Template to create (without id, createdAt, updatedAt)
   * @returns Template ID
   */
  public async createCodeTemplate(template: Omit<CodeTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    // In a real implementation, this would call a method on codeGenerationManager
    // For now, we'll just return a mock ID
    return `template-${Date.now()}`;
  }

  /**
   * Get a code template by ID
   * @param id Template ID
   * @returns Code template
   */
  public async getCodeTemplateById(id: string) {
    this.ensureInitialized();
    // In a real implementation, this would call a method on codeGenerationManager
    // For now, we'll just return a mock template
    return {
      id,
      name: 'Mock Template',
      description: 'A mock template for demonstration',
      type: CodeTemplateType.COMPONENT,
      language: ProgrammingLanguage.TYPESCRIPT,
      framework: 'React',
      content: '// Mock template content',
      variables: [],
      examples: [],
      metadata: {
        tags: ['mock'],
        patternTypes: [],
        componentTypes: [],
        complexity: ComplexityLevel.SIMPLE,
        usageCount: 0,
        rating: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as CodeTemplate;
  }

  /**
   * Update a code template
   * @param id Template ID
   * @param updates Template updates
   */
  public async updateCodeTemplate(id: string, updates: Partial<Omit<CodeTemplate, 'id' | 'createdAt' | 'updatedAt'>>) {
    this.ensureInitialized();
    // In a real implementation, this would call a method on codeGenerationManager
    // For now, we'll just return success
    return true;
  }

  /**
   * Delete a code template
   * @param id Template ID
   */
  public async deleteCodeTemplate(id: string) {
    this.ensureInitialized();
    // In a real implementation, this would call a method on codeGenerationManager
    // For now, we'll just return success
    return true;
  }

  /**
   * Search for code templates
   * @param query Search query
   * @param options Search options
   * @returns Code template results
   */
  public async searchCodeTemplates(query: string, options?: CodeTemplateSearchOptions) {
    this.ensureInitialized();
    // In a real implementation, this would call a method on codeGenerationManager
    // For now, we'll just return an empty array of CodeTemplateResult
    return {
      template: {
        id: 'mock-template',
        name: 'Mock Template',
        description: 'A mock template for demonstration',
        type: CodeTemplateType.COMPONENT,
        language: ProgrammingLanguage.TYPESCRIPT,
        framework: 'React',
        content: '// Mock template content',
        variables: [],
        examples: [],
        metadata: {
          tags: ['mock'],
          patternTypes: [],
          componentTypes: [],
          complexity: ComplexityLevel.SIMPLE,
          usageCount: 0,
          rating: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      score: 1.0
    } as CodeTemplateResult;
  }

  /**
   * Create a code generation request
   * @param request Code generation request (without id, createdAt, updatedAt)
   * @returns Request ID
   */
  public async createCodeGenerationRequest(request: Omit<CodeGenerationRequest, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    // In a real implementation, this would call a method on codeGenerationManager
    // For now, we'll just return a mock ID
    return `request-${Date.now()}`;
  }

  /**
   * Create a code optimization request
   * @param request Code optimization request (without id, createdAt, updatedAt)
   * @returns Request ID
   */
  public async createCodeOptimizationRequest(request: Omit<CodeOptimizationRequest, 'id' | 'createdAt' | 'updatedAt'>) {
    this.ensureInitialized();
    // In a real implementation, this would call a method on codeGenerationManager
    // For now, we'll just return a mock ID
    return `optimization-${Date.now()}`;
  }

  /**
   * Ensure that CognitiveTools is initialized
   * @private
   */
  private ensureInitialized() {
    if (!this.initialized) {
      throw new CognitiveToolsError(
        ErrorCode.INTERNAL_ERROR,
        'CognitiveTools is not initialized. Call initialize() first.'
      );
    }
  }
}

/**
 * Export a default instance
 */
export const cognitiveTools = CognitiveTools.getInstance();

/**
 * Re-export types and utilities
 */
export * from './types';
export * from './config';
export { logger } from './utils/logger';

// Re-export managers for direct access if needed
export { knowledgeManager } from './managers/knowledge-manager';
export { memoryManager } from './managers/memory-manager';
export { patternManager } from './managers/pattern-manager';
export { visualizationManager } from './managers/visualization-manager';
export { projectManager } from './managers/project-manager';
export { knowledgeProjectIntegrationManager } from './managers/knowledge-project-integration-manager';
export { CodeGenerationManager, codeGenerationManager };
export { contextManager } from './managers/context-manager';
export { contextIntegration } from './managers/context-integration';
export * from './utils/context-utils';
