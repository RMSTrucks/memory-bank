/**
 * Tests for Context Utilities
 *
 * This file contains tests for the context utilities, including
 * serialization, deserialization, validation, and comparison.
 */

import { v4 as uuidv4 } from 'uuid';
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
  ContextChangeType,
  ContextComponentType,
  KnowledgeItemType
} from '../types/knowledge-project-integration';

describe('Context Utilities', () => {
  // Sample project context for testing
  const createSampleContext = (): ProjectContext => {
    const now = new Date();
    const contextId = uuidv4();
    const projectId = uuidv4();

    return {
      id: contextId,
      projectId,
      name: 'Test Context',
      description: 'A test project context',
      version: '0.1.0',
      relevantKnowledge: [
        {
          id: uuidv4(),
          type: KnowledgeItemType.CONCEPT,
          title: 'Test Concept',
          description: 'A test concept',
          content: 'Test concept content',
          tags: ['test', 'concept'],
          createdAt: now,
          updatedAt: now
        }
      ],
      knowledgeLinks: [],
      requirements: [
        {
          id: uuidv4(),
          requirementId: uuidv4(),
          relevantKnowledgeIds: [],
          status: 'active',
          metadata: {}
        }
      ],
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
          newValue: { projectId }
        }
      ],
      createdAt: now,
      updatedAt: now
    };
  };

  describe('serializeContext', () => {
    it('should serialize a context to JSON', () => {
      const context = createSampleContext();
      const serialized = serializeContext({ context });

      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');

      const parsed = JSON.parse(serialized);
      expect(parsed.id).toBe(context.id);
      expect(parsed.name).toBe(context.name);
    });

    it('should exclude history when requested', () => {
      const context = createSampleContext();
      const serialized = serializeContext({ context, includeHistory: false });

      const parsed = JSON.parse(serialized);
      expect(parsed.history).toEqual([]);
    });

    it('should use compact JSON when prettyPrint is false', () => {
      const context = createSampleContext();
      const prettyPrinted = serializeContext({ context, prettyPrint: true });
      const compact = serializeContext({ context, prettyPrint: false });

      expect(prettyPrinted.length).toBeGreaterThan(compact.length);
    });
  });

  describe('deserializeContext', () => {
    it('should deserialize a JSON string to a context', () => {
      const context = createSampleContext();
      const serialized = serializeContext({ context });

      const deserialized = deserializeContext({ serialized });

      expect(deserialized).toBeDefined();
      expect(deserialized.id).toBe(context.id);
      expect(deserialized.name).toBe(context.name);
    });

    it('should throw an error for invalid JSON', () => {
      expect(() => {
        deserializeContext({ serialized: 'invalid json' });
      }).toThrow();
    });

    it('should throw an error for invalid context when validation is enabled', () => {
      const invalidContext = { name: 'Invalid Context' };
      const serialized = JSON.stringify(invalidContext);

      expect(() => {
        deserializeContext({ serialized, validate: true });
      }).toThrow();
    });

    it('should not throw an error for invalid context when validation is disabled', () => {
      const invalidContext = { name: 'Invalid Context' };
      const serialized = JSON.stringify(invalidContext);

      expect(() => {
        deserializeContext({ serialized, validate: false });
      }).not.toThrow();
    });
  });

  describe('validateContext', () => {
    it('should validate a valid context', () => {
      const context = createSampleContext();
      const result = validateContext(context);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const context = createSampleContext();
      delete (context as any).id;
      delete (context as any).name;

      const result = validateContext(context);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.path === 'id')).toBe(true);
      expect(result.errors.some(e => e.path === 'name')).toBe(true);
    });

    it('should return errors for invalid arrays', () => {
      const context = createSampleContext();
      (context as any).requirements = 'not an array';

      const result = validateContext(context);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'requirements')).toBe(true);
    });

    it('should return warnings for empty arrays', () => {
      const context = createSampleContext();
      context.relevantKnowledge = [];
      context.requirements = [];

      const result = validateContext(context);

      expect(result.isValid).toBe(true); // Empty arrays are valid, just warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.path === 'relevantKnowledge')).toBe(true);
      expect(result.warnings.some(w => w.path === 'requirements')).toBe(true);
    });

    it('should validate history entries', () => {
      const context = createSampleContext();
      context.history.push({
        id: '',
        timestamp: 'invalid date' as any,
        type: 'invalid type' as any,
        component: 'invalid component' as any,
        itemId: ''
      });

      const result = validateContext(context);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path.startsWith('history[1]'))).toBe(true);
    });
  });

  describe('compareContexts', () => {
    it('should detect changes in basic properties', () => {
      const oldContext = createSampleContext();
      const newContext = { ...oldContext };

      newContext.name = 'Updated Name';
      newContext.description = 'Updated Description';
      newContext.version = '0.2.0';
      newContext.status = ProjectContextStatus.ACTIVE;

      const changes = compareContexts(oldContext, newContext);

      expect(changes).toHaveLength(4);
      expect(changes.some(c => c.type === ContextChangeType.UPDATE && c.component === ContextComponentType.CONTEXT && c.newValue.name === 'Updated Name')).toBe(true);
      expect(changes.some(c => c.type === ContextChangeType.UPDATE && c.component === ContextComponentType.CONTEXT && c.newValue.description === 'Updated Description')).toBe(true);
      expect(changes.some(c => c.type === ContextChangeType.UPDATE && c.component === ContextComponentType.CONTEXT && c.newValue.version === '0.2.0')).toBe(true);
      expect(changes.some(c => c.type === ContextChangeType.UPDATE && c.component === ContextComponentType.CONTEXT && c.newValue.status === ProjectContextStatus.ACTIVE)).toBe(true);
    });

    it('should detect added requirements', () => {
      const oldContext = createSampleContext();
      const newContext = JSON.parse(JSON.stringify(oldContext)) as ProjectContext;

      const newRequirement = {
        id: uuidv4(),
        requirementId: uuidv4(),
        relevantKnowledgeIds: [],
        status: 'active',
        metadata: {}
      };

      newContext.requirements.push(newRequirement);

      const changes = compareContexts(oldContext, newContext);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe(ContextChangeType.CREATE);
      expect(changes[0].component).toBe(ContextComponentType.REQUIREMENT);
      expect(changes[0].itemId).toBe(newRequirement.id);
    });

    it('should detect removed requirements', () => {
      const oldContext = createSampleContext();
      const newContext = JSON.parse(JSON.stringify(oldContext)) as ProjectContext;

      const removedRequirement = oldContext.requirements[0];
      newContext.requirements = [];

      const changes = compareContexts(oldContext, newContext);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe(ContextChangeType.DELETE);
      expect(changes[0].component).toBe(ContextComponentType.REQUIREMENT);
      expect(changes[0].itemId).toBe(removedRequirement.id);
    });

    it('should detect updated requirements', () => {
      const oldContext = createSampleContext();
      const newContext = JSON.parse(JSON.stringify(oldContext)) as ProjectContext;

      const updatedRequirement = { ...newContext.requirements[0], status: 'completed' };
      newContext.requirements = [updatedRequirement];

      const changes = compareContexts(oldContext, newContext);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe(ContextChangeType.UPDATE);
      expect(changes[0].component).toBe(ContextComponentType.REQUIREMENT);
      expect(changes[0].itemId).toBe(updatedRequirement.id);
    });
  });

  describe('updateContext', () => {
    it('should apply context property changes', () => {
      const context = createSampleContext();

      const changes = [
        {
          id: uuidv4(),
          timestamp: new Date(),
          type: ContextChangeType.UPDATE,
          component: ContextComponentType.CONTEXT,
          itemId: context.id,
          newValue: { name: 'Updated Name', description: 'Updated Description' }
        }
      ];

      const updatedContext = updateContext(context, changes);

      expect(updatedContext.name).toBe('Updated Name');
      expect(updatedContext.description).toBe('Updated Description');
      expect(updatedContext.history).toHaveLength(context.history.length + 1);
    });

    it('should add new requirements', () => {
      const context = createSampleContext();

      const newRequirement = {
        id: uuidv4(),
        requirementId: uuidv4(),
        relevantKnowledgeIds: [],
        status: 'active',
        metadata: {}
      };

      const changes = [
        {
          id: uuidv4(),
          timestamp: new Date(),
          type: ContextChangeType.CREATE,
          component: ContextComponentType.REQUIREMENT,
          itemId: newRequirement.id,
          newValue: newRequirement
        }
      ];

      const updatedContext = updateContext(context, changes);

      expect(updatedContext.requirements).toHaveLength(context.requirements.length + 1);
      expect(updatedContext.requirements.some(r => r.id === newRequirement.id)).toBe(true);
    });

    it('should remove requirements', () => {
      const context = createSampleContext();
      const requirementToRemove = context.requirements[0];

      const changes = [
        {
          id: uuidv4(),
          timestamp: new Date(),
          type: ContextChangeType.DELETE,
          component: ContextComponentType.REQUIREMENT,
          itemId: requirementToRemove.id,
          previousValue: requirementToRemove
        }
      ];

      const updatedContext = updateContext(context, changes);

      expect(updatedContext.requirements).toHaveLength(context.requirements.length - 1);
      expect(updatedContext.requirements.some(r => r.id === requirementToRemove.id)).toBe(false);
    });

    it('should update requirements', () => {
      const context = createSampleContext();
      const requirementToUpdate = context.requirements[0];

      const updatedRequirement = {
        ...requirementToUpdate,
        status: 'completed'
      };

      const changes = [
        {
          id: uuidv4(),
          timestamp: new Date(),
          type: ContextChangeType.UPDATE,
          component: ContextComponentType.REQUIREMENT,
          itemId: requirementToUpdate.id,
          previousValue: requirementToUpdate,
          newValue: updatedRequirement
        }
      ];

      const updatedContext = updateContext(context, changes);

      expect(updatedContext.requirements).toHaveLength(context.requirements.length);
      expect(updatedContext.requirements.find(r => r.id === requirementToUpdate.id)?.status).toBe('completed');
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from a context', () => {
      const context = createSampleContext();

      // Add more content to extract keywords from
      context.name = 'Project Management System';
      context.description = 'A system for managing projects and tasks';
      context.relevantKnowledge[0].title = 'Project Management Methodologies';
      context.relevantKnowledge[0].description = 'Various methodologies for managing projects';
      context.relevantKnowledge[0].tags = ['project', 'management', 'methodology', 'agile', 'waterfall'];

      const keywords = extractKeywords(context);

      expect(keywords).toBeDefined();
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).toContain('project');
      expect(keywords).toContain('management');
      expect(keywords).toContain('system');
      expect(keywords).toContain('methodology');
      expect(keywords).toContain('agile');
      expect(keywords).toContain('waterfall');
    });

    it('should deduplicate keywords', () => {
      const context = createSampleContext();

      // Add duplicate keywords
      context.name = 'Project Management';
      context.description = 'Project Management System';
      context.relevantKnowledge[0].title = 'Project Management';
      context.relevantKnowledge[0].tags = ['project', 'management', 'project'];

      const keywords = extractKeywords(context);

      const projectCount = keywords.filter(k => k === 'project').length;
      const managementCount = keywords.filter(k => k === 'management').length;

      expect(projectCount).toBe(1);
      expect(managementCount).toBe(1);
    });

    it('should filter out short keywords', () => {
      const context = createSampleContext();

      context.description = 'A to the for and but with';

      const keywords = extractKeywords(context);

      expect(keywords).not.toContain('to');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('for');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('but');
      expect(keywords).not.toContain('with');
    });
  });
});
