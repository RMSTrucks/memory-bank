/**
 * Neural Computation Framework Core Exports
 *
 * This file exports the core functionality of the Neural Computation Framework.
 */

// Export tensor implementation
export * from './tensor';

// Export tensor operations
export * from './operations';

// Export computation graph
export * from './computation-graph';

// Export autograd
export * from './autograd';

// Export gradient functions
export * from './gradients';

// Export normalization operations
export * from './normalization';

// Import and export normalization gradients
import { initNormalizationGradients } from './normalization-gradients';
export { initNormalizationGradients };

// Initialize normalization gradients
initNormalizationGradients();
