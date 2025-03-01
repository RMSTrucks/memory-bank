/**
 * Context Integration
 *
 * This file provides integration between the context manager and the knowledge-project-integration-manager.
 * It enables using the enhanced project context model with the existing knowledge-project-integration system.
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { contextManager } from './context-manager';
import { knowledgeProjectIntegrationManager } from './knowledge-project-integration-manager';

import {
  ProjectContext,
  ProjectContextStatus,
  ContextChangeType,
  ContextComponentType,
  CreateProjectContextParams,
  UpdateProjectContextParams,
  KnowledgeItem,
  ProjectRequirementContext,
  ProjectArchitectureContext,
  ProjectImplementationContext,
  ProjectDecisionContext
} from '../types/knowledge-project-integration';

/**
 * Integration between context manager and knowledge-project-integration-manager
 */
export class ContextIntegration {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Create a project context from a knowledge-project-integration context
   */
  async createContextFromKnowledgeProject(params: CreateProjectContextParams): Promise<ProjectContext> {
    this.logger.info(`Creating context from knowledge project ${params.projectId}`);

    // Create a context using the knowledge-project-integration-manager
    const kpiContext = await knowledgeProjectIntegrationManager.createProjectContext(params);

    // Convert the knowledge-project-integration context to an enhanced context
    const context = await this.convertKpiContextToContext(kpiContext);

    // Store the enhanced context
    return await contextManager.createContext({
      projectId: params.projectId,
      name: params.name ?? context.name,
      description: params.description ?? context.description,
      metadata: params.metadata ?? context.metadata
    });
  }

  /**
   * Convert a knowledge-project-integration context to an enhanced context
   */
  private async convertKpiContextToContext(kpiContext: any): Promise<ProjectContext> {
    this.logger.info(`Converting knowledge project context to enhanced context`);

    // Generate a new context ID
    const contextId = uuidv4();
    const now = new Date();

    // Create the initial context
    const context: ProjectContext = {
      id: contextId,
      projectId: kpiContext.projectId,
      name: `Context for project ${kpiContext.projectId}`,
      description: `Enhanced context for project ${kpiContext.projectId}`,
      version: '0.1.0',
      relevantKnowledge: kpiContext.relevantKnowledge ?? [],
      knowledgeLinks: kpiContext.knowledgeLinks ?? [],
      requirements: [],
      architecture: [],
      implementation: [],
      decisions: [],
      status: ProjectContextStatus.DRAFT,
      metadata: {},
      history: [
        {
          id: uuidv4(),
          timestamp: now,
          type: ContextChangeType.CREATE,
          component: ContextComponentType.CONTEXT,
          itemId: contextId,
          newValue: { projectId: kpiContext.projectId },
          userId: 'system'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    return context;
  }

  /**
   * Sync a project context with a knowledge-project-integration context
   */
  async syncContextWithKnowledgeProject(contextId: string, projectId: string): Promise<ProjectContext> {
    this.logger.info(`Syncing context ${contextId} with knowledge project ${projectId}`);

    // Get the enhanced context
    const context = await contextManager.getContext(contextId);

    // Get the knowledge-project-integration context
    const kpiContext = await knowledgeProjectIntegrationManager.createProjectContext({
      projectId,
      includeRequirements: true,
      includeComponents: true,
      includeTasks: true,
      includeDecisions: true
    });

    // Update the enhanced context with the knowledge-project-integration context
    const updatedContext = await this.updateContextFromKpiContext(context, kpiContext);

    return updatedContext;
  }

  /**
   * Update an enhanced context from a knowledge-project-integration context
   */
  private async updateContextFromKpiContext(context: ProjectContext, kpiContext: any): Promise<ProjectContext> {
    this.logger.info(`Updating context ${context.id} from knowledge project context`);

    // Create changes based on the knowledge-project-integration context
    const changes = [];

    // Update relevant knowledge
    if (kpiContext.relevantKnowledge && kpiContext.relevantKnowledge.length > 0) {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.UPDATE,
        component: ContextComponentType.CONTEXT,
        itemId: context.id,
        previousValue: { relevantKnowledge: context.relevantKnowledge },
        newValue: { relevantKnowledge: kpiContext.relevantKnowledge },
        userId: 'system'
      });
    }

    // Update knowledge links
    if (kpiContext.knowledgeLinks && kpiContext.knowledgeLinks.length > 0) {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.UPDATE,
        component: ContextComponentType.CONTEXT,
        itemId: context.id,
        previousValue: { knowledgeLinks: context.knowledgeLinks },
        newValue: { knowledgeLinks: kpiContext.knowledgeLinks },
        userId: 'system'
      });
    }

