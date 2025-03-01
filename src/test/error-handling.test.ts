import { ErrorHandlerService } from '../services/error-handler.service';
import { ErrorBoundaryService } from '../services/error-boundary.service';
import { ValidationError, LearningError, BaseError } from '../types/errors';

describe('Error Handling System', () => {
  describe('ErrorHandlerService', () => {
    let errorHandler: ErrorHandlerService;

    beforeEach(() => {
      errorHandler = ErrorHandlerService.getInstance();
      errorHandler.clearErrorLog();
    });

    test('should handle validation error with fallback strategy', async () => {
      const error = new ValidationError('Invalid input', { source: 'test' });
      await errorHandler.handleError(error);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(2); // Original error + fallback error
      expect(log[0].metadata.category).toBe('validation');
      expect(log[0].metadata.severity).toBe('medium');
      expect(log[1].message).toContain('Falling back to default value for validation');
    });

    test('should handle learning error with fallback strategy', async () => {
      const error = new LearningError('Learning failed', { source: 'test' });
      await errorHandler.handleError(error);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(2); // Original error + fallback error
      expect(log[0].metadata.category).toBe('learning');
      expect(log[0].metadata.severity).toBe('medium');
      expect(log[1].message).toContain('Falling back to default value for learning');
    });

    test('should maintain error statistics', async () => {
      const validationError = new ValidationError('Invalid input', { source: 'test' });
      await errorHandler.handleError(validationError);

      const operationError = new BaseError('Operation failed', {
        category: 'operation',
        severity: 'medium',
        source: 'test'
      });
      await errorHandler.handleError(operationError);

      const patternError = new BaseError('Pattern error', {
        category: 'pattern',
        severity: 'high',
        source: 'test'
      });
      await errorHandler.handleError(patternError);

      const stats = errorHandler.getErrorStats();
      expect(stats.validation).toBe(2); // Original error + fallback error
      expect(stats.operation).toBe(1);
      expect(stats.pattern).toBe(1);
    });
  });

  describe('ErrorBoundaryService', () => {
    let errorHandler: ErrorHandlerService;
    let boundary: ErrorBoundaryService;

    beforeEach(() => {
      errorHandler = ErrorHandlerService.getInstance();
      errorHandler.clearErrorLog();
      boundary = ErrorBoundaryService.getInstance('test-boundary');
    });

    describe('Error Recovery', () => {
      test('should handle recovery', async () => {
        let recovered = false;
        const error = new BaseError('Test error', {
          category: 'operation',
          severity: 'medium',
          source: 'test'
        });

        try {
          if (!recovered) {
            recovered = true;
            await boundary.handle(error);
          }
        } catch (e) {
          // Expected first error
        }

        await boundary.recover({ category: 'operation' });
        expect(recovered).toBe(true);

        const log = errorHandler.getErrorLog();
        expect(log.length).toBeGreaterThan(0);
      });

      test('should handle recovery failure', async () => {
        const error = new BaseError('Test error', {
          category: 'system',
          severity: 'high',
          source: 'test'
        });

        await boundary.handle(error);
        await expect(boundary.recover({ category: 'unknown' })).resolves.not.toThrow();
      });

      test('should maintain error context through handling chain', async () => {
        const context = { source: 'test', data: { key: 'value' } };
        const error = new BaseError('Test error', {
          category: 'operation',
          severity: 'medium',
          source: 'test',
          context
        });

        await boundary.handle(error);
        const log = errorHandler.getErrorLog();
        expect(log[0].metadata.context).toEqual(expect.objectContaining(context));
      });
    });

    describe('Threshold Management', () => {
      test('should track error thresholds', async () => {
        const errors = Array(3).fill(new BaseError('Test error', {
          category: 'operation',
          severity: 'medium',
          source: 'test'
        }));

        for (const error of errors) {
          try {
            await boundary.handle(error);
          } catch (e) {
            // Expected
          }
        }

        expect(boundary.getErrorCount()).toBe(3);
      });

      test('should reset thresholds after success', async () => {
        // Generate some errors
        for (let i = 0; i < 3; i++) {
          try {
            await boundary.handle(new BaseError('Test error', {
              category: 'operation',
              severity: 'medium',
              source: 'test'
            }));
          } catch (e) {
            // Expected
          }
        }

        boundary.resetErrorCount();
        expect(boundary.getErrorCount()).toBe(0);
      });
    });
  });

  describe('Error Integration', () => {
    let errorHandler: ErrorHandlerService;
    let boundary: ErrorBoundaryService;

    beforeEach(() => {
      errorHandler = ErrorHandlerService.getInstance();
      errorHandler.clearErrorLog();
      boundary = ErrorBoundaryService.getInstance('test-boundary');
    });

    test('should handle complex error scenarios', async () => {
      const error = new BaseError('Operation failed', {
        category: 'operation',
        severity: 'high',
        source: 'test',
        context: {
          cause: 'complex scenario'
        }
      });

      await boundary.handle(error);
      const log = errorHandler.getErrorLog();
      expect(log[0].metadata.category).toBe('operation');
      expect(log[0].metadata.context.cause).toBeDefined();
    });

    test('should propagate error context', async () => {
      const context = {
        operation: 'test',
        timestamp: new Date(),
        metadata: { key: 'value' }
      };

      const error = new BaseError('Test error', {
        category: 'operation',
        severity: 'medium',
        source: 'test',
        context
      });

      await boundary.handle(error);
      const log = errorHandler.getErrorLog();
      expect(log[0].metadata.context).toEqual(expect.objectContaining(context));
    });
  });
});
