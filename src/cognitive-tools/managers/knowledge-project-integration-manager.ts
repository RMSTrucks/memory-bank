/**
 * Knowledge-Project Integration Manager
 *
 * This manager provides functionality for integrating knowledge with project management.
 * It enables connecting project requirements to implementation knowledge, pattern-based
 * implementation planning, and knowledge retrieval for implementation decisions.
 */

import { v4 as uuidv4 } from 'uuid';
import { knowledgeManager } from './knowledge-manager';
import { projectManager } from './project-manager';
import { PatternManager } from './pattern-manager';
import { TemplateManager } from './template-manager';
import { Logger } from '../utils/logger';

import {
  KnowledgeItem,
  KnowledgeItemType,
  KnowledgeProjectLink,
  ProjectElementType,
  KnowledgeProjectLinkType,
  ProjectContext,
  ProjectContextStatus,
  ContextChange,
  ContextChangeType,
  ContextComponentType,
  ProjectRequirementContext,
  ProjectArchitectureContext,
  ProjectImplementationContext,
  ProjectDecisionContext,
  CreateProjectContextParams,
  RetrieveKnowledgeParams,
  KnowledgeRetrievalResult,
  LinkKnowledgeParams,
  ProjectDecision,
  DecisionStatus,
  CreateDecisionParams,
  ImplementationPlan,
  GenerateImplementationPlanParams,
  OptimizationCriteria
} from '../types/knowledge-project-integration';

import {
  Project,
  Requirement,
  ArchitectureComponent,
  ImplementationComponent,
  TestComponent,
  DeploymentComponent,
  RequirementType,
  RequirementPriority,
  RequirementStatus,
  ArchitectureComponentType,
  ImplementationComponentType,
  ImplementationStatus,
  TestType,
  TestStatus,
  DeploymentType,
  DeploymentStatus,
  DeploymentEnvironment
} from '../types/project';

import {
  Knowledge,
  KnowledgeType,
  KnowledgeResult,
  ImportanceLevel
} from '../types';

/**
 * Manager for integrating knowledge with project management
 */
export class KnowledgeProjectIntegrationManager {
  private patternManager: PatternManager;
  private templateManager: TemplateManager;
  private logger: Logger;

  constructor(
    patternManager: PatternManager,
    templateManager: TemplateManager,
    logger: Logger
  ) {
    this.patternManager = patternManager;
    this.templateManager = templateManager;
    this.logger = logger;
  }

  /**
   * Convert Knowledge to KnowledgeItem
   */
  private convertToKnowledgeItem(knowledge: Knowledge): KnowledgeItem {
    return {
      id: knowledge.id,
      type: this.mapKnowledgeType(knowledge.type),
      title: knowledge.metadata.title,
      description: knowledge.metadata.description,
      content: knowledge.content,
      tags: knowledge.metadata.tags,
      relevanceScore: this.importanceLevelToScore(knowledge.metadata.importance),
      source: knowledge.metadata.source,
      createdAt: new Date(knowledge.createdAt),
      updatedAt: new Date(knowledge.updatedAt)
    };
  }

  /**
   * Convert KnowledgeResult to KnowledgeItem
   */
  private convertResultToKnowledgeItem(result: KnowledgeResult): KnowledgeItem {
    const item = this.convertToKnowledgeItem(result.knowledge);
    item.relevanceScore = result.score;
    return item;
  }

  /**
   * Map KnowledgeType to KnowledgeItemType
   */
  private mapKnowledgeType(type: KnowledgeType): KnowledgeItemType {
    switch (type) {
      case KnowledgeType.CONCEPT:
        return KnowledgeItemType.CONCEPT;
      case KnowledgeType.PATTERN:
        return KnowledgeItemType.PATTERN;
      case KnowledgeType.DECISION:
        return KnowledgeItemType.DECISION;
      case KnowledgeType.CODE:
        return KnowledgeItemType.IMPLEMENTATION;
      case KnowledgeType.DOCUMENTATION:
        return KnowledgeItemType.REFERENCE;
      case KnowledgeType.LEARNING:
        return KnowledgeItemType.LESSON_LEARNED;
      default:
        return KnowledgeItemType.CONCEPT;
    }
  }

