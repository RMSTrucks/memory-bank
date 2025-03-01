import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { LockManager } from '../utils/lock-manager';
import { BackupManager } from '../utils/backup-manager';
import { FileValidator } from '../utils/file-validator';
import {
    FileOperation,
    FileContent,
    FileMetadata,
    FileOperationResult,
    FileOperationOptions,
    FileError
} from '../types/files';
import {
    FileNotFoundError,
    FileAccessError,
    FileExistsError,
    FilePathError,
    FileValidationError
} from '../errors/file-errors';
import {
    ContentFormat,
    ContentEncoding,
    ValidationOptions
} from '../types/validation';

/**
 * Service for handling file operations with safety mechanisms
 */
export class FileOperationsService {
    private lockManager: LockManager;
    private backupManager: BackupManager;
    private validator: FileValidator;

    constructor(
        private baseDir: string = process.cwd(),
        lockTimeout: number = 30000,
        maxBackups: number = 10
    ) {
        this.lockManager = new LockManager(lockTimeout);
        this.backupManager = new BackupManager('.backups', maxBackups);
        this.validator = new FileValidator();
    }

    /**
     * Read a file with locking and validation
     */
    async readFile(
        filePath: string,
        options?: FileOperationOptions
    ): Promise<FileOperationResult<FileContent>> {
        const operation = new ReadFileOperation(
            this.resolvePath(filePath),
            this.lockManager,
            this.validator,
            options
        );

        return this.executeOperation(operation);
    }

    /**
     * Write to a file with locking, backup, and validation
     */
    async writeFile(
        filePath: string,
        content: string,
        options?: FileOperationOptions
    ): Promise<FileOperationResult<void>> {
        const operation = new WriteFileOperation(
            this.resolvePath(filePath),
            content,
            this.lockManager,
            this.backupManager,
            this.validator,
            options
        );

        return this.executeOperation(operation);
    }

    /**
     * Delete a file with locking and backup
     */
    async deleteFile(
        filePath: string,
        options?: FileOperationOptions
    ): Promise<FileOperationResult<void>> {
        const operation = new DeleteFileOperation(
            this.resolvePath(filePath),
            this.lockManager,
            this.backupManager,
            this.validator,
            options
        );

        return this.executeOperation(operation);
    }

    /**
     * Move a file with locking and backup
     */
    async moveFile(
        sourcePath: string,
        targetPath: string,
        options?: FileOperationOptions
    ): Promise<FileOperationResult<void>> {
        const operation = new MoveFileOperation(
            this.resolvePath(sourcePath),
            this.resolvePath(targetPath),
            this.lockManager,
            this.backupManager,
            this.validator,
            options
        );

        return this.executeOperation(operation);
    }

    /**
     * List files in a directory
     */
    async listFiles(dirPath: string): Promise<FileOperationResult<FileMetadata[]>> {
        const operation = new ListFilesOperation(
            this.resolvePath(dirPath),
            this.lockManager,
            this.validator
        );

        return this.executeOperation(operation);
    }

    /**
     * Execute a file operation with timing and error handling
     */
    private async executeOperation<T>(
        operation: FileOperation<T>
    ): Promise<FileOperationResult<T>> {
        const startTime = Date.now();

        try {
            // Validate operation
            await operation.validate();

            // Execute operation
            const data = await operation.execute();

            return {
                success: true,
                data,
                metadata: {
                    duration: Date.now() - startTime,
                    timestamp: new Date(),
                    operation: operation.constructor.name
                }
            };
        } catch (error) {
            // Attempt rollback
            try {
                await operation.rollback();
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
            }

            // Convert error to FileError if needed
            const fileError = error instanceof FileError
                ? error
                : new FileError(
                    'UNKNOWN',
                    error instanceof Error ? error.message : 'Unknown error',
                    operation.constructor.name,
                    'execute',
                    { originalError: error }
                );

            return {
                success: false,
                error: fileError,
                metadata: {
                    duration: Date.now() - startTime,
                    timestamp: new Date(),
                    operation: operation.constructor.name
                }
            };
        }
    }

    /**
     * Resolve a path relative to the base directory
     */
    private resolvePath(filePath: string): string {
        const resolvedPath = path.resolve(this.baseDir, filePath);

        // Ensure path is within base directory
        if (!resolvedPath.startsWith(this.baseDir)) {
            throw new FilePathError(
                filePath,
                'resolve',
                { baseDir: this.baseDir }
            );
        }

        return resolvedPath;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.lockManager.destroy();
    }
}

/**
 * Read file operation implementation
 */
class ReadFileOperation implements FileOperation<FileContent> {
    constructor(
        private path: string,
        private lockManager: LockManager,
        private validator: FileValidator,
        private options?: FileOperationOptions
    ) {}

