/**
 * Code Generation types for the Cognitive Tools Integration
 */

import { PatternType } from './index';
import { ImplementationComponentType } from './project';

// Code Generation types
export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  type: CodeTemplateType;
  language: ProgrammingLanguage;
  framework?: string;
  content: string;
  variables: TemplateVariable[];
  examples: string[];
  metadata: CodeTemplateMetadata;
  createdAt: string;
  updatedAt: string;
}

export enum CodeTemplateType {
  COMPONENT = 'component',
  SERVICE = 'service',
  MODEL = 'model',
  CONTROLLER = 'controller',
  UTILITY = 'utility',
  TEST = 'test',
  CONFIGURATION = 'configuration',
  DOCUMENTATION = 'documentation',
  OTHER = 'other'
}

export enum ProgrammingLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  GO = 'go',
  RUST = 'rust',
  RUBY = 'ruby',
  PHP = 'php',
  SWIFT = 'swift',
  KOTLIN = 'kotlin',
  HTML = 'html',
  CSS = 'css',
  SQL = 'sql',
  SHELL = 'shell',
  OTHER = 'other'
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: TemplateVariableType;
  defaultValue?: string;
  options?: string[];
  isRequired: boolean;
  validationRegex?: string;
}

export enum TemplateVariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
  CODE = 'code',
  JSON = 'json',
  OTHER = 'other'
}

export interface CodeTemplateMetadata {
  tags: string[];
  patternTypes: PatternType[];
  componentTypes: ImplementationComponentType[];
  complexity: ComplexityLevel;
  usageCount: number;
  rating: number;
  author?: string;
  relatedTemplateIds?: string[];
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very_complex'
}

// Code Generation Request types
export interface CodeGenerationRequest {
  id: string;
  templateId: string;
  projectId?: string;
  name: string;
  description: string;
  variables: Record<string, string>;
  outputPath?: string;
  metadata: CodeGenerationMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CodeGenerationMetadata {
  tags: string[];
  requester?: string;
  purpose?: string;
  relatedRequirementIds?: string[];
  relatedComponentIds?: string[];
}

// Code Generation Result types
export interface CodeGenerationResult {
  id: string;
  requestId: string;
  status: CodeGenerationStatus;
  files: GeneratedFile[];
  errors?: string[];
  warnings?: string[];
  metadata: CodeGenerationResultMetadata;
  createdAt: string;
  updatedAt: string;
}

export enum CodeGenerationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: ProgrammingLanguage;
  templateId: string;
  lineCount: number;
  checksum: string;
}

export interface CodeGenerationResultMetadata {
  generationTime: number;
  templateVariations?: number;
  optimizationApplied?: boolean;
  qualityScore?: number;
}

// Code Template Search Options
export interface CodeTemplateSearchOptions {
  limit?: number;
  types?: CodeTemplateType[];
  languages?: ProgrammingLanguage[];
  frameworks?: string[];
  tags?: string[];
  patternTypes?: PatternType[];
  componentTypes?: ImplementationComponentType[];
  minRating?: number;
}

// Code Generation Search Options
export interface CodeGenerationSearchOptions {
  limit?: number;
  projectId?: string;
  templateId?: string;
  statuses?: CodeGenerationStatus[];
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

// Code Template Result
export interface CodeTemplateResult {
  template: CodeTemplate;
  score: number;
}

// Code Optimization types
export interface CodeOptimizationRequest {
  id: string;
  content: string;
  language: ProgrammingLanguage;
  optimizationTypes: OptimizationType[];
  constraints?: OptimizationConstraint[];
  metadata: CodeOptimizationMetadata;
  createdAt: string;
  updatedAt: string;
}

export enum OptimizationType {
  PERFORMANCE = 'performance',
  READABILITY = 'readability',
  MAINTAINABILITY = 'maintainability',
  SECURITY = 'security',
  MEMORY = 'memory',
  SIZE = 'size',
  COMPATIBILITY = 'compatibility',
  OTHER = 'other'
}

export interface OptimizationConstraint {
  type: OptimizationConstraintType;
  value: string;
}

export enum OptimizationConstraintType {
  MAX_EXECUTION_TIME = 'max_execution_time',
  MAX_MEMORY_USAGE = 'max_memory_usage',
  MIN_COMPATIBILITY = 'min_compatibility',
  CODING_STANDARD = 'coding_standard',
  FRAMEWORK_VERSION = 'framework_version',
  OTHER = 'other'
}

export interface CodeOptimizationMetadata {
  tags: string[];
  requester?: string;
  purpose?: string;
  relatedFileIds?: string[];
}

export interface CodeOptimizationResult {
  id: string;
  requestId: string;
  status: CodeOptimizationStatus;
  originalContent: string;
  optimizedContent: string;
  changes: CodeChange[];
  metrics: OptimizationMetrics;
  createdAt: string;
  updatedAt: string;
}

export enum CodeOptimizationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface CodeChange {
  type: CodeChangeType;
  description: string;
  lineStart: number;
  lineEnd: number;
  originalCode: string;
  newCode: string;
  optimizationType: OptimizationType;
  impact: ImpactLevel;
}

export enum CodeChangeType {
  REFACTOR = 'refactor',
  OPTIMIZE = 'optimize',
  FIX = 'fix',
  ENHANCE = 'enhance',
  REMOVE = 'remove',
  ADD = 'add',
  OTHER = 'other'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface OptimizationMetrics {
  executionTimeImprovement?: number;
  memoryUsageImprovement?: number;
  codeSizeReduction?: number;
  complexityReduction?: number;
  readabilityImprovement?: number;
  securityImprovement?: number;
  overallImprovement: number;
}