  /**
   * Map KnowledgeItemType to KnowledgeType
   */
  private mapKnowledgeItemType(type: KnowledgeItemType): KnowledgeType {
    switch (type) {
      case KnowledgeItemType.CONCEPT:
        return KnowledgeType.CONCEPT;
      case KnowledgeItemType.PATTERN:
        return KnowledgeType.PATTERN;
      case KnowledgeItemType.DECISION:
        return KnowledgeType.DECISION;
      case KnowledgeItemType.IMPLEMENTATION:
        return KnowledgeType.CODE;
      case KnowledgeItemType.REFERENCE:
        return KnowledgeType.DOCUMENTATION;
      case KnowledgeItemType.LESSON_LEARNED:
        return KnowledgeType.LEARNING;
      default:
        return KnowledgeType.OTHER;
    }
  }

  /**
   * Convert importance level to score
   */
  private importanceLevelToScore(importance: ImportanceLevel): number {
    switch (importance) {
      case ImportanceLevel.LOW:
        return 0.3;
      case ImportanceLevel.MEDIUM:
        return 0.5;
      case ImportanceLevel.HIGH:
        return 0.8;
      case ImportanceLevel.CRITICAL:
        return 1.0;
      default:
        return 0.5;
    }
  }

  /**
   * Convert score to importance level
   */
  private scoreToImportanceLevel(score: number): ImportanceLevel {
    if (score >= 0.8) {
      return ImportanceLevel.HIGH;
    } else if (score >= 0.5) {
      return ImportanceLevel.MEDIUM;
    } else {
      return ImportanceLevel.LOW;
    }
  }

