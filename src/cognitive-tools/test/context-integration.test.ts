/**
 * Tests for Context Integration
 *
 * This file contains tests for the context integration, including
 * creating, syncing, and converting contexts between the enhanced context model
 * and the knowledge-project-integration system.
 */

import { v4 as uuidv4 } from 'uuid';
import { ContextIntegration } from '../managers/context-integration';
import { contextManager } from '../managers/context-manager';
import { knowledgeProjectIntegrationManager } from '../managers/knowledge-project-integration-manager';
import {
  ProjectContextStatus,
  ContextChangeType,
  ContextComponentType,
  KnowledgeItem,
  ProjectDecisionContext
} from '../types/knowledge-project-integration';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock context manager
jest.mock('../managers/context-manager', () => ({
  contextManager: {
    createContext: jest.fn(),
    getContext: jest.fn(),
    updateContext: jest.fn(),
    addDecision: jest.fn(),
    extractKeywords: jest.fn()
  }
}));

// Mock knowledge-project-integration manager
jest.mock('../managers/knowledge-project-integration-manager', () => ({
  knowledgeProjectIntegrationManager: {
    createProjectContext: jest.fn(),
    retrieveKnowledge: jest.fn(),
    createDecision: jest.fn(),
    generateImplementationPlan: jest.fn()
  }
}));

