import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileBackupError } from '../errors/file-errors';

/**
 * Manages file backups for safe operations
 */
export class BackupManager {
    constructor(
        private backupDir: string = '.backups',
        private maxBackups: number = 10,
        private cleanupInterval: number = 24 * 60 * 60 * 1000 // 24 hours
    ) {
        this.init();
    }

    /**
     * Initialize backup system
     */
    private async init(): Promise<void> {
        try {
            await fsPromises.mkdir(this.backupDir, { recursive: true });
            setInterval(() => this.cleanup(), this.cleanupInterval);
        } catch (error) {
            console.error('Failed to initialize backup system:', error);
        }
    }

    /**
     * Create a backup of a file
     */
    async createBackup(filePath: string): Promise<string> {
        try {
            // Generate backup path
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const hash = crypto.createHash('md5').update(filePath).digest('hex').slice(0, 8);
            const backupName = `${path.basename(filePath)}.${timestamp}.${hash}.bak`;
            const backupPath = path.join(this.backupDir, backupName);

            // Create backup
            await fsPromises.copyFile(filePath, backupPath);

            // Store metadata
            await this.storeMetadata(backupPath, {
                originalPath: filePath,
                timestamp: new Date(),
                hash: await this.calculateFileHash(filePath)
            });

            return backupPath;
        } catch (error) {
            throw new FileBackupError(filePath, 'createBackup', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Restore a file from backup
     */
    async restore(backupPath: string): Promise<string> {
        try {
            // Get metadata
            const metadata = await this.getMetadata(backupPath);
            if (!metadata) {
                throw new Error('Backup metadata not found');
            }

            // Restore file
            await fsPromises.copyFile(backupPath, metadata.originalPath);

            return metadata.originalPath;
        } catch (error) {
            throw new FileBackupError(backupPath, 'restore', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * List all backups for a file
     */
    async listBackups(filePath: string): Promise<string[]> {
        try {
            const files = await fsPromises.readdir(this.backupDir);
            const hash = crypto.createHash('md5').update(filePath).digest('hex').slice(0, 8);
            return files
                .filter(file => file.includes(hash))
                .map(file => path.join(this.backupDir, file));
        } catch (error) {
            throw new FileBackupError(filePath, 'listBackups', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Delete a specific backup
     */
    async deleteBackup(backupPath: string): Promise<void> {
        try {
            await fsPromises.unlink(backupPath);
            await this.deleteMetadata(backupPath);
        } catch (error) {
            throw new FileBackupError(backupPath, 'deleteBackup', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Clean up old backups
     */
    private async cleanup(): Promise<void> {
        try {
            const files = await fsPromises.readdir(this.backupDir);
            const backups = await Promise.all(
                files.map(async file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fsPromises.stat(filePath);
                    return { path: filePath, timestamp: stats.mtime };
                })
            );

            // Group backups by original file
            const groupedBackups = backups.reduce((groups, backup) => {
                const metadata = this.getMetadataSync(backup.path);
                if (metadata) {
                    const originalPath = metadata.originalPath;
                    if (!groups[originalPath]) {
                        groups[originalPath] = [];
                    }
                    groups[originalPath].push(backup);
                }
                return groups;
            }, {} as Record<string, typeof backups>);

            // Keep only the most recent backups for each file
            for (const fileBackups of Object.values(groupedBackups)) {
                if (fileBackups.length > this.maxBackups) {
                    const toDelete = fileBackups
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .slice(this.maxBackups);

                    for (const backup of toDelete) {
                        await this.deleteBackup(backup.path);
                    }
                }
            }
        } catch (error) {
            console.error('Backup cleanup failed:', error);
        }
    }

    /**
     * Calculate file hash
     */
    private async calculateFileHash(filePath: string): Promise<string> {
        const content = await fsPromises.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Store backup metadata
     */
    private async storeMetadata(
        backupPath: string,
        metadata: { originalPath: string; timestamp: Date; hash: string }
    ): Promise<void> {
        const metadataPath = this.getMetadataPath(backupPath);
        await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }

    /**
     * Get backup metadata
     */
    private async getMetadata(backupPath: string): Promise<{
        originalPath: string;
        timestamp: Date;
        hash: string;
    } | null> {
        try {
            const metadataPath = this.getMetadataPath(backupPath);
            const content = await fsPromises.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(content);
            metadata.timestamp = new Date(metadata.timestamp);
            return metadata;
        } catch {
            return null;
        }
    }

    /**
     * Get backup metadata synchronously
     */
    private getMetadataSync(backupPath: string): {
        originalPath: string;
        timestamp: Date;
        hash: string;
    } | null {
        try {
            const metadataPath = this.getMetadataPath(backupPath);
            const content = fs.readFileSync(metadataPath, 'utf8');
            const metadata = JSON.parse(content);
            metadata.timestamp = new Date(metadata.timestamp);
            return metadata;
        } catch {
            return null;
        }
    }

    /**
     * Delete backup metadata
     */
    private async deleteMetadata(backupPath: string): Promise<void> {
        try {
            const metadataPath = this.getMetadataPath(backupPath);
            await fsPromises.unlink(metadataPath);
        } catch {
            // Ignore errors when deleting metadata
        }
    }

    /**
     * Get metadata file path
     */
    private getMetadataPath(backupPath: string): string {
        return `${backupPath}.meta`;
    }
}
