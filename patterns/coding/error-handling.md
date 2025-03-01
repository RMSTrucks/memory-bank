# Error Handling Patterns

## Overview

Error handling is a critical aspect of robust software development. This document outlines common patterns and best practices for handling errors effectively across different contexts.

## Core Patterns

1. **Try-Catch Pattern**
   ```javascript
   async function handleOperation() {
     try {
       const result = await riskyOperation();
       return result;
     } catch (error) {
       // Specific error handling
       if (error instanceof NetworkError) {
         handleNetworkError(error);
       } else if (error instanceof ValidationError) {
         handleValidationError(error);
       } else {
         // Generic error handling
         logError(error);
         throw new OperationalError('Operation failed', { cause: error });
       }
     } finally {
       // Cleanup operations
       cleanup();
     }
   }
   ```

2. **Error Class Hierarchy**
   ```javascript
   class AppError extends Error {
     constructor(message, options = {}) {
       super(message);
       this.name = this.constructor.name;
       this.timestamp = new Date();
       this.code = options.code;
       this.details = options.details;
     }
   }

   class ValidationError extends AppError {
     constructor(message, details) {
       super(message, { code: 'VALIDATION_ERROR', details });
     }
   }

   class NetworkError extends AppError {
     constructor(message, details) {
       super(message, { code: 'NETWORK_ERROR', details });
     }
   }
   ```

## Implementation Guidelines

1. **Error Categories**
   - Operational Errors (expected)
     * Network issues
     * File system errors
     * Configuration errors
   - Programming Errors (bugs)
     * Null references
     * Type errors
     * Logic errors

2. **Error Handling Strategies**
   - Fail Fast
     * Detect errors early
     * Validate inputs immediately
     * Check preconditions
   - Graceful Degradation
     * Provide fallback behavior
     * Maintain core functionality
     * Clear user communication

3. **Logging Best Practices**
   ```javascript
   function logError(error, context = {}) {
     const errorLog = {
       message: error.message,
       stack: error.stack,
       code: error.code,
       timestamp: new Date().toISOString(),
       ...context
     };
     
     // Log to appropriate service
     logger.error(errorLog);
   }
   ```

## Error Recovery Patterns

1. **Retry Pattern**
   ```javascript
   async function withRetry(operation, maxAttempts = 3, delay = 1000) {
     let lastError;
     
     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
       try {
         return await operation();
       } catch (error) {
         lastError = error;
         if (attempt === maxAttempts) break;
         
         await new Promise(resolve => setTimeout(resolve, delay));
         delay *= 2; // Exponential backoff
       }
     }
     
     throw lastError;
   }
   ```

2. **Circuit Breaker**
   ```javascript
   class CircuitBreaker {
     constructor(operation, options = {}) {
       this.operation = operation;
       this.failureThreshold = options.failureThreshold || 5;
       this.resetTimeout = options.resetTimeout || 60000;
       this.failures = 0;
       this.lastFailureTime = null;
       this.state = 'CLOSED';
     }

     async execute(...args) {
       if (this.state === 'OPEN') {
         if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
           this.state = 'HALF_OPEN';
         } else {
           throw new Error('Circuit breaker is OPEN');
         }
       }

       try {
         const result = await this.operation(...args);
         this.reset();
         return result;
       } catch (error) {
         this.handleFailure();
         throw error;
       }
     }

     handleFailure() {
       this.failures++;
       this.lastFailureTime = Date.now();
       
       if (this.failures >= this.failureThreshold) {
         this.state = 'OPEN';
       }
     }

     reset() {
       this.failures = 0;
       this.lastFailureTime = null;
       this.state = 'CLOSED';
     }
   }
   ```

## Best Practices

1. **Error Prevention**
   - Use strong typing
   - Validate inputs
   - Check preconditions
   - Use linting tools

2. **Error Handling**
   - Be specific about what you catch
   - Never swallow errors silently
   - Log errors appropriately
   - Maintain the error stack trace

3. **Error Communication**
   - Clear error messages
   - Appropriate error codes
   - Helpful debugging information
   - User-friendly messages

## Testing Error Handling

1. **Unit Tests**
   ```javascript
   describe('Error Handling', () => {
     test('should handle network errors', async () => {
       const mockOperation = jest.fn().mockRejectedValue(
         new NetworkError('Connection failed')
       );

       await expect(handleOperation(mockOperation))
         .rejects
         .toThrow('Connection failed');
     });
   });
   ```

2. **Integration Tests**
   - Test error propagation
   - Verify error logging
   - Check recovery mechanisms
   - Test circuit breakers

## Cross-References
- [Async Patterns](./async-patterns.md)
- [Testing Strategies](./testing-strategies.md)
- [Error Handling Examples](../../library/snippets/javascript/error-handling.md)
