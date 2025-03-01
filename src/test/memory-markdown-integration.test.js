/**
 * Memory Markdown Integration Tests
 *
 * This file contains tests for the integration between the Memory System
 * and local markdown files. It tests how memories are stored in and
 * retrieved from markdown files.
 */

const ClimeMemoryIntegration = require('../scripts/cline-memory-integration');
const fs = require('fs');
const path = require('path');

// Mock server for testing
let mockServer = {
  kill: jest.fn()
};

// Mock MemorySystem for testing
jest.mock('../scripts/memory-system', () => ({
  CONFIG: {
    namespaces: {
      coreKnowledge: 'cline-core-knowledge',
      patterns: 'cline-patterns',
      interactions: 'cline-interactions',
      documentation: 'cline-documentation'
    }
  },
  startServer: jest.fn(() => mockServer),
  storeMemory: jest.fn(async (server, text, metadata, namespace) => true),
  initialize: jest.fn(async () => true)
}));

// Sample markdown file contents
const sampleMarkdownFiles = {
  '.clinerules': `# Cline Rules

## Project Intelligence

This file captures important patterns, preferences, and project intelligence that help Cline work more effectively with the Memory Bank system.

## Core Patterns

1. **Documentation Hierarchy**
   - All documentation stems from projectbrief.md
   - Changes flow through the hierarchy
   - Updates maintain consistency across files
   - Regular validation of cross-references

## Project Preferences

1. **Documentation Style**
   - Clear hierarchical headers
   - Consistent bullet points
   - Numbered lists for sequences
   - Mermaid diagrams for relationships
   - Emoji indicators for status (✅, 🔄, ❌)

## Learning History

1. **Initial Setup**
   - System initialized with core files
   - Basic patterns established
   - Documentation hierarchy created
   - Update workflows defined
   - Validation system implemented`,

  'systemPatterns.md': `# System Patterns

## Architecture Patterns

### Component Architecture
The system follows a component-based architecture with clear separation of concerns.

### Event-Driven Communication
Components communicate through an event-driven system for loose coupling.

## Implementation Patterns

### Error Handling
All errors are caught, logged, and handled appropriately.

### Validation
Input validation is performed at system boundaries.`,

  'activeContext.md': `# Active Context

## Current Focus

### Strategic Approach: The Axe Sharpening Phase 🔄

**Current Strategic Phase: Axe Sharpening**
Following Abraham Lincoln's wisdom that "if I had six hours to chop down a tree, I'd spend the first four sharpening the axe," we are currently in the axe sharpening phase.

## Active Decisions

1. **Neural Computation Framework**
   - 🔄 Tensor operations implementation approach
   - 🔄 Computation graph design
   - 🔄 Memory management strategy
   - 🔄 Performance optimization techniques
   - 🔄 Integration with pattern system`,

  'productContext.md': `# Product Context

## Overview

The Memory Bank system allows Cline to maintain perfect documentation across sessions, serving as the core memory system despite complete memory resets.

## Core Concepts

### Memory Bank
The Memory Bank is a collection of markdown files that store documentation and knowledge in a structured format.

### Memory Reset
Cline's memory resets completely between sessions, requiring perfect documentation to continue work effectively.`
};

// Mock fs for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn((path, encoding) => {
    // Return the sample content for the file if it exists
    const fileName = path.includes('/') ? path.split('/').pop() : path;
    return sampleMarkdownFiles[fileName] || `# Mock content for ${fileName}`;
  }),
  writeFileSync: jest.fn(),
  existsSync: jest.fn((path) => {
    // Check if the file exists in our sample files
    const fileName = path.includes('/') ? path.split('/').pop() : path;
    return !!sampleMarkdownFiles[fileName];
  }),
  statSync: jest.fn(() => ({
    mtime: new Date(),
    isDirectory: () => false
  }))
}));