describe('Context Integration', () => {
  let contextIntegration: ContextIntegration;
  const projectId = uuidv4();

  beforeEach(() => {
    // Create a new context integration for each test
    contextIntegration = new ContextIntegration(mockLogger as any);
    jest.clearAllMocks();
  });

  describe('createContextFromKnowledgeProject', () => {
    it('should create a context from a knowledge project', async () => {
      // Mock knowledge project context
      const kpiContext = {
        projectId,
        relevantKnowledge: [
          {
            id: uuidv4(),
            type: 'concept',
            title: 'Test Concept',
            description: 'A test concept',
            content: 'Test content',
            tags: ['test'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        knowledgeLinks: [],
        generatedAt: new Date()
      };

      // Mock enhanced context
      const enhancedContext = {
        id: uuidv4(),
        projectId,
        name: 'Test Context',
        description: 'A test context',
        version: '0.1.0',
        relevantKnowledge: kpiContext.relevantKnowledge,
        knowledgeLinks: [],
        requirements: [],
        architecture: [],
        implementation: [],
        decisions: [],
        status: ProjectContextStatus.DRAFT,
        metadata: {},
        history: [
          {
            id: uuidv4(),
            timestamp: new Date(),
            type: ContextChangeType.CREATE,
            component: ContextComponentType.CONTEXT,
            itemId: projectId,
            newValue: { projectId },
            userId: 'system'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Setup mocks
      (knowledgeProjectIntegrationManager.createProjectContext as jest.Mock).mockResolvedValue(kpiContext);
      (contextManager.createContext as jest.Mock).mockResolvedValue(enhancedContext);

      // Create context
      const result = await contextIntegration.createContextFromKnowledgeProject({
        projectId,
        name: 'Test Context',
        description: 'A test context'
      });

      // Verify result
      expect(result).toEqual(enhancedContext);
      expect(knowledgeProjectIntegrationManager.createProjectContext).toHaveBeenCalledWith({
        projectId,
        name: 'Test Context',
        description: 'A test context'
      });
      expect(contextManager.createContext).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('syncContextWithKnowledgeProject', () => {
    it('should sync a context with a knowledge project', async () => {
      const contextId = uuidv4();

      // Mock existing context
      const existingContext = {
        id: contextId,
        projectId,
        name: 'Test Context',
        description: 'A test context',
        version: '0.1.0',
        relevantKnowledge: [],
        knowledgeLinks: [],
        requirements: [],
        architecture: [],
        implementation: [],
        decisions: [],
        status: ProjectContextStatus.DRAFT,
        metadata: {},
        history: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock knowledge project context
      const kpiContext = {
        projectId,
        relevantKnowledge: [
          {
            id: uuidv4(),
            type: 'concept',
            title: 'New Concept',
            description: 'A new concept',
            content: 'New content',
            tags: ['test'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        knowledgeLinks: [],
        generatedAt: new Date()
      };

      // Mock updated context
      const updatedContext = {
        ...existingContext,
        relevantKnowledge: kpiContext.relevantKnowledge,
        metadata: {
          lastSyncedWithKnowledgeProject: expect.any(String)
        },
        updatedAt: new Date()
      };

      // Setup mocks
      (contextManager.getContext as jest.Mock).mockResolvedValue(existingContext);
      (knowledgeProjectIntegrationManager.createProjectContext as jest.Mock).mockResolvedValue(kpiContext);
      (contextManager.updateContext as jest.Mock).mockResolvedValue(updatedContext);

      // Sync context
      const result = await contextIntegration.syncContextWithKnowledgeProject(contextId, projectId);

      // Verify result
      expect(result).toEqual(updatedContext);
      expect(contextManager.getContext).toHaveBeenCalledWith(contextId);
      expect(knowledgeProjectIntegrationManager.createProjectContext).toHaveBeenCalledWith({
        projectId,
        includeRequirements: true,
        includeComponents: true,
        includeTasks: true,
        includeDecisions: true
      });
      expect(contextManager.updateContext).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('getRelevantKnowledge', () => {
    it('should get relevant knowledge for a context', async () => {
      const contextId = uuidv4();
      const query = 'test query';

      // Mock context
      const context = {
        id: contextId,
        projectId,
        name: 'Test Context',
        description: 'A test context',
        version: '0.1.0',
        relevantKnowledge: [],
        knowledgeLinks: [],
        requirements: [],
        architecture: [],
        implementation: [],
        decisions: [],
        status: ProjectContextStatus.DRAFT,
        metadata: {},
        history: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock keywords
      const keywords = ['test', 'context', 'project'];

      // Mock knowledge items
      const knowledgeItems: KnowledgeItem[] = [
        {
          id: uuidv4(),
          type: 'concept',
          title: 'Test Concept',
          description: 'A test concept',
          content: 'Test content',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Setup mocks
      (contextManager.getContext as jest.Mock).mockResolvedValue(context);
      (contextManager.extractKeywords as jest.Mock).mockResolvedValue(keywords);
      (knowledgeProjectIntegrationManager.retrieveKnowledge as jest.Mock).mockResolvedValue({
        query: `${query} ${keywords.join(' ')}`,
        results: knowledgeItems,
        totalResults: knowledgeItems.length,
        executionTimeMs: 100
      });

      // Get relevant knowledge
      const result = await contextIntegration.getRelevantKnowledge(contextId, query);

      // Verify result
      expect(result).toEqual(knowledgeItems);
      expect(contextManager.getContext).toHaveBeenCalledWith(contextId);
      expect(contextManager.extractKeywords).toHaveBeenCalledWith(contextId);
      expect(knowledgeProjectIntegrationManager.retrieveKnowledge).toHaveBeenCalledWith({
        query: `${query} ${keywords.join(' ')}`,
        projectId,
        maxResults: 10
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('createDecision', () => {
    it('should create a decision with knowledge references', async () => {
      const contextId = uuidv4();
      const title = 'Test Decision';
      const description = 'A test decision';
      const decision = 'The decision';
      const rationale = 'The rationale';

      // Mock context
      const context = {
        id: contextId,
        projectId,
        name: 'Test Context',
        description: 'A test context',
        version: '0.1.0',
        relevantKnowledge: [],
        knowledgeLinks: [],
        requirements: [],
        architecture: [],
        implementation: [],
        decisions: [],
        status: ProjectContextStatus.DRAFT,
        metadata: {},
        history: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock knowledge items
      const knowledgeItems: KnowledgeItem[] = [
        {
          id: uuidv4(),
          type: 'concept',
          title: 'Related Concept',
          description: 'A related concept',
          content: 'Related content',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock decision
      const kpiDecision = {
        id: uuidv4(),
        projectId,
        title,
        description,
        context: description,
        decision,
        rationale,
        alternatives: [],
        consequences: '',
        relatedKnowledgeIds: knowledgeItems.map(k => k.id),
        status: 'proposed',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock decision context
      const decisionContext: ProjectDecisionContext = {
        id: uuidv4(),
        decisionId: kpiDecision.id,
        relevantKnowledgeIds: knowledgeItems.map(k => k.id),
        status: kpiDecision.status,
        metadata: {}
      };

      // Setup mocks
      (contextManager.getContext as jest.Mock).mockResolvedValue(context);
      (contextIntegration as any).getRelevantKnowledge = jest.fn().mockResolvedValue(knowledgeItems);
      (knowledgeProjectIntegrationManager.createDecision as jest.Mock).mockResolvedValue(kpiDecision);
      (contextManager.addDecision as jest.Mock).mockResolvedValue({
        ...context,
        decisions: [decisionContext]
      });

      // Create decision
      const result = await contextIntegration.createDecision(
        contextId,
        title,
        description,
        decision,
        rationale
      );

      // Verify result
      expect(result).toEqual(decisionContext);
      expect(contextManager.getContext).toHaveBeenCalledWith(contextId);
      expect(contextIntegration['getRelevantKnowledge']).toHaveBeenCalledWith(
        contextId,
        `${title} ${description} ${decision} ${rationale}`,
        5
      );
      expect(knowledgeProjectIntegrationManager.createDecision).toHaveBeenCalledWith({
        projectId,
        title,
        description,
        context: description,
        decision,
        rationale,
        relatedKnowledgeIds: knowledgeItems.map(k => k.id)
      });
      expect(contextManager.addDecision).toHaveBeenCalledWith(contextId, decisionContext);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('generateImplementationPlan', () => {
    it('should generate an implementation plan for a context', async () => {
      const contextId = uuidv4();
      const title = 'Test Plan';
      const description = 'A test plan';

      // Mock context
      const context = {
        id: contextId,
        projectId,
        name: 'Test Context',
        description: 'A test context',
        version: '0.1.0',
        relevantKnowledge: [],
        knowledgeLinks: [],
        requirements: [],
        architecture: [],
        implementation: [],
        decisions: [],
        status: ProjectContextStatus.DRAFT,
        metadata: {},
        history: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock implementation plan
      const implementationPlan = {
        id: uuidv4(),
        projectId,
        title,
        description,
        requirements: [],
        architectureComponents: [],
        implementationComponents: [],
        testComponents: [],
        deploymentComponents: [],
        knowledgeReferences: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Setup mocks
      (contextManager.getContext as jest.Mock).mockResolvedValue(context);
      (knowledgeProjectIntegrationManager.generateImplementationPlan as jest.Mock).mockResolvedValue(implementationPlan);

      // Generate implementation plan
      const result = await contextIntegration.generateImplementationPlan(contextId, title, description);

      // Verify result
      expect(result).toEqual(implementationPlan);
      expect(contextManager.getContext).toHaveBeenCalledWith(contextId);
      expect(knowledgeProjectIntegrationManager.generateImplementationPlan).toHaveBeenCalledWith({
        projectId,
        title,
        description,
        usePatterns: true
      });
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
