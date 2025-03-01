import { Priority } from '../../../types/common';

/**
 * Base interface for all requirement types
 */
export interface BaseRequirement {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, unknown>;
}

/**
 * Functional requirements describe what the system should do
 */
export interface FunctionalRequirement extends BaseRequirement {
  type: 'functional';
  acceptance: string[];
  dependencies: string[];
  implementation?: {
    suggestedPattern?: string;
    estimatedComplexity: 'low' | 'medium' | 'high';
    technicalNotes?: string;
  };
}

/**
 * Non-functional requirements describe system qualities
 */
export interface NonFunctionalRequirement extends BaseRequirement {
  type: 'non-functional';
  category: 'performance' | 'security' | 'usability' | 'reliability' | 'maintainability' | 'scalability';
  metrics: {
    measure: string;
    target: string;
    current?: string;
  }[];
}

/**
 * Technical requirements describe system constraints and technical needs
 */
export interface TechnicalRequirement extends BaseRequirement {
  type: 'technical';
  category: 'infrastructure' | 'architecture' | 'integration' | 'technology' | 'tooling';
  constraints: string[];
  impact: {
    scope: string;
    risk: 'low' | 'medium' | 'high';
    mitigation?: string;
  };
}

/**
 * Project requirements describe project management and process needs
 */
export interface ProjectRequirement extends BaseRequirement {
  type: 'project';
  category: 'process' | 'documentation' | 'testing' | 'deployment' | 'maintenance';
  stakeholders: string[];
  timeline?: {
    start: Date;
    end: Date;
    milestones: {
      title: string;
      date: Date;
      deliverables: string[];
    }[];
  };
}

/**
 * Union type of all requirement types
 */
export type Requirement =
  | FunctionalRequirement
  | NonFunctionalRequirement
  | TechnicalRequirement
  | ProjectRequirement;

/**
 * Requirement relationship types
 */
export type RequirementRelationType =
  | 'depends_on'
  | 'parent_of'
  | 'related_to'
  | 'conflicts_with'
  | 'implements'
  | 'refines';

/**
 * Requirement relationship definition
 */
export interface RequirementRelationship {
  sourceId: string;
  targetId: string;
  type: RequirementRelationType;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Requirement validation result
 */
export interface RequirementValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }[];
}

/**
 * Requirement change event
 */
export interface RequirementChangeEvent {
  type: 'create' | 'update' | 'delete' | 'link' | 'unlink';
  requirementId: string;
  changes?: Partial<Requirement>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
