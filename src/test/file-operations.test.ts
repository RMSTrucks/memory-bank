import * as fs from 'fs/promises';
import * as path from 'path';
import { FileOperationsService } from '../services/file-operations.service';

async function testFileOperations() {
    const testDir = path.join(process.cwd(), 'test-files');
    const service = new FileOperationsService(testDir);

    try {
        console.log('Testing File Operations...\n');

        // Create test directory
        await fs.mkdir(testDir, { recursive: true });
        console.log('Created test directory:', testDir);

        // Create parent directories for test files
        await fs.mkdir(path.dirname(path.join(testDir, 'test.txt')), { recursive: true });
        await fs.mkdir(path.dirname(path.join(testDir, 'backup-test.txt')), { recursive: true });

        // Test write operation
        console.log('\nTesting write operation...');
        const writeResult = await service.writeFile('test.txt', 'Hello World!');
        console.log('Write result:', writeResult);

        // Test read operation
        console.log('\nTesting read operation...');
        const readResult = await service.readFile('test.txt');
        console.log('Read result:', readResult);

        // Test list operation
        console.log('\nTesting list operation...');
        const listResult = await service.listFiles('.');
        console.log('List result:', listResult);

        // Test move operation
        console.log('\nTesting move operation...');
        const moveResult = await service.moveFile('test.txt', 'moved.txt');
        console.log('Move result:', moveResult);

        // Test backup functionality
        console.log('\nTesting backup functionality...');
        const initialWrite = await service.writeFile('backup-test.txt', 'Initial content');
        console.log('Initial write result:', initialWrite);

        const updateWithBackup = await service.writeFile('backup-test.txt', 'Updated content');
        console.log('Update with backup result:', updateWithBackup);

        // Test delete operation
        console.log('\nTesting delete operation...');
        const deleteResult = await service.deleteFile('backup-test.txt');
        console.log('Delete result:', deleteResult);

        // Test error handling
        console.log('\nTesting error handling...');
        try {
            await service.writeFile('../outside.txt', 'Should fail');
        } catch (error) {
            console.log('Expected error:', error);
        }

        console.log('\nAll tests completed successfully');
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
        service.destroy();
    }
}

// Run the test
testFileOperations().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
