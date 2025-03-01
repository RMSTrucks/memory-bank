/**
 * Types for Knowledge-Project Integration
 *
 * This file defines the types and interfaces for integrating knowledge with project management.
 * It enables connecting project requirements to implementation knowledge, pattern-based
 * implementation planning, and knowledge retrieval for implementation decisions.
 */

import {
  Project,
  Requirement,
  ArchitectureComponent,
  ImplementationComponent,
  TestComponent,
  DeploymentComponent,
  KnowledgeProjectLinkType as ProjectLinkType
} from './project';

/**
 * Represents a knowledge item that can be linked to project elements
 */
export interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  title: string;
  description: string;
  content: string;
  tags: string[];
  relevanceScore?: number;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Types of knowledge items
 */
export enum KnowledgeItemType {
  CONCEPT = 'concept',
  PATTERN = 'pattern',
  IMPLEMENTATION = 'implementation',
  DECISION = 'decision',
  REFERENCE = 'reference',
  EXAMPLE = 'example',
  BEST_PRACTICE = 'best_practice',
  LESSON_LEARNED = 'lesson_learned'
}

/**
 * Represents a link between a project element and a knowledge item
 */
export interface KnowledgeProjectLink {
  id: string;
  projectElementId: string;
  projectElementType: ProjectElementType;
  knowledgeItemId: string;
  linkType: KnowledgeProjectLinkType;
  relevanceScore: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Types of project elements that can be linked to knowledge
 */
export enum ProjectElementType {
  PROJECT = 'project',
  REQUIREMENT = 'requirement',
  COMPONENT = 'component',
  TASK = 'task',
  DECISION = 'decision'
}

/**
 * Types of links between knowledge and project elements
 */
export enum KnowledgeProjectLinkType {
  IMPLEMENTS = 'implements',
  REFERENCES = 'references',
  DEPENDS_ON = 'depends_on',
  INFLUENCED_BY = 'influenced_by',
  SIMILAR_TO = 'similar_to',
  ALTERNATIVE_TO = 'alternative_to',
  DERIVED_FROM = 'derived_from'
}

/**
 * Context for a project, including relevant knowledge items
 */
export interface ProjectContext {
  id: string;
  projectId: string;
  name: string;
  description: string;
  version: string;
  relevantKnowledge: KnowledgeItem[];
  knowledgeLinks: KnowledgeProjectLink[];
  requirements: ProjectRequirementContext[];
  architecture: ProjectArchitectureContext[];
  implementation: ProjectImplementationContext[];
  decisions: ProjectDecisionContext[];
  status: ProjectContextStatus;
  metadata: Record<string, any>;
  history: ContextChange[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status of a project context
 */
export enum ProjectContextStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

/**
 * Change record for tracking context changes
 */
export interface ContextChange {
  id: string;
  timestamp: Date;
  type: ContextChangeType;
  component: ContextComponentType;
  itemId: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  userId?: string;
}

/**
 * Type of context change
 */
export enum ContextChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

/**
 * Type of context component
 */
export enum ContextComponentType {
  CONTEXT = 'context',
  REQUIREMENT = 'requirement',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  DECISION = 'decision',
  KNOWLEDGE = 'knowledge',
  LINK = 'link'
}

/**
 * Context for project requirements
 */
export interface ProjectRequirementContext {
  id: string;
  requirementId: string;
  relevantKnowledgeIds: string[];
  status: string;
  metadata: Record<string, any>;
}

/**
 * Context for project architecture
 */
export interface ProjectArchitectureContext {
  id: string;
  componentId: string;
  relevantKnowledgeIds: string[];
  status: string;
  metadata: Record<string, any>;
}

/**
 * Context for project implementation
 */
export interface ProjectImplementationContext {
  id: string;
  componentId: string;
  relevantKnowledgeIds: string[];
  status: string;
  metadata: Record<string, any>;
}

/**
 * Context for project decisions
 */
export interface ProjectDecisionContext {
  id: string;
  decisionId: string;
  relevantKnowledgeIds: string[];
  status: string;
  metadata: Record<string, any>;
}

/**
 * Parameters for creating a project context
 */
export interface CreateProjectContextParams {
  projectId: string;
  name?: string;
  description?: string;
  includeRequirements?: boolean;
  includeComponents?: boolean;
  includeTasks?: boolean;
  includeDecisions?: boolean;
  maxResults?: number;
  minRelevanceScore?: number;
  metadata?: Record<string, any>;
}

/**
 * Parameters for updating a project context
 */
export interface UpdateProjectContextParams {
  contextId: string;
  name?: string;
  description?: string;
  version?: string;
  status?: ProjectContextStatus;
  metadata?: Record<string, any>;
  reason?: string;
  userId?: string;
}

/**
 * Result of a context validation operation
 */
export interface ContextValidationResult {
  isValid: boolean;
  errors: ContextValidationError[];
  warnings: ContextValidationWarning[];
}

/**
 * Error from context validation
 */
export interface ContextValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error';
}

/**
 * Warning from context validation
 */
export interface ContextValidationWarning {
  code: string;
  message: string;
  path: string;
  severity: 'warning';
}

/**
 * Parameters for serializing a project context
 */
export interface SerializeContextParams {
  context: ProjectContext;
  format?: 'json' | 'yaml';
  includeHistory?: boolean;
  prettyPrint?: boolean;
}

/**
 * Parameters for deserializing a project context
 */
export interface DeserializeContextParams {
  serialized: string;
  format?: 'json' | 'yaml';
  validate?: boolean;
}

/**
 * Parameters for retrieving relevant knowledge
 */
export interface RetrieveKnowledgeParams {
  query: string;
  projectId?: string;
  knowledgeTypes?: KnowledgeItemType[];
  tags?: string[];
  maxResults?: number;
  minRelevanceScore?: number;
}

/**
 * Result of a knowledge retrieval operation
 */
export interface KnowledgeRetrievalResult {
  query: string;
  results: KnowledgeItem[];
  totalResults: number;
  executionTimeMs: number;
}

/**
 * Parameters for linking knowledge to project elements
 */
export interface LinkKnowledgeParams {
  projectElementId: string;
  projectElementType: ProjectElementType;
  knowledgeItemId: string;
  linkType: KnowledgeProjectLinkType;
  relevanceScore?: number;
  notes?: string;
}

/**
 * Decision record for tracking project decisions
 */
export interface ProjectDecision {
  id: string;
  projectId: string;
  title: string;
  description: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  consequences: string;
  relatedKnowledgeIds: string[];
  status: DecisionStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status of a project decision
 */
export enum DecisionStatus {
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  SUPERSEDED = 'superseded',
  DEPRECATED = 'deprecated'
}

/**
 * Parameters for creating a project decision
 */
export interface CreateDecisionParams {
  projectId: string;
  title: string;
  description: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives?: string[];
  consequences?: string;
  relatedKnowledgeIds?: string[];
  status?: DecisionStatus;
  createdBy?: string;
}

/**
 * Implementation plan generated from project requirements and knowledge
 */
export interface ImplementationPlan {
  id: string;
  projectId: string;
  title: string;
  description: string;
  requirements: Requirement[];
  architectureComponents: ArchitectureComponent[];
  implementationComponents: ImplementationComponent[];
  testComponents: TestComponent[];
  deploymentComponents: DeploymentComponent[];
  knowledgeReferences: KnowledgeProjectLink[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parameters for generating an implementation plan
 */
export interface GenerateImplementationPlanParams {
  projectId: string;
  title: string;
  description?: string;
  requirementIds?: string[];
  usePatterns?: boolean;
  optimizeFor?: OptimizationCriteria[];
}

/**
 * Criteria for optimizing implementation plans
 */
export enum OptimizationCriteria {
  DEVELOPMENT_SPEED = 'development_speed',
  CODE_QUALITY = 'code_quality',
  MAINTAINABILITY = 'maintainability',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  SCALABILITY = 'scalability'
}
