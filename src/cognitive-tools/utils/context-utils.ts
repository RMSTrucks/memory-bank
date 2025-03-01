/**
 * Context Utilities
 *
 * This file provides utilities for working with project contexts, including
 * serialization, deserialization, validation, and comparison.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ProjectContext,
  ContextValidationResult,
  ContextValidationError,
  ContextValidationWarning,
  SerializeContextParams,
  DeserializeContextParams,
  ContextChange,
  ProjectContextStatus,
  ContextChangeType,
  ContextComponentType
} from '../types/knowledge-project-integration';

/**
 * Serialize a project context to a string
 */
export function serializeContext(params: SerializeContextParams): string {
  const { context, format = 'json', includeHistory = true, prettyPrint = true } = params;

  // Create a copy of the context to avoid modifying the original
  const contextCopy = { ...context };

  // Remove history if not requested
  if (!includeHistory) {
    contextCopy.history = [];
  }

  // Serialize to the requested format
  if (format === 'json') {
    return JSON.stringify(contextCopy, null, prettyPrint ? 2 : 0);
  } else if (format === 'yaml') {
    // This would use a YAML library
    // For now, just return JSON as a placeholder
    return JSON.stringify(contextCopy, null, prettyPrint ? 2 : 0);
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Deserialize a string to a project context
 */
export function deserializeContext(params: DeserializeContextParams): ProjectContext {
  const { serialized, format = 'json', validate = true } = params;

  let context: ProjectContext;

  // Deserialize from the requested format
  if (format === 'json') {
    context = JSON.parse(serialized) as ProjectContext;
  } else if (format === 'yaml') {
    // This would use a YAML library
    // For now, just parse as JSON as a placeholder
    context = JSON.parse(serialized) as ProjectContext;
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  // Validate the context if requested
  if (validate) {
    const validationResult = validateContext(context);
    if (!validationResult.isValid) {
      throw new Error(`Invalid context: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }
  }

  return context;
}

/**
 * Validate a project context
 */
export function validateContext(context: ProjectContext): ContextValidationResult {
  const errors: ContextValidationError[] = [];
  const warnings: ContextValidationWarning[] = [];

  // Check required fields
  if (!context.id) {
    errors.push({
      code: 'MISSING_FIELD',
      message: 'Context ID is required',
      path: 'id',
      severity: 'error'
    });
  }

  if (!context.projectId) {
    errors.push({
      code: 'MISSING_FIELD',
      message: 'Project ID is required',
      path: 'projectId',
      severity: 'error'
    });
  }

  if (!context.name) {
    errors.push({
      code: 'MISSING_FIELD',
      message: 'Context name is required',
      path: 'name',
      severity: 'error'
    });
  }

  if (!context.version) {
    errors.push({
      code: 'MISSING_FIELD',
      message: 'Context version is required',
      path: 'version',
      severity: 'error'
    });
  }

  // Check arrays
  if (!Array.isArray(context.relevantKnowledge)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Relevant knowledge must be an array',
      path: 'relevantKnowledge',
      severity: 'error'
    });
  }

  if (!Array.isArray(context.knowledgeLinks)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Knowledge links must be an array',
      path: 'knowledgeLinks',
      severity: 'error'
    });
  }

  if (!Array.isArray(context.requirements)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Requirements must be an array',
      path: 'requirements',
      severity: 'error'
    });
  }

  if (!Array.isArray(context.architecture)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Architecture must be an array',
      path: 'architecture',
      severity: 'error'
    });
  }

  if (!Array.isArray(context.implementation)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Implementation must be an array',
      path: 'implementation',
      severity: 'error'
    });
  }

  if (!Array.isArray(context.decisions)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Decisions must be an array',
      path: 'decisions',
      severity: 'error'
    });
  }

  if (!Array.isArray(context.history)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'History must be an array',
      path: 'history',
      severity: 'error'
    });
  }

  // Check dates
  if (!(context.createdAt instanceof Date) && !(typeof context.createdAt === 'string')) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Created date must be a Date or string',
      path: 'createdAt',
      severity: 'error'
    });
  }

  if (!(context.updatedAt instanceof Date) && !(typeof context.updatedAt === 'string')) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Updated date must be a Date or string',
      path: 'updatedAt',
      severity: 'error'
    });
  }

  // Check status
  if (!Object.values(ProjectContextStatus).includes(context.status as ProjectContextStatus)) {
    errors.push({
      code: 'INVALID_FIELD',
      message: `Status must be one of: ${Object.values(ProjectContextStatus).join(', ')}`,
      path: 'status',
      severity: 'error'
    });
  }

  // Check metadata
  if (typeof context.metadata !== 'object' || context.metadata === null) {
    errors.push({
      code: 'INVALID_FIELD',
      message: 'Metadata must be an object',
      path: 'metadata',
      severity: 'error'
    });
  }

  // Check history entries
  if (Array.isArray(context.history)) {
    context.history.forEach((change, index) => {
      if (!change.id) {
        errors.push({
          code: 'MISSING_FIELD',
          message: `History entry ${index} is missing ID`,
          path: `history[${index}].id`,
          severity: 'error'
        });
      }

      if (!(change.timestamp instanceof Date) && !(typeof change.timestamp === 'string')) {
        errors.push({
          code: 'INVALID_FIELD',
          message: `History entry ${index} timestamp must be a Date or string`,
          path: `history[${index}].timestamp`,
          severity: 'error'
        });
      }

      if (!Object.values(ContextChangeType).includes(change.type as ContextChangeType)) {
        errors.push({
          code: 'INVALID_FIELD',
          message: `History entry ${index} type must be one of: ${Object.values(ContextChangeType).join(', ')}`,
          path: `history[${index}].type`,
          severity: 'error'
        });
      }

      if (!Object.values(ContextComponentType).includes(change.component as ContextComponentType)) {
        errors.push({
          code: 'INVALID_FIELD',
          message: `History entry ${index} component must be one of: ${Object.values(ContextComponentType).join(', ')}`,
          path: `history[${index}].component`,
          severity: 'error'
        });
      }

      if (!change.itemId) {
        errors.push({
          code: 'MISSING_FIELD',
          message: `History entry ${index} is missing itemId`,
          path: `history[${index}].itemId`,
          severity: 'error'
        });
      }
    });
  }

  // Add warnings for empty arrays
  if (Array.isArray(context.relevantKnowledge) && context.relevantKnowledge.length === 0) {
    warnings.push({
      code: 'EMPTY_ARRAY',
      message: 'Relevant knowledge array is empty',
      path: 'relevantKnowledge',
      severity: 'warning'
    });
  }

  if (Array.isArray(context.requirements) && context.requirements.length === 0) {
    warnings.push({
      code: 'EMPTY_ARRAY',
      message: 'Requirements array is empty',
      path: 'requirements',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Compare two project contexts and generate a list of changes
 */
export function compareContexts(oldContext: ProjectContext, newContext: ProjectContext): ContextChange[] {
  const changes: ContextChange[] = [];

  // Compare basic properties
  if (oldContext.name !== newContext.name) {
    changes.push({
      id: uuidv4(),
      timestamp: new Date(),
      type: ContextChangeType.UPDATE,
      component: ContextComponentType.CONTEXT,
      itemId: newContext.id,
      previousValue: { name: oldContext.name },
      newValue: { name: newContext.name }
    });
  }

  if (oldContext.description !== newContext.description) {
    changes.push({
      id: uuidv4(),
      timestamp: new Date(),
      type: ContextChangeType.UPDATE,
      component: ContextComponentType.CONTEXT,
      itemId: newContext.id,
      previousValue: { description: oldContext.description },
      newValue: { description: newContext.description }
    });
  }

  if (oldContext.version !== newContext.version) {
    changes.push({
      id: uuidv4(),
      timestamp: new Date(),
      type: ContextChangeType.UPDATE,
      component: ContextComponentType.CONTEXT,
      itemId: newContext.id,
      previousValue: { version: oldContext.version },
      newValue: { version: newContext.version }
    });
  }

  if (oldContext.status !== newContext.status) {
    changes.push({
      id: uuidv4(),
      timestamp: new Date(),
      type: ContextChangeType.UPDATE,
      component: ContextComponentType.CONTEXT,
      itemId: newContext.id,
      previousValue: { status: oldContext.status },
      newValue: { status: newContext.status }
    });
  }

  // Compare requirements
  const oldRequirementIds = new Set(oldContext.requirements.map(req => req.requirementId));
  const newRequirementIds = new Set(newContext.requirements.map(req => req.requirementId));

  // Added requirements
  newContext.requirements
    .filter(req => !oldRequirementIds.has(req.requirementId))
    .forEach(req => {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.CREATE,
        component: ContextComponentType.REQUIREMENT,
        itemId: req.id,
        newValue: req
      });
    });

  // Removed requirements
  oldContext.requirements
    .filter(req => !newRequirementIds.has(req.requirementId))
    .forEach(req => {
      changes.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: ContextChangeType.DELETE,
        component: ContextComponentType.REQUIREMENT,
        itemId: req.id,
        previousValue: req
      });
    });

  // Updated requirements
  newContext.requirements
    .filter(newReq => oldRequirementIds.has(newReq.requirementId))
    .forEach(newReq => {
      const oldReq = oldContext.requirements.find(req => req.requirementId === newReq.requirementId);
      if (oldReq && JSON.stringify(oldReq) !== JSON.stringify(newReq)) {
        changes.push({
          id: uuidv4(),
          timestamp: new Date(),
          type: ContextChangeType.UPDATE,
          component: ContextComponentType.REQUIREMENT,
          itemId: newReq.id,
          previousValue: oldReq,
          newValue: newReq
        });
      }
    });

  // Similar comparisons could be added for architecture, implementation, and decisions

  return changes;
}

/**
 * Update a project context with changes
 */
export function updateContext(context: ProjectContext, changes: ContextChange[]): ProjectContext {
  // Create a deep copy of the context to avoid modifying the original
  const updatedContext = JSON.parse(JSON.stringify(context)) as ProjectContext;

  // Apply each change
  changes.forEach(change => {
    switch (change.component) {
      case ContextComponentType.CONTEXT:
        // Update context properties
        if (change.newValue) {
          Object.assign(updatedContext, change.newValue);
        }
        break;

      case ContextComponentType.REQUIREMENT:
        if (change.type === ContextChangeType.CREATE && change.newValue) {
          updatedContext.requirements.push(change.newValue);
        } else if (change.type === ContextChangeType.DELETE) {
          updatedContext.requirements = updatedContext.requirements.filter(req => req.id !== change.itemId);
        } else if (change.type === ContextChangeType.UPDATE && change.newValue) {
          const index = updatedContext.requirements.findIndex(req => req.id === change.itemId);
          if (index >= 0) {
            updatedContext.requirements[index] = change.newValue;
          }
        }
        break;

      case ContextComponentType.ARCHITECTURE:
        if (change.type === ContextChangeType.CREATE && change.newValue) {
          updatedContext.architecture.push(change.newValue);
        } else if (change.type === ContextChangeType.DELETE) {
          updatedContext.architecture = updatedContext.architecture.filter(comp => comp.id !== change.itemId);
        } else if (change.type === ContextChangeType.UPDATE && change.newValue) {
          const index = updatedContext.architecture.findIndex(comp => comp.id === change.itemId);
          if (index >= 0) {
            updatedContext.architecture[index] = change.newValue;
          }
        }
        break;

      case ContextComponentType.IMPLEMENTATION:
        if (change.type === ContextChangeType.CREATE && change.newValue) {
          updatedContext.implementation.push(change.newValue);
        } else if (change.type === ContextChangeType.DELETE) {
          updatedContext.implementation = updatedContext.implementation.filter(comp => comp.id !== change.itemId);
        } else if (change.type === ContextChangeType.UPDATE && change.newValue) {
          const index = updatedContext.implementation.findIndex(comp => comp.id === change.itemId);
          if (index >= 0) {
            updatedContext.implementation[index] = change.newValue;
          }
        }
        break;

      case ContextComponentType.DECISION:
        if (change.type === ContextChangeType.CREATE && change.newValue) {
          updatedContext.decisions.push(change.newValue);
        } else if (change.type === ContextChangeType.DELETE) {
          updatedContext.decisions = updatedContext.decisions.filter(dec => dec.id !== change.itemId);
        } else if (change.type === ContextChangeType.UPDATE && change.newValue) {
          const index = updatedContext.decisions.findIndex(dec => dec.id === change.itemId);
          if (index >= 0) {
            updatedContext.decisions[index] = change.newValue;
          }
        }
        break;

      case ContextComponentType.KNOWLEDGE:
        // Handle knowledge item changes
        break;

      case ContextComponentType.LINK:
        // Handle knowledge link changes
        break;
    }
  });

  // Add changes to history
  updatedContext.history = [...updatedContext.history, ...changes];

  // Update timestamp
  updatedContext.updatedAt = new Date();

  return updatedContext;
}

/**
 * Extract keywords from a project context
 */
export function extractKeywords(context: ProjectContext): string[] {
  const keywords: string[] = [];

  // Add context keywords
  keywords.push(context.name);
  keywords.push(...context.description.split(' '));

  // Add requirement keywords
  context.requirements.forEach(req => {
    // This would extract keywords from the requirement
    // For now, just add the requirement ID as a placeholder
    keywords.push(req.requirementId);
  });

  // Add architecture keywords
  context.architecture.forEach(comp => {
    // This would extract keywords from the architecture component
    // For now, just add the component ID as a placeholder
    keywords.push(comp.componentId);
  });

  // Add implementation keywords
  context.implementation.forEach(comp => {
    // This would extract keywords from the implementation component
    // For now, just add the component ID as a placeholder
    keywords.push(comp.componentId);
  });

  // Add decision keywords
  context.decisions.forEach(dec => {
    // This would extract keywords from the decision
    // For now, just add the decision ID as a placeholder
    keywords.push(dec.decisionId);
  });

  // Add knowledge keywords
  context.relevantKnowledge.forEach(knowledge => {
    keywords.push(knowledge.title);
    keywords.push(...knowledge.description.split(' '));
    keywords.push(...knowledge.tags);
  });

  // Clean and deduplicate keywords
  return [...new Set(
    keywords
      .map(keyword => keyword.toLowerCase())
      .filter(keyword => keyword.length > 3)
      .map(keyword => keyword.replace(/[^\w\s]/g, ''))
  )];
}
