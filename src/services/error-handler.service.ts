import {
    BaseError,
    ErrorHandler,
    ErrorRecoveryStrategy,
    ErrorSeverity,
    ValidationError,
    OperationError,
    PatternError,
    LearningError,
    ResourceError,
    SystemError
} from '../types/errors';

export class ErrorHandlerService implements ErrorHandler {
    private static instance: ErrorHandlerService;
    private errorLog: BaseError[] = [];
    private recoveryStrategies: Map<string, ErrorRecoveryStrategy>;

    private constructor() {
        this.recoveryStrategies = new Map();
        this.initializeDefaultStrategies();
    }

    public static getInstance(): ErrorHandlerService {
        if (!ErrorHandlerService.instance) {
            ErrorHandlerService.instance = new ErrorHandlerService();
        }
        return ErrorHandlerService.instance;
    }

    private initializeDefaultStrategies(): void {
        // Validation errors - fallback to default values
        this.recoveryStrategies.set('validation', {
            type: 'fallback',
            fallbackValue: null
        });

        // Operation errors - retry with backoff
        this.recoveryStrategies.set('operation', {
            type: 'retry',
            maxAttempts: 3,
            delay: 1000
        });

        // Pattern errors - compensating actions
        this.recoveryStrategies.set('pattern', {
            type: 'compensate',
            compensationSteps: ['revert', 'cleanup', 'notify']
        });

        // Learning errors - fallback to safe defaults
        this.recoveryStrategies.set('learning', {
            type: 'fallback',
            fallbackValue: { confidence: 0, impact: 0 }
        });

        // Resource errors - retry with longer delays
        this.recoveryStrategies.set('resource', {
            type: 'retry',
            maxAttempts: 5,
            delay: 2000
        });

        // System errors - compensating actions with restart
        this.recoveryStrategies.set('system', {
            type: 'compensate',
            compensationSteps: ['shutdown', 'cleanup', 'restart']
        });
    }

    public async handleError(error: BaseError): Promise<void> {
        try {
            // Log the error
            await this.logError(error);

            // Get recovery strategy
            const strategy = this.getRecoveryStrategy(error);

            // Execute recovery strategy
            await this.executeRecoveryStrategy(error, strategy);
        } catch (handlingError) {
            console.error('Error handling failed:', handlingError);
            throw handlingError;
        }
    }

    public getRecoveryStrategy(error: BaseError): ErrorRecoveryStrategy {
        // Use error's own strategy if provided
        if (error.recoveryStrategy) {
            return error.recoveryStrategy;
        }

        // Use default strategy based on error category
        const defaultStrategy = this.recoveryStrategies.get(error.metadata.category);
        if (defaultStrategy) {
            return defaultStrategy;
        }

        // Fallback strategy
        return {
            type: 'fallback',
            fallbackValue: null
        };
    }

    public async logError(error: BaseError): Promise<void> {
        try {
            // Add to in-memory log
            this.errorLog.push(error);

            // Log to console with severity-based formatting
            this.logToConsole(error);

            // Implement additional logging (e.g., file, monitoring service) here
        } catch (loggingError) {
            console.error('Error logging failed:', loggingError);
        }
    }

    private async executeRecoveryStrategy(
        error: BaseError,
        strategy: ErrorRecoveryStrategy
    ): Promise<void> {
        switch (strategy.type) {
            case 'retry':
                await this.executeRetryStrategy(error, strategy);
                break;
            case 'fallback':
                await this.executeFallbackStrategy(error, strategy);
                break;
            case 'compensate':
                await this.executeCompensationStrategy(error, strategy);
                break;
            case 'ignore':
                // Do nothing
                break;
            default:
                throw new Error(`Unknown recovery strategy type: ${strategy.type}`);
        }
    }

