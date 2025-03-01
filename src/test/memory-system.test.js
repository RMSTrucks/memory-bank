/**
 * Memory System Tests
 *
 * This file contains tests for the Memory System core functionality.
 * It tests the basic operations of storing and retrieving memories from Pinecone.
 */

const MemorySystem = require('../scripts/memory-system');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock server for testing
let mockServer = {
  kill: jest.fn()
};

// Mock mcpDirectAccess for testing
jest.mock('../utils/mcp-direct-access', () => ({
  startServer: jest.fn(() => mockServer),
  storeMemory: jest.fn(async (server, text, metadata) => {
    return "Memory stored successfully with ID: test-id-123";
  }),
  queryMemories: jest.fn(async (server, query, limit) => {
    return [
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
    ];
  })
}));

describe('Memory System', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Server Management', () => {
    test('startServer should initialize a server instance', () => {
      const server = MemorySystem.startServer();
      expect(server).toBe(mockServer);
    });

    test('initialize should start the server and process files', async () => {
      // Mock the processCoreKnowledge and processAdditionalKnowledge methods
      const processCoreKnowledgeSpy = jest.spyOn(MemorySystem, 'processCoreKnowledge').mockResolvedValue(true);
      const processAdditionalKnowledgeSpy = jest.spyOn(MemorySystem, 'processAdditionalKnowledge').mockResolvedValue(true);

      await MemorySystem.initialize();

      expect(processCoreKnowledgeSpy).toHaveBeenCalled();
      expect(processAdditionalKnowledgeSpy).toHaveBeenCalled();
    });
  });

  describe('Memory Operations', () => {
    test('storeMemory should store a memory in Pinecone', async () => {
      const mcpDirectAccess = require('../utils/mcp-direct-access');

      const result = await MemorySystem.storeMemory(
        mockServer,
        "Test memory content",
        {
          category: "test",
          importance: "high"
        },
        MemorySystem.CONFIG.namespaces.coreKnowledge
      );

      expect(result).toBe(true);
      expect(mcpDirectAccess.storeMemory).toHaveBeenCalledWith(
        mockServer,
        "Test memory content",
        expect.objectContaining({
          category: "test",
          importance: "high",
          namespace: MemorySystem.CONFIG.namespaces.coreKnowledge
        })
      );
    });

    test('queryMemories should retrieve memories from Pinecone', async () => {
      const mcpDirectAccess = require('../utils/mcp-direct-access');

      const result = await MemorySystem.queryMemories(
        mockServer,
        "Test query",
        MemorySystem.CONFIG.namespaces.coreKnowledge,
        5
      );

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe("Test memory content");
      expect(mcpDirectAccess.queryMemories).toHaveBeenCalledWith(
        mockServer,
        "Test query",
        5
      );
    });

    test('storePattern should store a pattern in Pinecone', async () => {
      const storeMemorySpy = jest.spyOn(MemorySystem, 'storeMemory').mockResolvedValue(true);

      const result = await MemorySystem.storePattern(
        mockServer,
        "Test pattern",
        { category: "pattern" }
      );

      expect(result).toBe(true);
      expect(storeMemorySpy).toHaveBeenCalledWith(
        mockServer,
        "Test pattern",
        expect.objectContaining({
          type: "pattern",
          source: "learning",
          category: "pattern"
        }),
        MemorySystem.CONFIG.namespaces.patterns
      );
    });

    test('storeInteraction should store an interaction in Pinecone', async () => {
      const storeMemorySpy = jest.spyOn(MemorySystem, 'storeMemory').mockResolvedValue(true);

      const result = await MemorySystem.storeInteraction(
        mockServer,
        "Test interaction",
        { category: "interaction" }
      );

      expect(result).toBe(true);
      expect(storeMemorySpy).toHaveBeenCalledWith(
        mockServer,
        "Test interaction",
        expect.objectContaining({
          type: "interaction",
          source: "conversation",
          category: "interaction"
        }),
        MemorySystem.CONFIG.namespaces.interactions
      );
    });
  });

  describe('File Processing', () => {
    test('processFile should process a file and store its content in Pinecone', async () => {
      // Mock fs.readFileSync and chunkText
      jest.spyOn(fs, 'readFileSync').mockReturnValue('Test file content');
      jest.spyOn(MemorySystem, 'chunkText').mockReturnValue([
        {
          content: 'Test chunk 1',
          metadata: { source: 'file', sourcePath: 'test.md' }
        },
        {
          content: 'Test chunk 2',
          metadata: { source: 'file', sourcePath: 'test.md' }
        }
      ]);

      // Mock processChunk
      jest.spyOn(MemorySystem, 'processChunk').mockResolvedValue(true);

      const result = await MemorySystem.processFile(
        mockServer,
        'test.md',
        MemorySystem.CONFIG.namespaces.coreKnowledge
      );

      expect(result).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('test.md', 'utf8');
      expect(MemorySystem.chunkText).toHaveBeenCalledWith('Test file content', 'test.md');
      expect(MemorySystem.processChunk).toHaveBeenCalledTimes(2);
    });

    test('processCoreKnowledge should process core knowledge files', async () => {
      // Mock processFile
      const processFileSpy = jest.spyOn(MemorySystem, 'processFile').mockResolvedValue(true);

      await MemorySystem.processCoreKnowledge(mockServer);

      // Should process each core file
      expect(processFileSpy).toHaveBeenCalledTimes(MemorySystem.CONFIG.coreFiles.length);
      expect(processFileSpy).toHaveBeenCalledWith(
        mockServer,
        expect.any(String),
        MemorySystem.CONFIG.namespaces.coreKnowledge
      );
    });

    test('processAdditionalKnowledge should process additional knowledge directories', async () => {
      // Mock getAllFiles and processFile
      jest.spyOn(MemorySystem, 'getAllFiles').mockReturnValue(['test1.md', 'test2.md']);
      const processFileSpy = jest.spyOn(MemorySystem, 'processFile').mockResolvedValue(true);

      await MemorySystem.processAdditionalKnowledge(mockServer);

      // Should process each directory
      expect(MemorySystem.getAllFiles).toHaveBeenCalledTimes(MemorySystem.CONFIG.knowledgeDirs.length);
      // Should process each file in each directory
      expect(processFileSpy).toHaveBeenCalledTimes(MemorySystem.CONFIG.knowledgeDirs.length * 2);
    });
  });

  describe('Query Operations', () => {
    test('queryKnowledge should query across all namespaces', async () => {
      // Mock queryMemories
      const queryMemoriesSpy = jest.spyOn(MemorySystem, 'queryMemories').mockResolvedValue([
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
      ]);

      const result = await MemorySystem.queryKnowledge(mockServer, "Test query", 5);

      // Should query each namespace
      expect(queryMemoriesSpy).toHaveBeenCalledTimes(4);
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(expect.objectContaining({
        namespace: expect.any(String),
        results: expect.any(Array)
      }));
    });
  });

  describe('Utility Functions', () => {
    test('chunkText should split text into chunks', () => {
      const text = 'This is a test paragraph.\n\nThis is another test paragraph.\n\nAnd this is a third test paragraph.';
      const filePath = 'test.md';

      const result = MemorySystem.chunkText(text, filePath);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual(expect.objectContaining({
        content: expect.any(String),
        metadata: expect.objectContaining({
          source: 'file',
          sourcePath: filePath,
          fileName: 'test.md',
          fileType: '.md',
          chunkIndex: 0
        })
      }));
    });

    test('getAllFiles should get all files recursively', () => {
      // Mock fs.readdirSync and fs.statSync
      jest.spyOn(fs, 'readdirSync').mockReturnValue(['file1.md', 'file2.js', 'dir1']);
      jest.spyOn(fs, 'statSync').mockImplementation((path) => ({
        isDirectory: () => path.endsWith('dir1')
      }));

      // Mock recursive call
      const getAllFilesSpy = jest.spyOn(MemorySystem, 'getAllFiles');
      getAllFilesSpy.mockImplementation((dir, fileList = []) => {
        if (dir === 'dir1') {
          fileList.push('dir1/file3.md');
          return fileList;
        }

        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            if (!MemorySystem.CONFIG.excludeDirs.includes(file)) {
              getAllFilesSpy(filePath, fileList);
            }
          } else {
            const ext = path.extname(file);
            if (MemorySystem.CONFIG.includeExtensions.includes(ext)) {
              fileList.push(filePath);
            }
          }
        });

        return fileList;
      });

      const result = MemorySystem.getAllFiles('test-dir');

      expect(result).toContain('test-dir/file1.md');
      expect(result).not.toContain('test-dir/file2.js'); // Not included extension
      expect(result).toContain('dir1/file3.md');
    });
  });
});
