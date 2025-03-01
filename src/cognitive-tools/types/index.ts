/**
 * Core types for the Cognitive Tools Integration
 */

// Export all types from project and code-generation
export * from './project';
export * from './code-generation';

// Knowledge types
export interface Knowledge {
  id: string;
  content: string;
  type: KnowledgeType;
  metadata: KnowledgeMetadata;
  vector?: number[];
  createdAt: string;
  updatedAt: string;
}

export enum KnowledgeType {
  CONCEPT = 'concept',
  PATTERN = 'pattern',
  DECISION = 'decision',
  LEARNING = 'learning',
  CODE = 'code',
  DOCUMENTATION = 'documentation',
  OTHER = 'other'
}

export interface KnowledgeMetadata {
  title: string;
  description: string;
  tags: string[];
  importance: ImportanceLevel;
  source?: string;
  relatedIds?: string[];
}

export enum ImportanceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface KnowledgeResult {
  knowledge: Knowledge;
  score: number;
}

export interface SearchOptions {
  limit?: number;
  types?: KnowledgeType[];
  importance?: ImportanceLevel[];
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

// Pattern types
export interface Pattern {
  id: string;
  name: string;
  description: string;
  type: PatternType;
  content: string;
  examples: string[];
  metadata: PatternMetadata;
  createdAt: string;
  updatedAt: string;
}

export enum PatternType {
  SEQUENCE = 'sequence',
  PARALLEL = 'parallel',
  TEMPORAL = 'temporal',
  SEMANTIC = 'semantic',
  STRUCTURAL = 'structural',
  BEHAVIORAL = 'behavioral'
}

export interface PatternMetadata {
  effectiveness: number;
  confidence: number;
  usageCount: number;
  tags: string[];
  relatedPatternIds?: string[];
}

// Memory types
export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  metadata: MemoryMetadata;
  createdAt: string;
  updatedAt: string;
}

export enum MemoryType {
  CONCEPT = 'concept',
  PATTERN = 'pattern',
  DECISION = 'decision',
  LEARNING = 'learning',
  INTERACTION = 'interaction',
  MILESTONE = 'milestone',
  OTHER = 'other'
}

export interface MemoryMetadata {
  title: string;
  description: string;
  tags: string[];
  importance: ImportanceLevel;
  source?: string;
  relatedIds?: string[];
}

export interface MemoryOptions {
  limit?: number;
  types?: MemoryType[];
  importance?: ImportanceLevel[];
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

// Visualization types
export enum DiagramType {
  FLOWCHART = 'flowchart',
  SEQUENCE = 'sequence',
  CLASS = 'class',
  STATE = 'state',
  ENTITY_RELATIONSHIP = 'er',
  GANTT = 'gantt',
  PIE = 'pie'
}

// API types
export interface ApiRequest {
  command: string;
  params: Record<string, any>;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Error types
export class CognitiveToolsError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'CognitiveToolsError';
  }
}

export enum ErrorCode {
  INVALID_REQUEST = 'invalid_request',
  NOT_FOUND = 'not_found',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  INTERNAL_ERROR = 'internal_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  VALIDATION_ERROR = 'validation_error'
}
