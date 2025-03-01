const tokenCounter = require('../context-optimizer/token-counter');
const { countTokens, countFileTokens, countMultipleFileTokens, getTotalTokens } = tokenCounter;
const fs = require('fs').promises;
const path = require('path');

describe('Token Counter', () => {
  describe('countTokens', () => {
    test('should count tokens accurately for simple text', () => {
      const text = 'Hello, world!';
      const count = countTokens(text);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(10);
    });

    test('should handle empty string', () => {
      expect(countTokens('')).toBe(0);
    });

    test('should handle special characters', () => {
      const text = '🌟 Special characters: @#$%^&*()';
      const count = countTokens(text);
      expect(count).toBeGreaterThan(5);
    });

    test('should handle code snippets', () => {
      const code = `
        function example() {
          return "Hello, world!";
        }
      `;
      const count = countTokens(code);
      expect(count).toBeGreaterThan(10);
    });

    test('should throw error for non-string input', () => {
      expect(() => countTokens(123)).toThrow('Input must be a string');
      expect(() => countTokens(null)).toThrow('Input must be a string');
      expect(() => countTokens(undefined)).toThrow('Input must be a string');
      expect(() => countTokens({})).toThrow('Input must be a string');
    });
  });

  describe('countFileTokens', () => {
    const testFilePath = path.join(__dirname, 'test-file.txt');

    beforeEach(async () => {
      await fs.writeFile(testFilePath, 'This is a test file.\nIt has multiple lines.\nEach line should be counted.');
    });

    afterEach(async () => {
      try {
        await fs.unlink(testFilePath);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    });

    test('should count tokens in a file', async () => {
      const count = await countFileTokens(testFilePath);
      expect(count).toBeGreaterThan(10);
    });

    test('should return 0 for non-existent file', async () => {
      const count = await countFileTokens('non-existent-file.txt');
      expect(count).toBe(0);
    });

    test('should throw error for non-string file path', async () => {
      await expect(countFileTokens(123)).rejects.toThrow('File path must be a string');
      await expect(countFileTokens(null)).rejects.toThrow('File path must be a string');
      await expect(countFileTokens(undefined)).rejects.toThrow('File path must be a string');
    });
  });

  describe('countMultipleFileTokens', () => {
    const testFiles = [
      path.join(__dirname, 'test-file1.txt'),
      path.join(__dirname, 'test-file2.txt')
    ];

    beforeEach(async () => {
      await fs.writeFile(testFiles[0], 'First test file content');
      await fs.writeFile(testFiles[1], 'Second test file content');
    });

    afterEach(async () => {
      for (const file of testFiles) {
        try {
          await fs.unlink(file);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }
    });

    test('should count tokens in multiple files', async () => {
      const results = await countMultipleFileTokens(testFiles);
      expect(Object.keys(results)).toHaveLength(2);
      expect(results[testFiles[0]]).toBeGreaterThan(0);
      expect(results[testFiles[1]]).toBeGreaterThan(0);
    });

    test('should throw error for non-array input', async () => {
      await expect(countMultipleFileTokens('not-an-array')).rejects.toThrow('File paths must be an array');
      await expect(countMultipleFileTokens(123)).rejects.toThrow('File paths must be an array');
      await expect(countMultipleFileTokens(null)).rejects.toThrow('File paths must be an array');
    });
  });

  describe('getTotalTokens', () => {
    const testFiles = [
      path.join(__dirname, 'test-file1.txt'),
      path.join(__dirname, 'test-file2.txt')
    ];

    beforeEach(async () => {
      await fs.writeFile(testFiles[0], 'First test file content');
      await fs.writeFile(testFiles[1], 'Second test file content');
    });

    afterEach(async () => {
      for (const file of testFiles) {
        try {
          await fs.unlink(file);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }
    });

    test('should get total tokens from multiple files', async () => {
      const total = await getTotalTokens(testFiles);
      expect(total).toBeGreaterThan(0);
    });

    test('should throw error for non-array input', async () => {
      await expect(getTotalTokens('not-an-array')).rejects.toThrow('File paths must be an array');
      await expect(getTotalTokens(123)).rejects.toThrow('File paths must be an array');
      await expect(getTotalTokens(null)).rejects.toThrow('File paths must be an array');
    });
  });
});