    async validate(): Promise<boolean> {
        // Check if file exists
        try {
            await fsPromises.access(this.path);
        } catch {
            throw new FileNotFoundError(this.path, 'read');
        }

        // Validate path and permissions
        const validationOptions: ValidationOptions = {
            path: {
                baseDir: path.dirname(this.path)
            },
            permissions: {
                requireRead: true
            }
        };

        const result = await this.validator.validate(
            this.path,
            '',
            { path: this.path } as FileMetadata,
            validationOptions
        );

        if (!result.isValid) {
            throw new FileValidationError(this.path, 'read', result.errors[0]?.message || 'Validation failed');
        }

        return true;
    }

    async execute(): Promise<FileContent> {
        const lock = await this.lockManager.acquire(this.path, 'read');

        try {
            const content = await fsPromises.readFile(this.path, 'utf8');
            const stats = await fsPromises.stat(this.path);

            const metadata: FileMetadata = {
                path: this.path,
                lastModified: stats.mtime,
                size: stats.size,
                hash: '', // Could calculate hash if needed
                version: 1
            };

            // Validate content and metadata
            const validationOptions: ValidationOptions = {
                content: {
                    encoding: ContentEncoding.UTF8
                },
                metadata: {
                    requiredFields: ['path', 'lastModified', 'size']
                }
            };

            const result = await this.validator.validate(
                this.path,
                content,
                metadata,
                validationOptions
            );

            if (!result.isValid) {
                throw new FileValidationError(this.path, 'read', result.errors[0]?.message || 'Content validation failed');
            }

            return { raw: content, metadata };
        } finally {
            await this.lockManager.release(this.path, 'read');
        }
    }

    async rollback(): Promise<void> {
        // Nothing to roll back for read operation
    }
}

/**
 * Write file operation implementation
 */
class WriteFileOperation implements FileOperation<void> {
    constructor(
        private path: string,
        private content: string,
        private lockManager: LockManager,
        private backupManager: BackupManager,
        private validator: FileValidator,
        private options?: FileOperationOptions
    ) {}

    async validate(): Promise<boolean> {
        // Create parent directory if it doesn't exist
        const dir = path.dirname(this.path);
        await fsPromises.mkdir(dir, { recursive: true });

        // Create empty file if it doesn't exist
        try {
            await fsPromises.access(this.path);
        } catch {
            await fsPromises.writeFile(this.path, '');
        }

        // Validate path and permissions
        const validationOptions: ValidationOptions = {
            path: {
                baseDir: path.dirname(this.path)
            },
            permissions: {
                requireWrite: true
            },
            content: {
                encoding: ContentEncoding.UTF8,
                sizeLimits: {
                    maxSize: 1024 * 1024 * 10 // 10MB
                }
            }
        };

        const result = await this.validator.validate(
            this.path,
            this.content,
            { path: this.path } as FileMetadata,
            validationOptions
        );

        if (!result.isValid) {
            throw new FileValidationError(this.path, 'write', result.errors[0]?.message || 'Validation failed');
        }

        return true;
    }

    async execute(): Promise<void> {
        const lock = await this.lockManager.acquire(this.path, 'write');
        let backupPath: string | undefined;

        try {
            // Create backup if file exists and backup is enabled
            if (
                this.options?.createBackup !== false &&
                fs.existsSync(this.path)
            ) {
                backupPath = await this.backupManager.createBackup(this.path);
            }

            // Write file
            await fsPromises.writeFile(this.path, this.content, 'utf8');
        } catch (error) {
            // Restore from backup if available
            if (backupPath) {
                await this.backupManager.restore(backupPath);
            }
            throw error;
        } finally {
            await this.lockManager.release(this.path, 'write');
        }
    }

    async rollback(): Promise<void> {
        // Rollback handled in execute
    }
}

/**
 * Delete file operation implementation
 */
class DeleteFileOperation implements FileOperation<void> {
    constructor(
        private path: string,
        private lockManager: LockManager,
        private backupManager: BackupManager,
        private validator: FileValidator,
        private options?: FileOperationOptions
    ) {}

    async validate(): Promise<boolean> {
        // Check if file exists
        try {
            await fsPromises.access(this.path);
        } catch {
            throw new FileNotFoundError(this.path, 'delete');
        }

        // Validate path and permissions
        const validationOptions: ValidationOptions = {
            path: {
                baseDir: path.dirname(this.path)
            },
            permissions: {
                requireWrite: true
            }
        };

        const result = await this.validator.validate(
            this.path,
            '',
            { path: this.path } as FileMetadata,
            validationOptions
        );

        if (!result.isValid) {
            throw new FileValidationError(this.path, 'delete', result.errors[0]?.message || 'Validation failed');
        }

        return true;
    }

    async execute(): Promise<void> {
        const lock = await this.lockManager.acquire(this.path, 'delete');
        let backupPath: string | undefined;

        try {
            // Create backup if enabled
            if (this.options?.createBackup !== false) {
                backupPath = await this.backupManager.createBackup(this.path);
            }

            // Delete file
            await fsPromises.unlink(this.path);
        } catch (error) {
            // Restore from backup if available
            if (backupPath) {
                await this.backupManager.restore(backupPath);
            }
            throw error;
        } finally {
            await this.lockManager.release(this.path, 'delete');
        }
    }