    // If there are no changes, return the original context
    if (changes.length === 0) {
      return context;
    }

    // Update the context with the changes
    const updatedContext = await contextManager.updateContext({
      contextId: context.id,
      metadata: {
        lastSyncedWithKnowledgeProject: new Date().toISOString()
      }
    });

    return updatedContext;
  }

  /**
   * Create a knowledge-project-integration context from an enhanced context
   */
  async createKnowledgeProjectFromContext(contextId: string): Promise<any> {
    this.logger.info(`Creating knowledge project from context ${contextId}`);

    // Get the enhanced context
    const context = await contextManager.getContext(contextId);

    // Convert the enhanced context to a knowledge-project-integration context
    const kpiContext = await this.convertContextToKpiContext(context);

    // Store the knowledge-project-integration context
    // This would be implemented to store the context in the knowledge-project-integration system
    // For now, just return the converted context
    return kpiContext;
  }

  /**
   * Convert an enhanced context to a knowledge-project-integration context
   */
  private async convertContextToKpiContext(context: ProjectContext): Promise<any> {
    this.logger.info(`Converting enhanced context ${context.id} to knowledge project context`);

    // Create a knowledge-project-integration context
    const kpiContext = {
      projectId: context.projectId,
      relevantKnowledge: context.relevantKnowledge,
      knowledgeLinks: context.knowledgeLinks,
      generatedAt: new Date()
    };

    return kpiContext;
  }

  /**
   * Get relevant knowledge for a context
   */
  async getRelevantKnowledge(contextId: string, query: string, maxResults: number = 10): Promise<KnowledgeItem[]> {
    this.logger.info(`Getting relevant knowledge for context ${contextId} with query "${query}"`);

    // Get the enhanced context
    const context = await contextManager.getContext(contextId);

    // Extract keywords from the context
    const contextKeywords = await contextManager.extractKeywords(contextId);

    // Combine the query with the context keywords
    const combinedQuery = `${query} ${contextKeywords.join(' ')}`;

    // Get relevant knowledge using the knowledge-project-integration-manager
    const knowledgeResult = await knowledgeProjectIntegrationManager.retrieveKnowledge({
      query: combinedQuery,
      projectId: context.projectId,
      maxResults
    });

    return knowledgeResult.results;
  }

  /**
   * Create a project decision with knowledge references
   */
  async createDecision(contextId: string, title: string, description: string, decision: string, rationale: string): Promise<ProjectDecisionContext> {
    this.logger.info(`Creating decision for context ${contextId}: ${title}`);

    // Get the enhanced context
    const context = await contextManager.getContext(contextId);

    // Get relevant knowledge for the decision
    const relevantKnowledge = await this.getRelevantKnowledge(contextId, `${title} ${description} ${decision} ${rationale}`, 5);
    const relevantKnowledgeIds = relevantKnowledge.map(k => k.id);

    // Create a decision using the knowledge-project-integration-manager
    const kpiDecision = await knowledgeProjectIntegrationManager.createDecision({
      projectId: context.projectId,
      title,
      description,
      context: description,
      decision,
      rationale,
      relatedKnowledgeIds: relevantKnowledgeIds
    });

    // Create a decision context
    const decisionContext: ProjectDecisionContext = {
      id: uuidv4(),
      decisionId: kpiDecision.id,
      relevantKnowledgeIds,
      status: kpiDecision.status,
      metadata: {}
    };

    // Add the decision to the context
    await contextManager.addDecision(contextId, decisionContext);

    return decisionContext;
  }

  /**
   * Generate an implementation plan for a context
   */
  async generateImplementationPlan(contextId: string, title: string, description?: string): Promise<any> {
    this.logger.info(`Generating implementation plan for context ${contextId}: ${title}`);

    // Get the enhanced context
    const context = await contextManager.getContext(contextId);

    // Generate an implementation plan using the knowledge-project-integration-manager
    const implementationPlan = await knowledgeProjectIntegrationManager.generateImplementationPlan({
      projectId: context.projectId,
      title,
      description,
      usePatterns: true
    });

    return implementationPlan;
  }
}

// Export a default instance
export const contextIntegration = new ContextIntegration(console as unknown as Logger);
