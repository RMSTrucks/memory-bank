/**
 * Context Manager
 *
 * This manager provides functionality for working with project contexts, including
 * creating, retrieving, updating, and validating contexts.
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import {
  serializeContext,
  deserializeContext,
  validateContext,
  compareContexts,
  updateContext,
  extractKeywords
} from '../utils/context-utils';

import {
  ProjectContext,
  ProjectContextStatus,
  ContextChange,
  ContextChangeType,
  ContextComponentType,
  CreateProjectContextParams,
  UpdateProjectContextParams,
  ContextValidationResult,
  ProjectRequirementContext,
  ProjectArchitectureContext,
  ProjectImplementationContext,
  ProjectDecisionContext
} from '../types/knowledge-project-integration';

/**
 * Manager for working with project contexts
 */
export class ContextManager {
  private logger: Logger;
  private contexts: Map<string, ProjectContext> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Create a new project context
   */
  async createContext(params: CreateProjectContextParams): Promise<ProjectContext> {
    this.logger.info(`Creating context for project ${params.projectId}`);

    // Generate a new context ID
    const contextId = uuidv4();
    const now = new Date();

    // Create the initial context
    const context: ProjectContext = {
      id: contextId,
      projectId: params.projectId,
      name: params.name ?? `Project Context ${params.projectId}`,
      description: params.description ?? `Context for project ${params.projectId}`,
      version: '0.1.0',
      relevantKnowledge: [],
      knowledgeLinks: [],
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

    // Validate the context
    const validationResult = validateContext(context);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Store the context
    this.contexts.set(contextId, context);

    // In a real implementation, this would persist the context to a database
    this.logger.info(`Created context ${contextId} for project ${params.projectId}`);

    return context;
  }

  /**
   * Get a context by ID
   */
  async getContext(contextId: string): Promise<ProjectContext> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context with ID ${contextId} not found`);
    }
    return context;
  }

  /**
   * Get all contexts for a project
   */
  async getContextsForProject(projectId: string): Promise<ProjectContext[]> {
    return Array.from(this.contexts.values())
      .filter(context => context.projectId === projectId);
  }

  /**
   * Update a context
   */
  async updateContext(params: UpdateProjectContextParams): Promise<ProjectContext> {
    this.logger.info(`Updating context ${params.contextId}`);

    // Get the existing context
    const context = await this.getContext(params.contextId);

    // Create changes based on the update params
    const changes: ContextChange[] = [];

    if (params.name && params.name !== context.name) {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.UPDATE,
        component: ContextComponentType.CONTEXT,
        itemId: context.id,
        previousValue: { name: context.name },
        newValue: { name: params.name },
        reason: params.reason,
        userId: params.userId
      });
    }

    if (params.description && params.description !== context.description) {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.UPDATE,
        component: ContextComponentType.CONTEXT,
        itemId: context.id,
        previousValue: { description: context.description },
        newValue: { description: params.description },
        reason: params.reason,
        userId: params.userId
      });
    }

    if (params.version && params.version !== context.version) {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.UPDATE,
        component: ContextComponentType.CONTEXT,
        itemId: context.id,
        previousValue: { version: context.version },
        newValue: { version: params.version },
        reason: params.reason,
        userId: params.userId
      });
    }

    if (params.status && params.status !== context.status) {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.UPDATE,
        component: ContextComponentType.CONTEXT,
        itemId: context.id,
        previousValue: { status: context.status },
        newValue: { status: params.status },
        reason: params.reason,
        userId: params.userId
      });
    }

    if (params.metadata) {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.UPDATE,
        component: ContextComponentType.CONTEXT,
        itemId: context.id,
        previousValue: { metadata: context.metadata },
        newValue: { metadata: { ...context.metadata, ...params.metadata } },
        reason: params.reason,
        userId: params.userId
      });
    }

    // If there are no changes, return the original context
    if (changes.length === 0) {
      return context;
    }

    // Apply the changes
    const updatedContext = updateContext(context, changes);

    // Validate the updated context
    const validationResult = validateContext(updatedContext);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context after update: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Store the updated context
    this.contexts.set(updatedContext.id, updatedContext);

    // In a real implementation, this would persist the context to a database
    this.logger.info(`Updated context ${updatedContext.id}`);

    return updatedContext;
  }

  /**
   * Add a requirement to a context
   */
  async addRequirement(contextId: string, requirement: ProjectRequirementContext): Promise<ProjectContext> {
    this.logger.info(`Adding requirement to context ${contextId}`);

    // Get the existing context
    const context = await this.getContext(contextId);

    // Create a change to add the requirement
    const changes: ContextChange[] = [
      {
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.CREATE,
        component: ContextComponentType.REQUIREMENT,
        itemId: requirement.id,
        newValue: requirement,
        userId: 'system'
      }
    ];

    // Apply the changes
    const updatedContext = updateContext(context, changes);

    // Validate the updated context
    const validationResult = validateContext(updatedContext);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context after adding requirement: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Store the updated context
    this.contexts.set(updatedContext.id, updatedContext);

    // In a real implementation, this would persist the context to a database
    this.logger.info(`Added requirement ${requirement.id} to context ${contextId}`);

    return updatedContext;
  }

  /**
   * Add an architecture component to a context
   */
  async addArchitectureComponent(contextId: string, component: ProjectArchitectureContext): Promise<ProjectContext> {
    this.logger.info(`Adding architecture component to context ${contextId}`);

    // Get the existing context
    const context = await this.getContext(contextId);

    // Create a change to add the component
    const changes: ContextChange[] = [
      {
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.CREATE,
        component: ContextComponentType.ARCHITECTURE,
        itemId: component.id,
        newValue: component,
        userId: 'system'
      }
    ];

    // Apply the changes
    const updatedContext = updateContext(context, changes);

    // Validate the updated context
    const validationResult = validateContext(updatedContext);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context after adding architecture component: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Store the updated context
    this.contexts.set(updatedContext.id, updatedContext);

    // In a real implementation, this would persist the context to a database
    this.logger.info(`Added architecture component ${component.id} to context ${contextId}`);

    return updatedContext;
  }

  /**
   * Add an implementation component to a context
   */
  async addImplementationComponent(contextId: string, component: ProjectImplementationContext): Promise<ProjectContext> {
    this.logger.info(`Adding implementation component to context ${contextId}`);

    // Get the existing context
    const context = await this.getContext(contextId);

    // Create a change to add the component
    const changes: ContextChange[] = [
      {
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.CREATE,
        component: ContextComponentType.IMPLEMENTATION,
        itemId: component.id,
        newValue: component,
        userId: 'system'
      }
    ];

    // Apply the changes
    const updatedContext = updateContext(context, changes);

    // Validate the updated context
    const validationResult = validateContext(updatedContext);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context after adding implementation component: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Store the updated context
    this.contexts.set(updatedContext.id, updatedContext);

    // In a real implementation, this would persist the context to a database
    this.logger.info(`Added implementation component ${component.id} to context ${contextId}`);

    return updatedContext;
  }

  /**
   * Add a decision to a context
   */
  async addDecision(contextId: string, decision: ProjectDecisionContext): Promise<ProjectContext> {
    this.logger.info(`Adding decision to context ${contextId}`);

    // Get the existing context
    const context = await this.getContext(contextId);

    // Create a change to add the decision
    const changes: ContextChange[] = [
      {
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.CREATE,
        component: ContextComponentType.DECISION,
        itemId: decision.id,
        newValue: decision,
        userId: 'system'
      }
    ];

    // Apply the changes
    const updatedContext = updateContext(context, changes);

    // Validate the updated context
    const validationResult = validateContext(updatedContext);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context after adding decision: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Store the updated context
    this.contexts.set(updatedContext.id, updatedContext);

    // In a real implementation, this would persist the context to a database
    this.logger.info(`Added decision ${decision.id} to context ${contextId}`);

    return updatedContext;
  }

  /**
   * Remove a requirement from a context
   */
  async removeRequirement(contextId: string, requirementId: string): Promise<ProjectContext> {
    this.logger.info(`Removing requirement ${requirementId} from context ${contextId}`);

    // Get the existing context
    const context = await this.getContext(contextId);

    // Find the requirement
    const requirement = context.requirements.find(r => r.id === requirementId);
    if (!requirement) {
      throw new Error(`Requirement with ID ${requirementId} not found in context ${contextId}`);
    }

    // Create a change to remove the requirement
    const changes: ContextChange[] = [
      {
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.DELETE,
        component: ContextComponentType.REQUIREMENT,
        itemId: requirementId,
        previousValue: requirement,
        userId: 'system'
      }
    ];

    // Apply the changes
    const updatedContext = updateContext(context, changes);

    // Validate the updated context
    const validationResult = validateContext(updatedContext);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context after removing requirement: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Store the updated context
    this.contexts.set(updatedContext.id, updatedContext);

    // In a real implementation, this would persist the context to a database
    this.logger.info(`Removed requirement ${requirementId} from context ${contextId}`);

    return updatedContext;
  }

  /**
   * Compare two contexts and generate a list of changes
   */
  async compareContexts(contextId1: string, contextId2: string): Promise<ContextChange[]> {
    this.logger.info(`Comparing contexts ${contextId1} and ${contextId2}`);

    // Get the contexts
    const context1 = await this.getContext(contextId1);
    const context2 = await this.getContext(contextId2);

    // Compare the contexts
    return compareContexts(context1, context2);
  }

  /**
   * Validate a context
   */
  async validateContext(contextId: string): Promise<ContextValidationResult> {
    this.logger.info(`Validating context ${contextId}`);

    // Get the context
    const context = await this.getContext(contextId);

    // Validate the context
    return validateContext(context);
  }

  /**
   * Serialize a context to a string
   */
  async serializeContext(contextId: string, format: 'json' | 'yaml' = 'json', includeHistory: boolean = true): Promise<string> {
    this.logger.info(`Serializing context ${contextId}`);

    // Get the context
    const context = await this.getContext(contextId);

    // Serialize the context
    return serializeContext({
      context,
      format,
      includeHistory,
      prettyPrint: true
    });
  }

  /**
   * Extract keywords from a context
   */
  async extractKeywords(contextId: string): Promise<string[]> {
    this.logger.info(`Extracting keywords from context ${contextId}`);

    // Get the context
    const context = await this.getContext(contextId);

    // Extract keywords
    return extractKeywords(context);
  }
}

// Export a default instance
export const contextManager = new ContextManager(console as unknown as Logger);
