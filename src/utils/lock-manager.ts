import { FileLock } from '../types/files';
import { FileLockError } from '../errors/file-errors';

/**
 * Manages file locks to prevent concurrent access
 */
export class LockManager {
    private locks: Map<string, FileLock>;
    private cleanupInterval: NodeJS.Timeout;

    constructor(private defaultTimeout: number = 30000) {
        this.locks = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Acquire a lock for a file
     */
    async acquire(
        path: string,
        holder: string,
        timeout: number = this.defaultTimeout
    ): Promise<FileLock> {
        if (this.isLocked(path)) {
            const lock = this.locks.get(path)!;
            throw new FileLockError(
                path,
                'acquire',
                lock.holder,
                {
                    acquiredAt: lock.acquiredAt,
                    timeout: lock.timeout
                }
            );
        }

        const lock: FileLock = {
            path,
            holder,
            acquiredAt: new Date(),
            timeout,
            metadata: {
                expiresAt: new Date(Date.now() + timeout)
            }
        };

        this.locks.set(path, lock);
        return lock;
    }

    /**
     * Release a lock for a file
     */
    async release(path: string, holder: string): Promise<void> {
        const lock = this.locks.get(path);
        if (!lock) {
            return;
        }

        if (lock.holder !== holder) {
            throw new FileLockError(
                path,
                'release',
                lock.holder,
                {
                    requestedBy: holder,
                    acquiredAt: lock.acquiredAt
                }
            );
        }

        this.locks.delete(path);
    }

    /**
     * Check if a file is locked
     */
    isLocked(path: string): boolean {
        const lock = this.locks.get(path);
        if (!lock) {
            return false;
        }

        // Check if lock has expired
        const now = Date.now();
        const expiresAt = lock.acquiredAt.getTime() + lock.timeout;
        if (now > expiresAt) {
            this.locks.delete(path);
            return false;
        }

        return true;
    }

    /**
     * Get lock information for a file
     */
    getLock(path: string): FileLock | undefined {
        if (!this.isLocked(path)) {
            return undefined;
        }
        return this.locks.get(path);
    }

    /**
     * Get all active locks
     */
    getActiveLocks(): FileLock[] {
        return Array.from(this.locks.values()).filter(
            lock => {
                const now = Date.now();
                const expiresAt = lock.acquiredAt.getTime() + lock.timeout;
                return now <= expiresAt;
            }
        );
    }

    /**
     * Clean up expired locks
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [path, lock] of this.locks.entries()) {
            const expiresAt = lock.acquiredAt.getTime() + lock.timeout;
            if (now > expiresAt) {
                this.locks.delete(path);
            }
        }
    }

    /**
     * Stop the cleanup interval
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.locks.clear();
    }
}
