/**
 * Tests for Context Manager
 *
 * This file contains tests for the context manager, including
 * creating, retrieving, updating, and validating contexts.
 */

import { v4 as uuidv4 } from 'uuid';
import { ContextManager } from '../managers/context-manager';
import {
  ProjectContextStatus,
  ContextChangeType,
  ContextComponentType
} from '../types/knowledge-project-integration';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('Context Manager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    // Create a new context manager for each test
    contextManager = new ContextManager(mockLogger as any);
    jest.clearAllMocks();
  });

  describe('createContext', () => {
    it('should create a new context', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context',
        description: 'A test context'
      });

      expect(context).toBeDefined();
      expect(context.id).toBeDefined();
      expect(context.projectId).toBe(projectId);
      expect(context.name).toBe('Test Context');
      expect(context.description).toBe('A test context');
      expect(context.status).toBe(ProjectContextStatus.DRAFT);
      expect(context.relevantKnowledge).toEqual([]);
      expect(context.knowledgeLinks).toEqual([]);
      expect(context.requirements).toEqual([]);
      expect(context.architecture).toEqual([]);
      expect(context.implementation).toEqual([]);
      expect(context.decisions).toEqual([]);
      expect(context.history).toHaveLength(1);
      expect(context.history[0].type).toBe(ContextChangeType.CREATE);
      expect(context.history[0].component).toBe(ContextComponentType.CONTEXT);
      expect(context.createdAt).toBeInstanceOf(Date);
      expect(context.updatedAt).toBeInstanceOf(Date);
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should use default values when not provided', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId
      });

      expect(context).toBeDefined();
      expect(context.name).toBe(`Project Context ${projectId}`);
      expect(context.description).toBe(`Context for project ${projectId}`);
      expect(context.metadata).toEqual({});
    });
  });

  describe('getContext', () => {
    it('should get a context by ID', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      const retrievedContext = await contextManager.getContext(context.id);
      expect(retrievedContext).toEqual(context);
    });

    it('should throw an error for non-existent context', async () => {
      await expect(contextManager.getContext('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getContextsForProject', () => {
    it('should get all contexts for a project', async () => {
      const projectId = uuidv4();
      const context1 = await contextManager.createContext({
        projectId,
        name: 'Context 1'
      });
      const context2 = await contextManager.createContext({
        projectId,
        name: 'Context 2'
      });
      const otherProjectId = uuidv4();
      await contextManager.createContext({
        projectId: otherProjectId,
        name: 'Other Project Context'
      });

      const contexts = await contextManager.getContextsForProject(projectId);
      expect(contexts).toHaveLength(2);
      expect(contexts).toContainEqual(context1);
      expect(contexts).toContainEqual(context2);
    });

    it('should return an empty array for a project with no contexts', async () => {
      const projectId = uuidv4();
      const contexts = await contextManager.getContextsForProject(projectId);
      expect(contexts).toEqual([]);
    });
  });

  describe('updateContext', () => {
    it('should update a context', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context',
        description: 'A test context'
      });

      const updatedContext = await contextManager.updateContext({
        contextId: context.id,
        name: 'Updated Context',
        description: 'An updated context',
        version: '0.2.0',
        status: ProjectContextStatus.ACTIVE,
        metadata: { key: 'value' },
        reason: 'Testing update',
        userId: 'test-user'
      });

      expect(updatedContext).toBeDefined();
      expect(updatedContext.id).toBe(context.id);
      expect(updatedContext.name).toBe('Updated Context');
      expect(updatedContext.description).toBe('An updated context');
      expect(updatedContext.version).toBe('0.2.0');
      expect(updatedContext.status).toBe(ProjectContextStatus.ACTIVE);
      expect(updatedContext.metadata).toEqual({ key: 'value' });
      expect(updatedContext.history).toHaveLength(6); // 1 create + 5 updates
      expect(updatedContext.history[1].reason).toBe('Testing update');
      expect(updatedContext.history[1].userId).toBe('test-user');
      expect(mockLogger.info).toHaveBeenCalledTimes(3);
    });

    it('should return the original context if no changes are made', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      const updatedContext = await contextManager.updateContext({
        contextId: context.id
      });

      expect(updatedContext).toEqual(context);
    });

    it('should throw an error for non-existent context', async () => {
      await expect(contextManager.updateContext({
        contextId: 'non-existent-id',
        name: 'Updated Context'
      })).rejects.toThrow();
    });
  });

  describe('addRequirement', () => {
    it('should add a requirement to a context', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      const requirement = {
        id: uuidv4(),
        requirementId: uuidv4(),
        relevantKnowledgeIds: [],
        status: 'active',
        metadata: {}
      };

      const updatedContext = await contextManager.addRequirement(context.id, requirement);

      expect(updatedContext).toBeDefined();
      expect(updatedContext.requirements).toHaveLength(1);
      expect(updatedContext.requirements[0]).toEqual(requirement);
      expect(updatedContext.history).toHaveLength(2);
      expect(updatedContext.history[1].type).toBe(ContextChangeType.CREATE);
      expect(updatedContext.history[1].component).toBe(ContextComponentType.REQUIREMENT);
      expect(updatedContext.history[1].itemId).toBe(requirement.id);
      expect(mockLogger.info).toHaveBeenCalledTimes(3);
    });

    it('should throw an error for non-existent context', async () => {
      const requirement = {
        id: uuidv4(),
        requirementId: uuidv4(),
        relevantKnowledgeIds: [],
        status: 'active',
        metadata: {}
      };

      await expect(contextManager.addRequirement('non-existent-id', requirement)).rejects.toThrow();
    });
  });

  describe('removeRequirement', () => {
    it('should remove a requirement from a context', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      const requirement = {
        id: uuidv4(),
        requirementId: uuidv4(),
        relevantKnowledgeIds: [],
        status: 'active',
        metadata: {}
      };

      const contextWithRequirement = await contextManager.addRequirement(context.id, requirement);
      const updatedContext = await contextManager.removeRequirement(context.id, requirement.id);

      expect(updatedContext).toBeDefined();
      expect(updatedContext.requirements).toHaveLength(0);
      expect(updatedContext.history).toHaveLength(3);
      expect(updatedContext.history[2].type).toBe(ContextChangeType.DELETE);
      expect(updatedContext.history[2].component).toBe(ContextComponentType.REQUIREMENT);
      expect(updatedContext.history[2].itemId).toBe(requirement.id);
      expect(mockLogger.info).toHaveBeenCalledTimes(4);
    });

    it('should throw an error for non-existent requirement', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      await expect(contextManager.removeRequirement(context.id, 'non-existent-id')).rejects.toThrow();
    });
  });

  describe('compareContexts', () => {
    it('should compare two contexts and generate changes', async () => {
      const projectId = uuidv4();
      const context1 = await contextManager.createContext({
        projectId,
        name: 'Context 1',
        description: 'First context'
      });

      const context2 = await contextManager.createContext({
        projectId,
        name: 'Context 2',
        description: 'Second context'
      });

      const changes = await contextManager.compareContexts(context1.id, context2.id);

      expect(changes).toBeDefined();
      expect(changes.length).toBeGreaterThan(0);
      expect(changes.some(c => c.type === ContextChangeType.UPDATE && c.component === ContextComponentType.CONTEXT && c.newValue.name === 'Context 2')).toBe(true);
      expect(changes.some(c => c.type === ContextChangeType.UPDATE && c.component === ContextComponentType.CONTEXT && c.newValue.description === 'Second context')).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledTimes(3);
    });
  });

  describe('validateContext', () => {
    it('should validate a context', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      const result = await contextManager.validateContext(context.id);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('serializeContext', () => {
    it('should serialize a context to JSON', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      const serialized = await contextManager.serializeContext(context.id);

      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');
      const parsed = JSON.parse(serialized);
      expect(parsed.id).toBe(context.id);
      expect(parsed.name).toBe('Test Context');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should exclude history when requested', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Test Context'
      });

      const serialized = await contextManager.serializeContext(context.id, 'json', false);

      const parsed = JSON.parse(serialized);
      expect(parsed.history).toEqual([]);
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from a context', async () => {
      const projectId = uuidv4();
      const context = await contextManager.createContext({
        projectId,
        name: 'Project Management System',
        description: 'A system for managing projects and tasks'
      });

      const keywords = await contextManager.extractKeywords(context.id);

      expect(keywords).toBeDefined();
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).toContain('project');
      expect(keywords).toContain('management');
      expect(keywords).toContain('system');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });
});
