import { FileOperationsService } from './file-operations.service';
import { OpenAIService } from './openai.service';
import { aiConfig } from '../config/ai-config';

// Import file operation types
import {
    FileOperation,
    FileContent,
    FileMetadata,
    FileOperationResult,
    FileOperationOptions,
    FileError,
    FileErrorCode,
    FileEvent,
    FileEventType,
    FileLock,
    FileContext
} from '../types/files';

// Import file operation errors
import {
    FileNotFoundError,
    FileAccessError,
    FileExistsError,
    FilePathError,
    FileValidationError,
    FileBackupError,
    GitError
} from '../errors/file-errors';

// Import OpenAI types
import {
    AIService,
    AIResponse,
    Analysis,
    ValidationResult,
    GenerationRequest,
    GenerationResult,
    RateLimitInfo,
    AIServiceError,
    RateLimitError,
    ValidationError
} from '../types/openai';

// Export service instances
export const fileOperations = new FileOperationsService();
export const aiService = new OpenAIService(aiConfig);

// Export service classes
export { FileOperationsService, OpenAIService };

// Export file operation types
export type {
    FileOperation,
    FileContent,
    FileMetadata,
    FileOperationResult,
    FileOperationOptions,
    FileError,
    FileEvent,
    FileEventType,
    FileLock,
    FileContext
};

// Export file operation errors
export {
    FileErrorCode,
    FileNotFoundError,
    FileAccessError,
    FileExistsError,
    FilePathError,
    FileValidationError,
    FileBackupError,
    GitError
};

// Export OpenAI types
export type {
    AIService,
    AIResponse,
    Analysis,
    ValidationResult,
    GenerationRequest,
    GenerationResult,
    RateLimitInfo
};

// Export OpenAI errors
export {
    AIServiceError,
    RateLimitError,
    ValidationError
};

// Export utilities
export { LockManager } from '../utils/lock-manager';
export { BackupManager } from '../utils/backup-manager';
