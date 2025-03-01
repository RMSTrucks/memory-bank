/**
 * Cline Memory Integration Tests
 *
 * This file contains tests for the Cline Memory Integration component,
 * which provides a high-level API for Cline to interact with the Memory System.
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
  queryMemories: jest.fn(async (server, query, namespace, limit) => [
    {
      id: "test-id-123",
      score: 0.95,
      text: "Test memory content",
      metadata: {
        category: "test",
        importance: "high",
        source: "test",
        timestamp: new Date().toISOString()
      }
    }
  ]),
  queryKnowledge: jest.fn(async (server, query, limit) => [
    {
      namespace: 'cline-core-knowledge',
      results: [
        {
          id: "test-id-123",
          score: 0.95,
          text: "Test memory content",
          metadata: {
            category: "test",
            importance: "high",
            source: "test",
            timestamp: new Date().toISOString()
          }
        }
      ]
    }
  ]),
  initialize: jest.fn(async () => true)
}));

// Mock fs for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn((path, encoding) => 'Mock file content'),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  statSync: jest.fn(() => ({
    mtime: new Date(),
    isDirectory: () => false
  }))
}));

describe('Cline Memory Integration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('System Management', () => {
    test('initialize should start the server', async () => {
      const MemorySystem = require('../scripts/memory-system');

      const result = await ClimeMemoryIntegration.initialize();

      expect(result).toBe(true);
      expect(MemorySystem.startServer).toHaveBeenCalled();
    });

    test('shutdown should kill the server', () => {
      // First initialize to set the server
      ClimeMemoryIntegration.initialize();

      const result = ClimeMemoryIntegration.shutdown();

      expect(result).toBe(true);
      expect(mockServer.kill).toHaveBeenCalled();
    });

    test('initializeMemorySystem should initialize the memory system', async () => {
      const MemorySystem = require('../scripts/memory-system');

      const result = await ClimeMemoryIntegration.initializeMemorySystem();

      expect(result).toBe(true);
      expect(MemorySystem.initialize).toHaveBeenCalled();
    });
  });

  describe('Memory Operations', () => {
    test('storeMemory should store a memory with the correct category and importance', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.storeMemory(
        "Test memory content",
        {
          category: "concept",
          importance: "high",
          metadata: {
            source: "test",
            topic: "memory-system"
          }
        }
      );

      expect(result).toBe(true);
      expect(MemorySystem.storeMemory).toHaveBeenCalledWith(
        mockServer,
        "Test memory content",
        expect.objectContaining({
          category: "concept",
          importance: "high"
        }),
        expect.any(String)
      );
    });

    test('storePattern should store a pattern in the patterns namespace', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.storePattern(
        "Test pattern",
        "high",
        { source: "test", topic: "patterns" }
      );

      expect(result).toBe(true);
      expect(MemorySystem.storeMemory).toHaveBeenCalledWith(
        mockServer,
        "Test pattern",
        expect.objectContaining({
          category: "pattern",
          importance: "high",
          type: "pattern"
        }),
        MemorySystem.CONFIG.namespaces.patterns
      );
    });

    test('storeLearning should store a learning in the core knowledge namespace', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.storeLearning(
        "Test learning",
        "medium",
        { source: "test", topic: "learning" }
      );

      expect(result).toBe(true);
      expect(MemorySystem.storeMemory).toHaveBeenCalledWith(
        mockServer,
        "Test learning",
        expect.objectContaining({
          category: "learning",
          importance: "medium",
          type: "learning"
        }),
        expect.any(String)
      );
    });

    test('storeDecision should store a decision in the interactions namespace', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.storeDecision(
        "Test decision",
        "critical",
        { source: "test", topic: "decision" }
      );

      expect(result).toBe(true);
      expect(MemorySystem.storeMemory).toHaveBeenCalledWith(
        mockServer,
        "Test decision",
        expect.objectContaining({
          category: "decision",
          importance: "critical",
          type: "decision"
        }),
        expect.any(String)
      );
    });

    test('storePreference should store a preference in the core knowledge namespace', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.storePreference(
        "Test preference",
        "high",
        { source: "test", topic: "preference" }
      );

      expect(result).toBe(true);
      expect(MemorySystem.storeMemory).toHaveBeenCalledWith(
        mockServer,
        "Test preference",
        expect.objectContaining({
          category: "preference",
          importance: "high",
          type: "preference"
        }),
        expect.any(String)
      );
    });

    test('storeError should store an error in the core knowledge namespace', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.storeError(
        "Test error",
        "medium",
        { source: "test", topic: "error" }
      );

      expect(result).toBe(true);
      expect(MemorySystem.storeMemory).toHaveBeenCalledWith(
        mockServer,
        "Test error",
        expect.objectContaining({
          category: "error",
          importance: "medium",
          type: "error"
        }),
        expect.any(String)
      );
    });
  });

  describe('Query Operations', () => {
    test('queryKnowledge should query across all namespaces', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.queryKnowledge("Test query");

      expect(result).toEqual(expect.any(Array));
      expect(MemorySystem.queryKnowledge).toHaveBeenCalledWith(
        mockServer,
        "Test query",
        ClimeMemoryIntegration.CONFIG.queryLimit
      );
    });

    test('queryPatterns should query the patterns namespace', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.queryPatterns("Test query");

      expect(result).toEqual(expect.any(Array));
      expect(MemorySystem.queryMemories).toHaveBeenCalledWith(
        mockServer,
        "Test query",
        MemorySystem.CONFIG.namespaces.patterns,
        ClimeMemoryIntegration.CONFIG.queryLimit
      );
    });

    test('queryInteractions should query the interactions namespace', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.queryInteractions("Test query");

      expect(result).toEqual(expect.any(Array));
      expect(MemorySystem.queryMemories).toHaveBeenCalledWith(
        mockServer,
        "Test query",
        MemorySystem.CONFIG.namespaces.interactions,
        ClimeMemoryIntegration.CONFIG.queryLimit
      );
    });
  });

  describe('Markdown Integration', () => {
    test('updateMarkdownFile should update a markdown file with a new memory', async () => {
      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      // Mock the content of the file
      fs.readFileSync.mockReturnValue('# Test File\n\n## Learning History\n\n1. **Existing Learning**\n   - Some existing learning\n');

      // Call the method
      const result = await ClimeMemoryIntegration.updateMarkdownFile(
        "New learning content",
        "learning",
        "high"
      );

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('updateMarkdownFile should handle non-existent sections', async () => {
      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      // Mock the content of the file without the section
      fs.readFileSync.mockReturnValue('# Test File\n\nSome content without the section\n');

      // Call the method
      const result = await ClimeMemoryIntegration.updateMarkdownFile(
        "New learning content",
        "learning",
        "high"
      );

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('updateMarkdownFile should handle non-existent files', async () => {
      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      // Mock the file not existing
      fs.existsSync.mockReturnValue(false);

      // Call the method
      const result = await ClimeMemoryIntegration.updateMarkdownFile(
        "New learning content",
        "unknown-category",
        "high"
      );

      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('storeMemory should handle errors', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // Mock an error
      MemorySystem.storeMemory.mockRejectedValue(new Error('Test error'));

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.storeMemory(
        "Test memory content",
        {
          category: "concept",
          importance: "high"
        }
      );

      expect(result).toBe(false);
    });

    test('queryKnowledge should handle errors', async () => {
      const MemorySystem = require('../scripts/memory-system');

      // Mock an error
      MemorySystem.queryKnowledge.mockRejectedValue(new Error('Test error'));

      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      const result = await ClimeMemoryIntegration.queryKnowledge("Test query");

      expect(result).toEqual([]);
    });

    test('updateMarkdownFile should handle file errors', async () => {
      // First initialize to set the server
      await ClimeMemoryIntegration.initialize();

      // Mock a file error
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File error');
      });

      const result = await ClimeMemoryIntegration.updateMarkdownFile(
        "New learning content",
        "learning",
        "high"
      );

      expect(result).toBe(false);
    });
  });
});
