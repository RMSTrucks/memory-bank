import { FileError, FileErrorCode } from '../types/files';

/**
 * Error thrown when a file is not found
 */
export class FileNotFoundError extends FileError {
    constructor(path: string, operation: string, details?: Record<string, unknown>) {
        super(
            FileErrorCode.NOT_FOUND,
            `File not found: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'FileNotFoundError';
    }
}

/**
 * Error thrown when file access is denied
 */
export class FileAccessError extends FileError {
    constructor(path: string, operation: string, details?: Record<string, unknown>) {
        super(
            FileErrorCode.ACCESS_DENIED,
            `Access denied to file: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'FileAccessError';
    }
}

/**
 * Error thrown when a file already exists
 */
export class FileExistsError extends FileError {
    constructor(path: string, operation: string, details?: Record<string, unknown>) {
        super(
            FileErrorCode.ALREADY_EXISTS,
            `File already exists: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'FileExistsError';
    }
}

/**
 * Error thrown when a file path is invalid
 */
export class FilePathError extends FileError {
    constructor(path: string, operation: string, details?: Record<string, unknown>) {
        super(
            FileErrorCode.INVALID_PATH,
            `Invalid file path: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'FilePathError';
    }
}

/**
 * Error thrown when file validation fails
 */
export class FileValidationError extends FileError {
    constructor(
        path: string,
        operation: string,
        reason: string,
        details?: Record<string, unknown>
    ) {
        super(
            FileErrorCode.VALIDATION_FAILED,
            `Validation failed for ${path}: ${reason}`,
            path,
            operation,
            details
        );
        this.name = 'FileValidationError';
    }
}

/**
 * Error thrown when a file is locked
 */
export class FileLockError extends FileError {
    constructor(
        path: string,
        operation: string,
        holder: string,
        details?: Record<string, unknown>
    ) {
        super(
            FileErrorCode.LOCKED,
            `File is locked by ${holder}: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'FileLockError';
    }
}

/**
 * Error thrown when a file operation times out
 */
export class FileTimeoutError extends FileError {
    constructor(
        path: string,
        operation: string,
        timeout: number,
        details?: Record<string, unknown>
    ) {
        super(
            FileErrorCode.TIMEOUT,
            `Operation timed out after ${timeout}ms: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'FileTimeoutError';
    }
}

/**
 * Error thrown when file backup fails
 */
export class FileBackupError extends FileError {
    constructor(path: string, operation: string, details?: Record<string, unknown>) {
        super(
            FileErrorCode.BACKUP_FAILED,
            `Failed to create backup for: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'FileBackupError';
    }
}

/**
 * Error thrown when git operations fail
 */
export class GitError extends FileError {
    constructor(path: string, operation: string, details?: Record<string, unknown>) {
        super(
            FileErrorCode.GIT_ERROR,
            `Git operation failed for: ${path}`,
            path,
            operation,
            details
        );
        this.name = 'GitError';
    }
}

/**
 * Helper function to create appropriate error instance
 */
export function createFileError(
    code: FileErrorCode,
    path: string,
    operation: string,
    details?: Record<string, unknown>
): FileError {
    switch (code) {
        case FileErrorCode.NOT_FOUND:
            return new FileNotFoundError(path, operation, details);
        case FileErrorCode.ACCESS_DENIED:
            return new FileAccessError(path, operation, details);
        case FileErrorCode.ALREADY_EXISTS:
            return new FileExistsError(path, operation, details);
        case FileErrorCode.INVALID_PATH:
            return new FilePathError(path, operation, details);
        case FileErrorCode.VALIDATION_FAILED:
            return new FileValidationError(path, operation, 'Unknown validation error', details);
        case FileErrorCode.LOCKED:
            return new FileLockError(path, operation, 'Unknown', details);
        case FileErrorCode.TIMEOUT:
            return new FileTimeoutError(path, operation, 30000, details);
        case FileErrorCode.BACKUP_FAILED:
            return new FileBackupError(path, operation, details);
        case FileErrorCode.GIT_ERROR:
            return new GitError(path, operation, details);
        default:
            return new FileError(
                FileErrorCode.UNKNOWN,
                `Unknown error for file: ${path}`,
                path,
                operation,
                details
            );
    }
}
