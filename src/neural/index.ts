/**
 * Neural Computation Framework
 *
 * This is the main entry point for the Neural Computation Framework.
 * It provides a high-performance, resource-efficient tensor computation system
 * with automatic differentiation, dynamic computation graphs, and integration
 * with existing systems.
 */

// Export types
export * from './types';

// Export core functionality
export * from './core';

// Export engine functionality (will be implemented later)
// export * from './engine';

// Export integration functionality (will be implemented later)
// export * from './integration';

// Version information
export const VERSION = '0.1.0';

// Framework information
export const FRAMEWORK_INFO = {
    name: 'Neural Computation Framework',
    version: VERSION,
    description: 'High-performance tensor computation framework with dynamic computation graphs',
    capabilities: [
        'Tensor operations',
        'Dynamic computation graphs',
        'Automatic differentiation',
        'Resource optimization',
        'System integration'
    ]
};
