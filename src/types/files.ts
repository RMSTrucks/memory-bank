/**
 * Core types for file operations in the Memory Bank system
 */

/**
 * Base interface for all file operations
 * Ensures operations are atomic and can be rolled back
 */
export interface FileOperation<T> {
    /** Execute the file operation */
    execute(): Promise<T>;
    /** Roll back the operation in case of failure */
    rollback(): Promise<void>;
    /** Validate the operation before execution */
    validate(): Promise<boolean>;
}

/**
 * Metadata about a file in the system
 */
export interface FileMetadata {
    /** Relative path to the file */
    path: string;
    /** Last modification timestamp */
    lastModified: Date;
    /** File size in bytes */
    size: number;
    /** Content hash for change detection */
    hash: string;
    /** Version number for tracking changes */
    version: number;
    /** Git commit hash if available */
    commitHash?: string;
    /** Additional custom metadata */
    custom?: Record<string, unknown>;
}

/**
 * File content with associated metadata
 */
export interface FileContent {
    /** Raw file content */
    raw: string;
    /** File metadata */
    metadata: FileMetadata;
    /** Parsed content if available */
    parsed?: unknown;
}

/**
 * Result of a file operation
 */
export interface FileOperationResult<T> {
    /** Whether the operation succeeded */
    success: boolean;
    /** Operation result data if successful */
    data?: T;
    /** Error information if failed */
    error?: FileError;
    /** Operation metadata */
    metadata: {
        /** Operation duration in milliseconds */
        duration: number;
        /** Operation timestamp */
        timestamp: Date;
        /** Operation type */
        operation: string;
        /** Additional operation details */
        details?: Record<string, unknown>;
    };
}

/**
 * File operation options
 */
export interface FileOperationOptions {
    /** Whether to create backup before operation */
    createBackup?: boolean;
    /** Whether to commit changes to git */
    commitToGit?: boolean;
    /** Operation timeout in milliseconds */
    timeout?: number;
    /** Whether to validate content */
    validate?: boolean;
    /** Whether to force operation (e.g., overwrite existing files) */
    force?: boolean;
    /** Custom operation metadata */
    metadata?: Record<string, unknown>;
}

/**
 * File operation events
 */
export type FileEventType =
    | 'file.created'
    | 'file.modified'
    | 'file.deleted'
    | 'file.moved'
    | 'file.error'
    | 'file.validated'
    | 'file.locked'
    | 'file.unlocked';

/**
 * File event data
 */
export interface FileEvent {
    /** Event type */
    type: FileEventType;
    /** File path */
    path: string;
    /** Event timestamp */
    timestamp: Date;
    /** Event metadata */
    metadata?: FileMetadata;
    /** Event details */
    details?: Record<string, unknown>;
}

/**
 * File lock information
 */
export interface FileLock {
    /** File path */
    path: string;
    /** Lock holder identifier */
    holder: string;
    /** Lock acquisition time */
    acquiredAt: Date;
    /** Lock timeout */
    timeout: number;
    /** Lock metadata */
    metadata?: Record<string, unknown>;
}

/**
 * File operation context
 */
export interface FileContext {
    /** Operation path */
    path: string;
    /** Operation options */
    options?: FileOperationOptions;
    /** Lock information */
    lock?: FileLock;
    /** Operation start time */
    startTime: Date;
    /** Operation metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Base error type for file operations
 */
export class FileError extends Error {
    constructor(
        /** Error code */
        public code: string,
        /** Error message */
        message: string,
        /** File path */
        public path: string,
        /** Operation that caused error */
        public operation: string,
        /** Additional error details */
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'FileError';
    }
}

/**
 * Error codes for file operations
 */
export enum FileErrorCode {
    NOT_FOUND = 'FILE_NOT_FOUND',
    ACCESS_DENIED = 'ACCESS_DENIED',
    ALREADY_EXISTS = 'ALREADY_EXISTS',
    INVALID_PATH = 'INVALID_PATH',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    LOCKED = 'FILE_LOCKED',
    TIMEOUT = 'OPERATION_TIMEOUT',
    BACKUP_FAILED = 'BACKUP_FAILED',
    GIT_ERROR = 'GIT_ERROR',
    UNKNOWN = 'UNKNOWN_ERROR'
}
