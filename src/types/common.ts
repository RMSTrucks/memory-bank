/**
 * Common priority levels used throughout the system
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Common status values used throughout the system
 */
export type Status = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

/**
 * Common severity levels used throughout the system
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Common result type for operations that can succeed or fail
 */
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Common metadata type used throughout the system
 */
export interface Metadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Common validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    severity: Severity;
  }[];
}

/**
 * Common type for paginated results
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Common type for search/filter criteria
 */
export interface SearchCriteria {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}

/**
 * Common type for event data
 */
export interface EventData {
  type: string;
  payload: unknown;
  metadata?: Metadata;
  timestamp: Date;
}

/**
 * Common type for configuration options
 */
export interface ConfigOptions {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  [key: string]: unknown;
}
