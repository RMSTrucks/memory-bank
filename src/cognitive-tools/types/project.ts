/**
 * Project-related types for the Cognitive Tools Integration
 */

import { ImportanceLevel, KnowledgeType } from './index';

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  metadata: ProjectMetadata;
  requirements: Requirement[];
  architecture: ArchitectureComponent[];
  implementation: ImplementationComponent[];
  testing: TestComponent[];
  deployment: DeploymentComponent[];
  createdAt: string;
  updatedAt: string;
}

export enum ProjectType {
  WEB_APP = 'web_app',
  MOBILE_APP = 'mobile_app',
  API = 'api',
  LIBRARY = 'library',
  DESKTOP_APP = 'desktop_app',
  CLI = 'cli',
  OTHER = 'other'
}

export enum ProjectStatus {
  PLANNING = 'planning',
  REQUIREMENTS = 'requirements',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance',
  COMPLETED = 'completed'
}

export interface ProjectMetadata {
  tags: string[];
  importance: ImportanceLevel;
  startDate: string;
  targetEndDate?: string;
  actualEndDate?: string;
  stakeholders?: string[];
  repository?: string;
  relatedProjects?: string[];
  relatedKnowledgeIds?: string[];
}

// Requirement types
export interface Requirement {
  id: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  acceptanceCriteria: string[];
  dependencies?: string[];
  relatedKnowledgeIds?: string[];
}

export enum RequirementType {
  FUNCTIONAL = 'functional',
  NON_FUNCTIONAL = 'non_functional',
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  USER = 'user',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  OTHER = 'other'
}

export enum RequirementPriority {
  MUST_HAVE = 'must_have',
  SHOULD_HAVE = 'should_have',
  COULD_HAVE = 'could_have',
  WONT_HAVE = 'wont_have'
}

export enum RequirementStatus {
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  IMPLEMENTED = 'implemented',
  TESTED = 'tested',
  DELIVERED = 'delivered',
  REJECTED = 'rejected'
}

// Architecture types
export interface ArchitectureComponent {
  id: string;
  name: string;
  description: string;
  type: ArchitectureComponentType;
  dependencies?: string[];
  interfaces?: Interface[];
  patterns?: string[];
  technologies?: string[];
  relatedKnowledgeIds?: string[];
}

export enum ArchitectureComponentType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  API = 'api',
  SERVICE = 'service',
  LIBRARY = 'library',
  INFRASTRUCTURE = 'infrastructure',
  SECURITY = 'security',
  OTHER = 'other'
}

export interface Interface {
  name: string;
  description: string;
  methods: Method[];
}

export interface Method {
  name: string;
  description: string;
  parameters: Parameter[];
  returnType: string;
  exceptions?: string[];
}

export interface Parameter {
  name: string;
  type: string;
  description: string;
  isRequired: boolean;
  defaultValue?: string;
}

// Implementation types
export interface ImplementationComponent {
  id: string;
  name: string;
  description: string;
  type: ImplementationComponentType;
  status: ImplementationStatus;
  dependencies?: string[];
  files?: ImplementationFile[];
  relatedRequirements?: string[];
  relatedArchitectureComponents?: string[];
  relatedKnowledgeIds?: string[];
}

export enum ImplementationComponentType {
  COMPONENT = 'component',
  MODULE = 'module',
  SERVICE = 'service',
  UTILITY = 'utility',
  MODEL = 'model',
  CONTROLLER = 'controller',
  VIEW = 'view',
  OTHER = 'other'
}

export enum ImplementationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  DEPRECATED = 'deprecated'
}

export interface ImplementationFile {
  path: string;
  description: string;
  language: string;
  status: ImplementationStatus;
  dependencies?: string[];
  generatedFrom?: string;
}

// Testing types
export interface TestComponent {
  id: string;
  name: string;
  description: string;
  type: TestType;
  status: TestStatus;
  coverage?: number;
  testCases?: TestCase[];
  relatedImplementationComponents?: string[];
  relatedKnowledgeIds?: string[];
}

export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  FUNCTIONAL = 'functional',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  ACCEPTANCE = 'acceptance',
  OTHER = 'other'
}

export enum TestStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status: TestStatus;
}

// Deployment types
export interface DeploymentComponent {
  id: string;
  name: string;
  description: string;
  type: DeploymentType;
  status: DeploymentStatus;
  environment: DeploymentEnvironment;
  configuration?: Record<string, string>;
  dependencies?: string[];
  relatedImplementationComponents?: string[];
  relatedKnowledgeIds?: string[];
}

export enum DeploymentType {
  SERVER = 'server',
  CONTAINER = 'container',
  SERVERLESS = 'serverless',
  STATIC = 'static',
  DATABASE = 'database',
  CACHE = 'cache',
  CDN = 'cdn',
  OTHER = 'other'
}

export enum DeploymentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

export enum DeploymentEnvironment {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

// Project search options
export interface ProjectSearchOptions {
  limit?: number;
  types?: ProjectType[];
  statuses?: ProjectStatus[];
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

// Project result
export interface ProjectResult {
  project: Project;
  score: number;
}

// Knowledge-Project Integration types
export interface KnowledgeProjectLink {
  id: string;
  knowledgeId: string;
  projectId: string;
  linkType: KnowledgeProjectLinkType;
  relevance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum KnowledgeProjectLinkType {
  REQUIREMENT = 'requirement',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  GENERAL = 'general'
}

export interface KnowledgeProjectSearchOptions {
  projectId?: string;
  knowledgeId?: string;
  linkTypes?: KnowledgeProjectLinkType[];
  minRelevance?: number;
}
