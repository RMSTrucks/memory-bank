/**
 * Error System Types
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
    | 'validation'    // Input/data validation errors
    | 'operation'     // Operation execution errors
    | 'system'        // System-level errors
    | 'pattern'       // Pattern-related errors
    | 'learning'      // Learning system errors
    | 'resource'      // Resource management errors
    | 'documentation'; // Documentation system errors

export interface ErrorMetadata {
    timestamp: Date;
    severity: ErrorSeverity;
    category: ErrorCategory;
    code: string;
    source: string;
    context: Record<string, unknown>;
    stackTrace?: string;
}

export interface ErrorRecoveryStrategy {
    type: 'retry' | 'fallback' | 'compensate' | 'ignore';
    maxAttempts?: number;
    delay?: number;
    fallbackValue?: unknown;
    compensationSteps?: string[];
}

export interface ErrorBoundary {
    handle(error: BaseError): Promise<void>;
    recover(context: unknown): Promise<void>;
    log(error: BaseError): Promise<void>;
}

export interface ErrorHandler {
    handleError(error: BaseError): Promise<void>;
    getRecoveryStrategy(error: BaseError): ErrorRecoveryStrategy;
    logError(error: BaseError): Promise<void>;
}

export class BaseError extends Error {
    public readonly metadata: ErrorMetadata;
    public readonly recoveryStrategy?: ErrorRecoveryStrategy;

    constructor(
        message: string,
        metadata: Partial<ErrorMetadata>,
        recoveryStrategy?: ErrorRecoveryStrategy
    ) {
        super(message);
        this.name = this.constructor.name;

        // Initialize metadata with defaults
        this.metadata = {
            timestamp: new Date(),
            severity: metadata.severity || 'medium',
            category: metadata.category || 'system',
            code: metadata.code || 'ERR_UNKNOWN',
            source: metadata.source || 'system',
            context: metadata.context || {},
            stackTrace: metadata.stackTrace || this.stack
        };

        this.recoveryStrategy = recoveryStrategy;

        // Ensure proper prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            metadata: this.metadata,
            recoveryStrategy: this.recoveryStrategy
        };
    }

    public static fromJSON(json: Record<string, unknown>): BaseError {
        return new BaseError(
            json.message as string,
            json.metadata as ErrorMetadata,
            json.recoveryStrategy as ErrorRecoveryStrategy
        );
    }
}

// Validation Errors
export class ValidationError extends BaseError {
    constructor(
        message: string,
        context: Record<string, unknown> = {},
        severity: ErrorSeverity = 'medium'
    ) {
        super(message, {
            severity,
            category: 'validation',
            code: 'ERR_VALIDATION',
            source: 'validation',
            context
        }, {
            type: 'fallback',
            fallbackValue: null
        });
    }
}

// Operation Errors
export class OperationError extends BaseError {
    constructor(
        message: string,
        context: Record<string, unknown> = {},
        severity: ErrorSeverity = 'high'
    ) {
        super(message, {
            severity,
            category: 'operation',
            code: 'ERR_OPERATION',
            source: 'operation',
            context
        }, {
            type: 'retry',
            maxAttempts: 3,
            delay: 1000
        });
    }
}

// Pattern Errors
export class PatternError extends BaseError {
    constructor(
        message: string,
        context: Record<string, unknown> = {},
        severity: ErrorSeverity = 'medium'
    ) {
        super(message, {
            severity,
            category: 'pattern',
            code: 'ERR_PATTERN',
            source: 'pattern',
            context
        }, {
            type: 'compensate',
            compensationSteps: ['revert', 'cleanup', 'notify']
        });
    }
}

// Learning Errors
export class LearningError extends BaseError {
    constructor(
        message: string,
        context: Record<string, unknown> = {},
        severity: ErrorSeverity = 'medium'
    ) {
        super(message, {
            severity,
            category: 'learning',
            code: 'ERR_LEARNING',
            source: 'learning',
            context
        }, {
            type: 'fallback',
            fallbackValue: { confidence: 0, impact: 0 }
        });
    }
}

// Resource Errors
export class ResourceError extends BaseError {
    constructor(
        message: string,
        context: Record<string, unknown> = {},
        severity: ErrorSeverity = 'high'
    ) {
        super(message, {
            severity,
            category: 'resource',
            code: 'ERR_RESOURCE',
            source: 'resource',
            context
        }, {
            type: 'retry',
            maxAttempts: 5,
            delay: 2000
        });
    }
}

// System Errors
export class SystemError extends BaseError {
    constructor(
        message: string,
        context: Record<string, unknown> = {},
        severity: ErrorSeverity = 'critical'
    ) {
        super(message, {
            severity,
            category: 'system',
            code: 'ERR_SYSTEM',
            source: 'system',
            context
        }, {
            type: 'compensate',
            compensationSteps: ['shutdown', 'cleanup', 'restart']
        });
    }
}
