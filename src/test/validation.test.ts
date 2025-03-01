import { FileValidator } from '../utils/file-validator';
import {
    ContentFormat,
    ContentEncoding,
    ValidationOptions
} from '../types/validation';
import { FileMetadata } from '../types/files';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testValidation() {
    const testDir = path.join(process.cwd(), 'test-validation');
    const validator = new FileValidator();

    try {
        console.log('Testing File Validation System...\n');

        // Create test directory and file
        await fs.mkdir(testDir, { recursive: true });
        const testFilePath = path.join(testDir, 'test.md');
        const testContent = `# Test Document

This is a test document for validation.

## Features
- Content validation
- Permission validation
- Path validation
- Metadata validation`;

        await fs.writeFile(testFilePath, testContent, 'utf8');
        console.log('Created test file:', testFilePath);

        // Create test metadata
        const testMetadata: FileMetadata = {
            path: testFilePath,
            lastModified: new Date(),
            size: Buffer.byteLength(testContent),
            hash: '',
            version: 1,
            custom: {
                author: 'Test User',
                category: 'documentation'
            }
        };

        // Create validation options
        const options: ValidationOptions = {
            content: {
                format: ContentFormat.MARKDOWN,
                encoding: ContentEncoding.UTF8,
                sizeLimits: {
                    maxSize: 1024 * 1024, // 1MB
                    minSize: 10, // 10 bytes
                    warnThreshold: 1024 * 512 // 512KB
                }
            },
            permissions: {
                requireRead: true,
                requireWrite: true
            },
            path: {
                allowedExtensions: ['.md', '.txt'],
                baseDir: testDir,
                restrictedPatterns: ['\\.exe$', '\\.sh$']
            },
            metadata: {
                requiredFields: ['path', 'lastModified', 'size'],
                fieldTypes: {
                    'custom.author': 'string',
                    'custom.category': 'string'
                }
            }
        };

        // Test full validation
        console.log('\nTesting full validation...');
        const fullResult = await validator.validate(
            testFilePath,
            testContent,
            testMetadata,
            options
        );
        console.log('Full validation result:', fullResult);

        // Test individual validations
        console.log('\nTesting path validation...');
        const pathResult = await validator.validatePath(testFilePath, options.path);
        console.log('Path validation result:', pathResult);

        console.log('\nTesting permission validation...');
        const permissionResult = await validator.validatePermissions(testFilePath, options.permissions);
        console.log('Permission validation result:', permissionResult);

        console.log('\nTesting content validation...');
        const contentResult = await validator.validateContent(testContent, options.content);
        console.log('Content validation result:', contentResult);

        console.log('\nTesting metadata validation...');
        const metadataResult = await validator.validateMetadata(testMetadata, options.metadata);
        console.log('Metadata validation result:', metadataResult);

        // Test error cases
        console.log('\nTesting error cases...');

        // Invalid path
        try {
            await validator.validatePath('../outside.md', options.path);
        } catch (error) {
            console.log('Expected path error:', error);
        }

        // Invalid content
        try {
            const invalidContent = '{"invalid": "json"';
            await validator.validateContent(invalidContent, {
                format: ContentFormat.JSON
            });
        } catch (error) {
            console.log('Expected content error:', error);
        }

        // Invalid metadata
        try {
            const invalidMetadata = {
                ...testMetadata,
                custom: {
                    author: 123 // Should be string
                }
            };
            await validator.validateMetadata(invalidMetadata, options.metadata);
        } catch (error) {
            console.log('Expected metadata error:', error);
        }

        console.log('\nAll validation tests completed successfully');
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        // Clean up
        try {
            await fs.rm(testDir, { recursive: true, force: true });
            console.log('\nCleaned up test directory');
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
}

// Run the test
testValidation().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