    async rollback(): Promise<void> {
        // Rollback handled in execute
    }
}

/**
 * Move file operation implementation
 */
class MoveFileOperation implements FileOperation<void> {
    constructor(
        private sourcePath: string,
        private targetPath: string,
        private lockManager: LockManager,
        private backupManager: BackupManager,
        private validator: FileValidator,
        private options?: FileOperationOptions
    ) {}

    async validate(): Promise<boolean> {
        // Check if source file exists
        try {
            await fsPromises.access(this.sourcePath);
        } catch {
            throw new FileNotFoundError(this.sourcePath, 'move');
        }

        // Create target directory if it doesn't exist
        const targetDir = path.dirname(this.targetPath);
        await fsPromises.mkdir(targetDir, { recursive: true });

        // Validate source and target paths
        const sourceValidation: ValidationOptions = {
            path: {
                baseDir: path.dirname(this.sourcePath)
            },
            permissions: {
                requireRead: true,
                requireWrite: true
            }
        };

        const targetValidation: ValidationOptions = {
            path: {
                baseDir: path.dirname(this.targetPath)
            },
            permissions: {
                requireWrite: true
            }
        };

        const sourceResult = await this.validator.validate(
            this.sourcePath,
            '',
            { path: this.sourcePath } as FileMetadata,
            sourceValidation
        );

        if (!sourceResult.isValid) {
            throw new FileValidationError(this.sourcePath, 'move', sourceResult.errors[0]?.message || 'Source validation failed');
        }

        const targetResult = await this.validator.validate(
            this.targetPath,
            '',
            { path: this.targetPath } as FileMetadata,
            targetValidation
        );

        if (!targetResult.isValid) {
            throw new FileValidationError(this.targetPath, 'move', targetResult.errors[0]?.message || 'Target validation failed');
        }

        // Check target doesn't exist (unless force option)
        if (!this.options?.force) {
            try {
                await fsPromises.access(this.targetPath);
                throw new FileExistsError(this.targetPath, 'move');
            } catch (error) {
                // Target doesn't exist, which is what we want
            }
        }

        return true;
    }

    async execute(): Promise<void> {
        // Acquire locks for both files
        const sourceLock = await this.lockManager.acquire(this.sourcePath, 'move');
        let targetLock = undefined;
        let sourceBackup: string | undefined;
        let targetBackup: string | undefined;

        try {
            targetLock = await this.lockManager.acquire(this.targetPath, 'move');

            // Create backups if enabled
            if (this.options?.createBackup !== false) {
                sourceBackup = await this.backupManager.createBackup(this.sourcePath);
                if (fs.existsSync(this.targetPath)) {
                    targetBackup = await this.backupManager.createBackup(this.targetPath);
                }
            }

            // Move file
            await fsPromises.rename(this.sourcePath, this.targetPath);
        } catch (error) {
            // Restore from backups if available
            if (sourceBackup) {
                await this.backupManager.restore(sourceBackup);
            }
            if (targetBackup) {
                await this.backupManager.restore(targetBackup);
            }
            throw error;
        } finally {
            await this.lockManager.release(this.sourcePath, 'move');
            if (targetLock) {
                await this.lockManager.release(this.targetPath, 'move');
            }
        }
    }

    async rollback(): Promise<void> {
        // Rollback handled in execute
    }
}

/**
 * List files operation implementation
 */
class ListFilesOperation implements FileOperation<FileMetadata[]> {
    constructor(
        private path: string,
        private lockManager: LockManager,
        private validator: FileValidator
    ) {}

    async validate(): Promise<boolean> {
        // Create directory if it doesn't exist
        await fsPromises.mkdir(this.path, { recursive: true });

        // Validate path and permissions
        const validationOptions: ValidationOptions = {
            path: {
                baseDir: path.dirname(this.path)
            },
            permissions: {
                requireRead: true
            }
        };

        const result = await this.validator.validate(
            this.path,
            '',
            { path: this.path } as FileMetadata,
            validationOptions
        );

        if (!result.isValid) {
            throw new FileValidationError(this.path, 'list', result.errors[0]?.message || 'Validation failed');
        }

        // Check if it's a directory
        const stats = await fsPromises.stat(this.path);
        if (!stats.isDirectory()) {
            throw new FilePathError(this.path, 'list', {
                reason: 'Not a directory'
            });
        }

        return true;
    }

    async execute(): Promise<FileMetadata[]> {
        const lock = await this.lockManager.acquire(this.path, 'list');

        try {
            const files = await fsPromises.readdir(this.path);
            const metadataPromises = files.map(async (file) => {
                const filePath = path.join(this.path, file);
                const stats = await fsPromises.stat(filePath);

                return {
                    path: filePath,
                    lastModified: stats.mtime,
                    size: stats.size,
                    hash: '', // Could calculate hash if needed
                    version: 1
                };
            });

            return Promise.all(metadataPromises);
        } finally {
            await this.lockManager.release(this.path, 'list');
        }
    }

    async rollback(): Promise<void> {
        // Nothing to roll back for list operation
    }
}