describe('Memory Markdown Integration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize the server for each test
    ClimeMemoryIntegration.initialize();
  });

  // Clean up after each test
  afterEach(() => {
    ClimeMemoryIntegration.shutdown();
  });

  describe('Learning Updates', () => {
    test('should add a new learning to .clinerules', async () => {
      const learning = "When implementing error handling, always use try/catch blocks with specific error types and meaningful error messages.";
      const importance = "high";

      const result = await ClimeMemoryIntegration.storeLearning(learning, importance);

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('.clinerules', 'utf8');
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new learning
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe('.clinerules');
      expect(writeCall[1]).toContain(learning);
    });

    test('should handle adding a learning when Learning History section does not exist', async () => {
      // Mock readFileSync to return content without the Learning History section
      fs.readFileSync.mockReturnValueOnce(`# Cline Rules

## Project Intelligence

This file captures important patterns, preferences, and project intelligence.`);

      const learning = "New learning without existing section.";
      const importance = "medium";

      const result = await ClimeMemoryIntegration.storeLearning(learning, importance);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new section and learning
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[1]).toContain('## Learning History');
      expect(writeCall[1]).toContain(learning);
    });
  });

  describe('Pattern Updates', () => {
    test('should add a new pattern to systemPatterns.md', async () => {
      const pattern = "Use the Factory pattern for creating complex objects with multiple configurations.";
      const importance = "high";

      const result = await ClimeMemoryIntegration.storePattern(pattern, importance);

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('systemPatterns.md', 'utf8');
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new pattern
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe('systemPatterns.md');
      expect(writeCall[1]).toContain(pattern);
      expect(writeCall[1]).toContain('High Priority Pattern');
    });

    test('should handle adding a pattern when Implementation Patterns section does not exist', async () => {
      // Mock readFileSync to return content without the Implementation Patterns section
      fs.readFileSync.mockReturnValueOnce(`# System Patterns

## Architecture Patterns

### Component Architecture
The system follows a component-based architecture with clear separation of concerns.`);

      const pattern = "New pattern without existing section.";
      const importance = "medium";

      const result = await ClimeMemoryIntegration.storePattern(pattern, importance);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new section and pattern
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[1]).toContain('## Implementation Patterns');
      expect(writeCall[1]).toContain(pattern);
      expect(writeCall[1]).toContain('Medium Priority Pattern');
    });
  });

  describe('Decision Updates', () => {
    test('should add a new decision to activeContext.md', async () => {
      const decision = "Use Pinecone for vector storage to enable efficient semantic search across large volumes of documentation and code.";
      const importance = "critical";

      const result = await ClimeMemoryIntegration.storeDecision(decision, importance);

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('activeContext.md', 'utf8');
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new decision
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe('activeContext.md');
      expect(writeCall[1]).toContain(decision);
      expect(writeCall[1]).toContain('Critical Priority Decision');
    });

    test('should handle adding a decision when Active Decisions section does not exist', async () => {
      // Mock readFileSync to return content without the Active Decisions section
      fs.readFileSync.mockReturnValueOnce(`# Active Context

## Current Focus

### Strategic Approach: The Axe Sharpening Phase 🔄`);

      const decision = "New decision without existing section.";
      const importance = "high";

      const result = await ClimeMemoryIntegration.storeDecision(decision, importance);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new section and decision
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[1]).toContain('## Active Decisions');
      expect(writeCall[1]).toContain(decision);
      expect(writeCall[1]).toContain('High Priority Decision');
    });

    test('should increment decision number when adding to existing decisions', async () => {
      // Mock readFileSync to return content with existing decisions
      fs.readFileSync.mockReturnValueOnce(`# Active Context

## Active Decisions

1. **First Decision**
   - Decision details
2. **Second Decision**
   - Decision details`);

      const decision = "Third decision with proper numbering.";
      const importance = "medium";

      const result = await ClimeMemoryIntegration.storeDecision(decision, importance);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new decision with correct numbering
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[1]).toContain('3. **Medium Priority Decision**');
      expect(writeCall[1]).toContain(decision);
    });
  });

  describe('Preference Updates', () => {
    test('should add a new preference to .clinerules', async () => {
      const preference = "The user prefers to use TypeScript for new projects, with a focus on strong typing and interface definitions.";
      const importance = "high";

      const result = await ClimeMemoryIntegration.storePreference(preference, importance);

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('.clinerules', 'utf8');
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new preference
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe('.clinerules');
      expect(writeCall[1]).toContain(preference);
    });

    test('should handle adding a preference when Project Preferences section does not exist', async () => {
      // Mock readFileSync to return content without the Project Preferences section
      fs.readFileSync.mockReturnValueOnce(`# Cline Rules

## Project Intelligence

This file captures important patterns, preferences, and project intelligence.`);

      const preference = "New preference without existing section.";
      const importance = "medium";

      const result = await ClimeMemoryIntegration.storePreference(preference, importance);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new section and preference
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[1]).toContain('## Project Preferences');
      expect(writeCall[1]).toContain(preference);
    });
  });

  describe('Concept Updates', () => {
    test('should add a new concept to productContext.md', async () => {
      const concept = "Vector Embeddings are numerical representations of text that capture semantic meaning, enabling similarity search.";
      const importance = "high";

      const result = await ClimeMemoryIntegration.storeMemory(
        concept,
        {
          category: "concept",
          importance: importance
        }
      );

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('productContext.md', 'utf8');
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Check that the writeFileSync was called with content that includes the new concept
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe('productContext.md');
      expect(writeCall[1]).toContain(concept);
    });
  });

  describe('Error Handling', () => {
    test('should handle file not found errors', async () => {
      // Mock existsSync to return false for a specific file
      fs.existsSync.mockReturnValueOnce(false);

      const result = await ClimeMemoryIntegration.updateMarkdownFile(
        "Test content",
        "unknown-category",
        "high"
      );

      expect(result).toBe(false);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('should handle file read errors', async () => {
      // Mock readFileSync to throw an error
      fs.readFileSync.mockImplementationOnce(() => {
        throw new Error('File read error');
      });

      const result = await ClimeMemoryIntegration.updateMarkdownFile(
        "Test content",
        "learning",
        "high"
      );

      expect(result).toBe(false);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('should handle file write errors', async () => {
      // Mock writeFileSync to throw an error
      fs.writeFileSync.mockImplementationOnce(() => {
        throw new Error('File write error');
      });

      const result = await ClimeMemoryIntegration.updateMarkdownFile(
        "Test content",
        "learning",
        "high"
      );

      expect(result).toBe(false);
    });
  });
});
