import {
    BaseError,
    ErrorBoundary,
    ErrorHandler,
    ValidationError,
    OperationError,
    PatternError,
    LearningError,
    ResourceError,
    SystemError
} from '../types/errors';
import { ErrorHandlerService } from './error-handler.service';

export class ErrorBoundaryService implements ErrorBoundary {
    private static instance: ErrorBoundaryService;
    private errorHandler: ErrorHandler;
    private boundaryName: string;
    private errorCount: number = 0;
    private errorThreshold: number = 5;
    private resetInterval: number = 60000; // 1 minute
    private resetTimer: ReturnType<typeof setInterval> | null = null;

    private constructor(boundaryName: string) {
        this.boundaryName = boundaryName;
        this.errorHandler = ErrorHandlerService.getInstance();
        this.startErrorCountReset();
    }

    public static getInstance(boundaryName: string): ErrorBoundaryService {
        if (!ErrorBoundaryService.instance) {
            ErrorBoundaryService.instance = new ErrorBoundaryService(boundaryName);
        }
        return ErrorBoundaryService.instance;
    }

    public async handle(error: BaseError): Promise<void> {
        try {
            // Update error metadata with boundary information
            error.metadata.context = {
                ...error.metadata.context,
                boundary: this.boundaryName,
                errorCount: this.errorCount
            };

            // Increment error count
            this.errorCount++;

            // Check if we need to escalate
            if (this.shouldEscalate()) {
                await this.escalateError(error);
                return;
            }

            // Handle error normally
            await this.errorHandler.handleError(error);

            // Attempt recovery if possible
            await this.recover(error.metadata.context);
        } catch (handlingError) {
            // If error handling fails, escalate to system error
            await this.escalateError(new SystemError(
                'Error boundary failed to handle error',
                {
                    originalError: error,
                    handlingError
                }
            ));
        }
    }

    public async recover(context: unknown): Promise<void> {
        try {
            // Implement recovery logic based on context
            if (typeof context === 'object' && context !== null) {
                switch ((context as any).category) {
                    case 'validation':
                        await this.recoverFromValidation(context);
                        break;
                    case 'operation':
                        await this.recoverFromOperation(context);
                        break;
                    case 'pattern':
                        await this.recoverFromPattern(context);
                        break;
                    case 'learning':
                        await this.recoverFromLearning(context);
                        break;
                    case 'resource':
                        await this.recoverFromResource(context);
                        break;
                    case 'system':
                        await this.recoverFromSystem(context);
                        break;
                }
            }
        } catch (recoveryError) {
            await this.log(new BaseError(
                'Recovery failed',
                {
                    severity: 'high',
                    category: 'system',
                    source: 'error-boundary',
                    context: {
                        originalContext: context,
                        recoveryError
                    }
                }
            ));
        }
    }

    public async log(error: BaseError): Promise<void> {
        try {
            // Add boundary context
            error.metadata.context = {
                ...error.metadata.context,
                boundary: this.boundaryName,
                errorCount: this.errorCount
            };

            // Log through error handler
            await this.errorHandler.logError(error);
        } catch (loggingError) {
            console.error('Error boundary logging failed:', loggingError);
        }
    }

    private shouldEscalate(): boolean {
        return this.errorCount >= this.errorThreshold;
    }

    private async escalateError(error: BaseError): Promise<void> {
        const escalatedError = new SystemError(
            `Error threshold exceeded in boundary ${this.boundaryName}`,
            {
                originalError: error,
                errorCount: this.errorCount,
                threshold: this.errorThreshold
            }
        );

        // Reset error count after escalation
        this.errorCount = 0;

        // Handle escalated error
        await this.errorHandler.handleError(escalatedError);
    }

    private startErrorCountReset(): void {
        if (this.resetTimer !== null) {
            clearInterval(this.resetTimer);
            this.resetTimer = null;
        }
        this.resetTimer = setInterval(() => {
            this.errorCount = 0;
        }, this.resetInterval) as ReturnType<typeof setInterval>;
    }

    // Recovery implementations for different error types
    private async recoverFromValidation(context: unknown): Promise<void> {
        // Implement validation recovery
        // For example: reset form, clear cache, etc.
    }

    private async recoverFromOperation(context: unknown): Promise<void> {
        // Implement operation recovery
        // For example: retry operation, cleanup resources, etc.
    }

    private async recoverFromPattern(context: unknown): Promise<void> {
        // Implement pattern recovery
        // For example: reset pattern state, clear pattern cache, etc.
    }

    private async recoverFromLearning(context: unknown): Promise<void> {
        // Implement learning recovery
        // For example: reset learning state, clear learning cache, etc.
    }

    private async recoverFromResource(context: unknown): Promise<void> {
        // Implement resource recovery
        // For example: release resources, cleanup connections, etc.
    }

    private async recoverFromSystem(context: unknown): Promise<void> {
        // Implement system recovery
        // For example: restart services, reset state, etc.
    }

    // Utility methods
    public getErrorCount(): number {
        return this.errorCount;
    }

    public getBoundaryName(): string {
        return this.boundaryName;
    }

    public resetErrorCount(): void {
        this.errorCount = 0;
    }

    public setErrorThreshold(threshold: number): void {
        if (threshold > 0) {
            this.errorThreshold = threshold;
        }
    }

    public setResetInterval(interval: number): void {
        if (interval > 0) {
            this.resetInterval = interval;
            this.startErrorCountReset();
        }
    }

    public dispose(): void {
        if (this.resetTimer !== null) {
            clearInterval(this.resetTimer);
            this.resetTimer = null;
        }
    }
}