  /**
   * Create a project context with relevant knowledge items
   */
  async createProjectContext(params: CreateProjectContextParams): Promise<ProjectContext> {
    this.logger.info(`Creating project context for project ${params.projectId}`);

    // Get project details
    const project = await projectManager.getProjectById(params.projectId);
    if (!project) {
      throw new Error(`Project with ID ${params.projectId} not found`);
    }

    // Get existing knowledge links for the project
    const knowledgeLinks = await this.getKnowledgeLinksForProject(params.projectId);

    // Get relevant knowledge items based on project details
    const relevantKnowledge: KnowledgeItem[] = [];

    // Add knowledge items from existing links
    const linkedKnowledgeIds = knowledgeLinks.map(link => link.knowledgeItemId);
    if (linkedKnowledgeIds.length > 0) {
      const linkedKnowledge = await Promise.all(
        linkedKnowledgeIds.map(async id => {
          const knowledge = await knowledgeManager.getKnowledgeById(id);
          return this.convertToKnowledgeItem(knowledge);
        })
      );
      relevantKnowledge.push(...linkedKnowledge);
    }

    // Find additional relevant knowledge based on project details
    const projectKeywords = this.extractKeywordsFromProject(project, {
      includeRequirements: params.includeRequirements ?? true,
      includeComponents: params.includeComponents ?? true,
      includeTasks: params.includeTasks ?? false,
      includeDecisions: params.includeDecisions ?? true
    });

    const additionalKnowledge = await knowledgeManager.searchKnowledge(
      projectKeywords.join(' '),
      {
        limit: params.maxResults ?? 20,
        importance: params.minRelevanceScore ?
          [this.scoreToImportanceLevel(params.minRelevanceScore)] : undefined
      }
    );

    // Filter out knowledge items that are already included
    const existingIds = new Set(relevantKnowledge.map(item => item.id));
    const newKnowledgeItems = additionalKnowledge.map(result =>
      this.convertResultToKnowledgeItem(result)
    ).filter(item => !existingIds.has(item.id));

    relevantKnowledge.push(...newKnowledgeItems);

    // Create context ID
    const contextId = uuidv4();

    // Create initial context
    const now = new Date();
    const context: ProjectContext = {
      id: contextId,
      projectId: params.projectId,
      name: params.name ?? `${project.name} Context`,
      description: params.description ?? `Project context for ${project.name}`,
      version: '0.1.0',
      relevantKnowledge,
      knowledgeLinks,
      requirements: [],
      architecture: [],
      implementation: [],
      decisions: [],
      status: ProjectContextStatus.DRAFT,
      metadata: params.metadata ?? {},
      history: [
        {
          id: uuidv4(),
          timestamp: now,
          type: ContextChangeType.CREATE,
          component: ContextComponentType.CONTEXT,
          itemId: contextId,
          newValue: { projectId: params.projectId },
          userId: 'system'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    // Add requirement contexts if requested
    if (params.includeRequirements && project.requirements.length > 0) {
      context.requirements = project.requirements.map(req => ({
        id: uuidv4(),
        requirementId: req.id,
        relevantKnowledgeIds: this.findRelevantKnowledgeForRequirement(req, relevantKnowledge),
        status: req.status,
        metadata: {}
      }));
    }

    // Add architecture contexts if requested
    if (params.includeComponents && project.architecture.length > 0) {
      context.architecture = project.architecture.map(comp => ({
        id: uuidv4(),
        componentId: comp.id,
        relevantKnowledgeIds: this.findRelevantKnowledgeForComponent(comp, relevantKnowledge),
        status: 'active',
        metadata: {}
      }));
    }

    // Add implementation contexts if project has implementation components
    if (project.implementation && project.implementation.length > 0) {
      context.implementation = project.implementation.map(comp => ({
        id: uuidv4(),
        componentId: comp.id,
        relevantKnowledgeIds: [],
        status: comp.status,
        metadata: {}
      }));
    }

    // Add decision contexts if requested and project has decisions
    if (params.includeDecisions && 'decisions' in project && project.decisions && Array.isArray(project.decisions) && project.decisions.length > 0) {
      context.decisions = project.decisions.map((decision: any) => ({
        id: uuidv4(),
        decisionId: decision.id,
        relevantKnowledgeIds: decision.relatedKnowledgeIds ?? [],
        status: decision.status,
        metadata: {}
      }));
    }

    // Validate the context
    this.validateContext(context);

    // Store the context
    await this.storeProjectContext(context);

    return context;
  }

  /**
   * Find relevant knowledge IDs for a requirement
   */
  private findRelevantKnowledgeForRequirement(
    requirement: Requirement,
    knowledgeItems: KnowledgeItem[]
  ): string[] {
    // This would be implemented to find relevant knowledge for a requirement
    // For now, return an empty array as a placeholder
    return [];
  }

  /**
   * Find relevant knowledge IDs for a component
   */
  private findRelevantKnowledgeForComponent(
    component: ArchitectureComponent,
    knowledgeItems: KnowledgeItem[]
  ): string[] {
    // This would be implemented to find relevant knowledge for a component
    // For now, return an empty array as a placeholder
    return [];
  }

  /**
   * Validate a project context
   */
  private validateContext(context: ProjectContext): void {
    // This would be implemented to validate the context
    // For now, just log it as a placeholder
    this.logger.info(`Validating project context: ${context.id}`);
  }

  /**
   * Store a project context
   */
  private async storeProjectContext(context: ProjectContext): Promise<void> {
    // This would be implemented to store the context in a database
    // For now, just log it as a placeholder
    this.logger.info(`Storing project context: ${context.id}`);
  }

  /**
   * Retrieve knowledge items relevant to a query
   */
  async retrieveKnowledge(params: RetrieveKnowledgeParams): Promise<KnowledgeRetrievalResult> {
    this.logger.info(`Retrieving knowledge for query: ${params.query}`);

    const startTime = Date.now();

    // Map knowledge item types to knowledge types
    const knowledgeTypes = params.knowledgeTypes?.map(type =>
      this.mapKnowledgeItemType(type)
    );

    // Search for knowledge items
    const results = await knowledgeManager.searchKnowledge(
      params.query,
      {
        types: knowledgeTypes,
        tags: params.tags,
        limit: params.maxResults ?? 10,
        importance: params.minRelevanceScore ?
          [this.scoreToImportanceLevel(params.minRelevanceScore)] : undefined
      }
    );

    // Convert results to knowledge items
    const knowledgeItems = results.map(result =>
      this.convertResultToKnowledgeItem(result)
    );

    // If project ID is provided, boost relevance of items linked to the project
    if (params.projectId) {
      const knowledgeLinks = await this.getKnowledgeLinksForProject(params.projectId);
      const linkedKnowledgeIds = new Set(knowledgeLinks.map(link => link.knowledgeItemId));

      // Boost relevance score for linked items
      knowledgeItems.forEach(item => {
        if (linkedKnowledgeIds.has(item.id)) {
          item.relevanceScore = (item.relevanceScore ?? 0.5) * 1.5;
        }
      });

      // Sort by relevance score
      knowledgeItems.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      query: params.query,
      results: knowledgeItems,
      totalResults: knowledgeItems.length,
      executionTimeMs
    };
  }

  /**
   * Link a knowledge item to a project element
   */
  async linkKnowledgeToProject(params: LinkKnowledgeParams): Promise<KnowledgeProjectLink> {
    this.logger.info(`Linking knowledge ${params.knowledgeItemId} to project element ${params.projectElementId}`);

    // Verify that the knowledge item exists
    const knowledge = await knowledgeManager.getKnowledgeById(params.knowledgeItemId);
    if (!knowledge) {
      throw new Error(`Knowledge item with ID ${params.knowledgeItemId} not found`);
    }

    // Verify that the project element exists
    await this.verifyProjectElement(params.projectElementId, params.projectElementType);

    // Create the link
    const link: KnowledgeProjectLink = {
      id: uuidv4(),
      projectElementId: params.projectElementId,
      projectElementType: params.projectElementType,
      knowledgeItemId: params.knowledgeItemId,
      linkType: params.linkType,
      relevanceScore: params.relevanceScore ?? 1.0,
      notes: params.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the link
    await this.storeKnowledgeProjectLink(link);

    return link;
  }

  /**
   * Create a project decision with knowledge references
   */
  async createDecision(params: CreateDecisionParams): Promise<ProjectDecision> {
    this.logger.info(`Creating decision for project ${params.projectId}: ${params.title}`);

    // Verify that the project exists
    const project = await projectManager.getProjectById(params.projectId);
    if (!project) {
      throw new Error(`Project with ID ${params.projectId} not found`);
    }

    // Verify that the related knowledge items exist
    if (params.relatedKnowledgeIds && params.relatedKnowledgeIds.length > 0) {
      const knowledgeItems = await Promise.all(
        params.relatedKnowledgeIds.map(id => knowledgeManager.getKnowledgeById(id))
      );
      if (knowledgeItems.length !== params.relatedKnowledgeIds.length) {
        throw new Error('One or more related knowledge items not found');
      }
    }

    // Create the decision
    const decision: ProjectDecision = {
      id: uuidv4(),
      projectId: params.projectId,
      title: params.title,
      description: params.description,
      context: params.context,
      decision: params.decision,
      rationale: params.rationale,
      alternatives: params.alternatives ?? [],
      consequences: params.consequences ?? '',
      relatedKnowledgeIds: params.relatedKnowledgeIds ?? [],
      status: params.status ?? DecisionStatus.PROPOSED,
      createdBy: params.createdBy ?? 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the decision
    await this.storeProjectDecision(decision);

    // Create links to related knowledge items
    if (decision.relatedKnowledgeIds.length > 0) {
      await Promise.all(decision.relatedKnowledgeIds.map(knowledgeId =>
        this.linkKnowledgeToProject({
          projectElementId: decision.id,
          projectElementType: ProjectElementType.DECISION,
          knowledgeItemId: knowledgeId,
          linkType: KnowledgeProjectLinkType.REFERENCES
        })
      ));
    }

    return decision;
  }

  /**
   * Generate an implementation plan based on project requirements and knowledge
   */
  async generateImplementationPlan(params: GenerateImplementationPlanParams): Promise<ImplementationPlan> {
    this.logger.info(`Generating implementation plan for project ${params.projectId}: ${params.title}`);

    // Get project details
    const project = await projectManager.getProjectById(params.projectId);
    if (!project) {
      throw new Error(`Project with ID ${params.projectId} not found`);
    }

    // Get requirements
    let requirements: Requirement[] = [];
    if (params.requirementIds && params.requirementIds.length > 0) {
      // Get specific requirements from project
      requirements = project.requirements.filter(req =>
        params.requirementIds!.includes(req.id)
      );
    } else {
      // Get all project requirements
      requirements = project.requirements;
    }

    if (requirements.length === 0) {
      throw new Error('No requirements found for implementation plan');
    }

    // Generate architecture components based on requirements
    const architectureComponents = await this.generateArchitectureComponents(
      project.id,
      requirements,
      params.usePatterns ?? true,
      params.optimizeFor ?? [OptimizationCriteria.MAINTAINABILITY]
    );

    // Generate implementation components based on architecture
    const implementationComponents = await this.generateImplementationComponents(
      project.id,
      architectureComponents,
      requirements,
      params.usePatterns ?? true,
      params.optimizeFor ?? [OptimizationCriteria.MAINTAINABILITY]
    );

    // Generate test components
    const testComponents = await this.generateTestComponents(
      project.id,
      implementationComponents,
      requirements
    );

    // Generate deployment components
    const deploymentComponents = await this.generateDeploymentComponents(
      project.id,
      implementationComponents
    );

    // Get knowledge references
    const knowledgeLinks = await this.getKnowledgeLinksForProject(project.id);

    // Create the implementation plan
    const implementationPlan: ImplementationPlan = {
      id: uuidv4(),
      projectId: project.id,
      title: params.title,
      description: params.description ?? `Implementation plan for ${project.name}`,
      requirements,
      architectureComponents,
      implementationComponents,
      testComponents,
      deploymentComponents,
      knowledgeReferences: knowledgeLinks,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the implementation plan
    await this.storeImplementationPlan(implementationPlan);

    return implementationPlan;
  }

  /**
   * Get knowledge links for a project
   */
  private async getKnowledgeLinksForProject(projectId: string): Promise<KnowledgeProjectLink[]> {
    // This would be implemented to retrieve links from a database
    // For now, return an empty array as a placeholder
    return [];
  }

  /**
   * Extract keywords from a project for knowledge search
   */
  private extractKeywordsFromProject(
    project: Project,
    options: {
      includeRequirements: boolean;
      includeComponents: boolean;
      includeTasks: boolean;
      includeDecisions: boolean;
    }
  ): string[] {
    const keywords: string[] = [];

    // Add project keywords
    keywords.push(project.name);
    keywords.push(...project.description.split(' '));
    keywords.push(...project.metadata.tags);

    // Add requirement keywords
    if (options.includeRequirements && project.requirements.length > 0) {
      project.requirements.forEach(req => {
        keywords.push(req.title);
        keywords.push(...req.description.split(' '));
      });
    }

    // Add architecture component keywords
    if (options.includeComponents && project.architecture.length > 0) {
      project.architecture.forEach(component => {
        keywords.push(component.name);
        keywords.push(...component.description.split(' '));
        if (component.patterns) {
          keywords.push(...component.patterns);
        }
        if (component.technologies) {
          keywords.push(...component.technologies);
        }
      });
    }

    // Clean and deduplicate keywords
    return [...new Set(
      keywords
        .map(keyword => keyword.toLowerCase())
        .filter(keyword => keyword.length > 3)
        .map(keyword => keyword.replace(/[^\w\s]/g, ''))
    )];
  }

  /**
   * Verify that a project element exists
   */
  private async verifyProjectElement(elementId: string, elementType: ProjectElementType): Promise<void> {
    switch (elementType) {
      case ProjectElementType.PROJECT:
        try {
          await projectManager.getProjectById(elementId);
        } catch (error) {
          throw new Error(`Project with ID ${elementId} not found`);
        }
        break;
      case ProjectElementType.REQUIREMENT:
        // Check if any project has this requirement
        const projects = await this.getAllProjects();
        const requirementExists = projects.some(project =>
          project.requirements.some(req => req.id === elementId)
        );
        if (!requirementExists) {
          throw new Error(`Requirement with ID ${elementId} not found`);
        }
        break;
      case ProjectElementType.COMPONENT:
        // This would check for architecture or implementation components
        // For now, just return as a placeholder
        break;
      case ProjectElementType.TASK:
        // This would check for tasks
        // For now, just return as a placeholder
        break;
      case ProjectElementType.DECISION:
        // This would check for decisions
        // For now, just return as a placeholder
        break;
      default:
        throw new Error(`Unknown project element type: ${elementType}`);
    }
  }

  /**
   * Get all projects
   * Helper method for verification
   */
  private async getAllProjects(): Promise<Project[]> {
    // This would be implemented to get all projects
    // For now, return an empty array as a placeholder
    return [];
  }

  /**
   * Store a knowledge-project link
   */
  private async storeKnowledgeProjectLink(link: KnowledgeProjectLink): Promise<void> {
    // This would be implemented to store the link in a database
    // For now, just log it as a placeholder
    this.logger.info(`Storing knowledge-project link: ${JSON.stringify(link)}`);
  }

  /**
   * Store a project decision
   */
  private async storeProjectDecision(decision: ProjectDecision): Promise<void> {
    // This would be implemented to store the decision in a database
    // For now, just log it as a placeholder
    this.logger.info(`Storing project decision: ${JSON.stringify(decision)}`);
  }

  /**
   * Store an implementation plan
   */
  private async storeImplementationPlan(plan: ImplementationPlan): Promise<void> {
    // This would be implemented to store the plan in a database
    // For now, just log it as a placeholder
    this.logger.info(`Storing implementation plan: ${JSON.stringify(plan)}`);
  }

  /**
   * Generate architecture components based on requirements
   */
  private async generateArchitectureComponents(
    projectId: string,
    requirements: Requirement[],
    usePatterns: boolean,
    optimizationCriteria: OptimizationCriteria[]
  ): Promise<ArchitectureComponent[]> {
    // This would be implemented to generate architecture components
    // For now, return a placeholder component
    return [
      {
        id: uuidv4(),
        name: 'Core Application',
        description: 'Main application component',
        type: ArchitectureComponentType.BACKEND,
        dependencies: [],
        patterns: usePatterns ? ['Repository', 'Dependency Injection'] : [],
        technologies: ['TypeScript', 'Node.js'],
        relatedKnowledgeIds: []
      }
    ];
  }

  /**
   * Generate implementation components based on architecture
   */
  private async generateImplementationComponents(
    projectId: string,
    architectureComponents: ArchitectureComponent[],
    requirements: Requirement[],
    usePatterns: boolean,
    optimizationCriteria: OptimizationCriteria[]
  ): Promise<ImplementationComponent[]> {
    // This would be implemented to generate implementation components
    // For now, return a placeholder component
    return [
      {
        id: uuidv4(),
        name: 'Core Service',
        description: 'Main service implementation',
        type: ImplementationComponentType.SERVICE,
        status: ImplementationStatus.NOT_STARTED,
        dependencies: [],
        files: [
          {
            path: 'src/services/core.service.ts',
            description: 'Core service implementation',
            language: 'TypeScript',
            status: ImplementationStatus.NOT_STARTED
          }
        ],
        relatedRequirements: requirements.map(req => req.id),
        relatedArchitectureComponents: architectureComponents.map(comp => comp.id),
        relatedKnowledgeIds: []
      }
    ];
  }

  /**
   * Generate test components
   */
  private async generateTestComponents(
    projectId: string,
    implementationComponents: ImplementationComponent[],
    requirements: Requirement[]
  ): Promise<TestComponent[]> {
    // This would be implemented to generate test components
    // For now, return a placeholder component
    return [
      {
        id: uuidv4(),
        name: 'Core Service Tests',
        description: 'Tests for core service',
        type: TestType.UNIT,
        status: TestStatus.NOT_STARTED,
        coverage: 0,
        testCases: [
          {
            id: uuidv4(),
            name: 'Should initialize correctly',
            description: 'Test that the service initializes correctly',
            steps: ['Create service instance', 'Check initial state'],
            expectedResult: 'Service is initialized with default state',
            status: TestStatus.NOT_STARTED
          }
        ],
        relatedImplementationComponents: implementationComponents.map(comp => comp.id),
        relatedKnowledgeIds: []
      }
    ];
  }

  /**
   * Generate deployment components
   */
  private async generateDeploymentComponents(
    projectId: string,
    implementationComponents: ImplementationComponent[]
  ): Promise<DeploymentComponent[]> {
    // This would be implemented to generate deployment components
    // For now, return a placeholder component
    return [
      {
        id: uuidv4(),
        name: 'Development Environment',
        description: 'Local development environment',
        type: DeploymentType.SERVER,
        status: DeploymentStatus.NOT_STARTED,
        environment: DeploymentEnvironment.DEVELOPMENT,
        configuration: {
          'PORT': '3000',
          'NODE_ENV': 'development'
        },
        dependencies: [],
        relatedImplementationComponents: implementationComponents.map(comp => comp.id),
        relatedKnowledgeIds: []
      }
    ];
  }
}

// Export a default instance
export const knowledgeProjectIntegrationManager = new KnowledgeProjectIntegrationManager(
  // These would be the actual instances in a real implementation
  {} as PatternManager,
  {} as TemplateManager,
  console as unknown as Logger
);