    private async executeRetryStrategy(
        error: BaseError,
        strategy: ErrorRecoveryStrategy
    ): Promise<void> {
        const maxAttempts = strategy.maxAttempts || 3;
        const delay = strategy.delay || 1000;

        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                // Attempt recovery
                await this.attemptRecovery(error);
                return;
            } catch (retryError) {
                attempts++;
                if (attempts === maxAttempts) {
                    throw retryError;
                }
                await this.delay(delay * attempts); // Exponential backoff
            }
        }
    }

    private async executeFallbackStrategy(
        error: BaseError,
        strategy: ErrorRecoveryStrategy
    ): Promise<void> {
        // Log fallback action
        await this.logError(new BaseError(
            `Falling back to default value for ${error.metadata.category}`,
            {
                severity: 'low',
                category: error.metadata.category,
                source: 'error-handler',
                context: {
                    originalError: error,
                    fallbackValue: strategy.fallbackValue
                }
            }
        ));
    }

    private async executeCompensationStrategy(
        error: BaseError,
        strategy: ErrorRecoveryStrategy
    ): Promise<void> {
        const steps = strategy.compensationSteps || [];
        for (const step of steps) {
            try {
                await this.executeCompensationStep(step, error);
            } catch (compensationError) {
                await this.logError(new BaseError(
                    `Compensation step ${step} failed`,
                    {
                        severity: 'high',
                        category: error.metadata.category,
                        source: 'error-handler',
                        context: {
                            originalError: error,
                            compensationError
                        }
                    }
                ));
            }
        }
    }

    private async executeCompensationStep(
        step: string,
        error: BaseError
    ): Promise<void> {
        switch (step) {
            case 'revert':
                // Implement revert logic
                break;
            case 'cleanup':
                // Implement cleanup logic
                break;
            case 'notify':
                await this.notifyError(error);
                break;
            case 'shutdown':
                // Implement shutdown logic
                break;
            case 'restart':
                // Implement restart logic
                break;
            default:
                throw new Error(`Unknown compensation step: ${step}`);
        }
    }

    private async attemptRecovery(error: BaseError): Promise<void> {
        // Implement recovery logic based on error type
        switch (error.metadata.category) {
            case 'validation':
                await this.handleValidationError(error as ValidationError);
                break;
            case 'operation':
                await this.handleOperationError(error as OperationError);
                break;
            case 'pattern':
                await this.handlePatternError(error as PatternError);
                break;
            case 'learning':
                await this.handleLearningError(error as LearningError);
                break;
            case 'resource':
                await this.handleResourceError(error as ResourceError);
                break;
            case 'system':
                await this.handleSystemError(error as SystemError);
                break;
            default:
                throw new Error(`Unknown error category: ${error.metadata.category}`);
        }
    }

    private async handleValidationError(error: ValidationError): Promise<void> {
        // Implement validation error recovery
    }

    private async handleOperationError(error: OperationError): Promise<void> {
        // Implement operation error recovery
    }

    private async handlePatternError(error: PatternError): Promise<void> {
        // Implement pattern error recovery
    }

    private async handleLearningError(error: LearningError): Promise<void> {
        // Implement learning error recovery
    }

    private async handleResourceError(error: ResourceError): Promise<void> {
        // Implement resource error recovery
    }

    private async handleSystemError(error: SystemError): Promise<void> {
        // Implement system error recovery
    }

    private async notifyError(error: BaseError): Promise<void> {
        // Implement error notification logic
        console.error('Error notification:', {
            name: error.name,
            message: error.message,
            metadata: error.metadata
        });
    }

    private logToConsole(error: BaseError): void {
        const severityColors = {
            low: '\x1b[32m',     // Green
            medium: '\x1b[33m',  // Yellow
            high: '\x1b[31m',    // Red
            critical: '\x1b[41m' // Red background
        };

        const color = severityColors[error.metadata.severity];
        const reset = '\x1b[0m';

        console.error(
            `${color}[${error.metadata.severity.toUpperCase()}]${reset}`,
            `[${error.metadata.category}]`,
            error.message,
            '\nMetadata:',
            error.metadata,
            '\nStack:',
            error.stack
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Utility methods for error management
    public getErrorLog(): BaseError[] {
        return [...this.errorLog];
    }

    public clearErrorLog(): void {
        this.errorLog = [];
    }

    public getErrorStats(): Record<string, number> {
        return this.errorLog.reduce((stats, error) => {
            const category = error.metadata.category;
            stats[category] = (stats[category] || 0) + 1;
            return stats;
        }, {} as Record<string, number>);
    }

    public setRecoveryStrategy(
        category: string,
        strategy: ErrorRecoveryStrategy
    ): void {
        this.recoveryStrategies.set(category, strategy);
    }
}
