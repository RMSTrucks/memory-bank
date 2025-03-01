import * as fs from 'fs/promises';
import * as os from 'os';
import { constants } from 'fs';
import {
    PermissionValidationOptions,
    ValidationError,
    ValidationResult
} from '../types/validation';

/**
 * Validates file permissions and ownership
 */
export class PermissionValidator {
    /**
     * Validate file permissions
     */
    async validate(
        path: string,
        options: PermissionValidationOptions
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const info: ValidationError[] = [];
        let rulesChecked = 0;

        try {
            // Get file stats
            const stats = await fs.stat(path);
            const mode = stats.mode;
            const uid = stats.uid;
            const gid = stats.gid;

            // Check read access
            if (options.requireRead) {
                rulesChecked++;
                try {
                    await fs.access(path, constants.R_OK);
                    info.push({
                        code: 'READ_ACCESS',
                        message: 'File is readable',
                        path: 'permissions.read'
                    });
                } catch {
                    errors.push({
                        code: 'READ_ACCESS_DENIED',
                        message: 'Read access denied',
                        path: 'permissions.read'
                    });
                }
            }

            // Check write access
            if (options.requireWrite) {
                rulesChecked++;
                try {
                    await fs.access(path, constants.W_OK);
                    info.push({
                        code: 'WRITE_ACCESS',
                        message: 'File is writable',
                        path: 'permissions.write'
                    });
                } catch {
                    errors.push({
                        code: 'WRITE_ACCESS_DENIED',
                        message: 'Write access denied',
                        path: 'permissions.write'
                    });
                }
            }

            // Check execute access
            if (options.requireExecute) {
                rulesChecked++;
                try {
                    await fs.access(path, constants.X_OK);
                    info.push({
                        code: 'EXECUTE_ACCESS',
                        message: 'File is executable',
                        path: 'permissions.execute'
                    });
                } catch {
                    errors.push({
                        code: 'EXECUTE_ACCESS_DENIED',
                        message: 'Execute access denied',
                        path: 'permissions.execute'
                    });
                }
            }

            // Check ownership
            if (options.requireOwnership) {
                rulesChecked++;
                const currentUid = os.userInfo().uid;
                const currentGid = os.userInfo().gid;

                if (uid === currentUid) {
                    info.push({
                        code: 'USER_OWNER',
                        message: 'Current user owns the file',
                        path: 'permissions.ownership'
                    });
                } else if (gid === currentGid) {
                    info.push({
                        code: 'GROUP_OWNER',
                        message: 'Current group owns the file',
                        path: 'permissions.ownership'
                    });
                } else {
                    errors.push({
                        code: 'OWNERSHIP_REQUIRED',
                        message: 'File is not owned by current user or group',
                        path: 'permissions.ownership',
                        details: {
                            fileUid: uid,
                            fileGid: gid,
                            currentUid,
                            currentGid
                        }
                    });
                }
            }

            // Add permission mode info
            info.push({
                code: 'PERMISSION_MODE',
                message: `File permission mode: ${mode.toString(8)}`,
                path: 'permissions.mode',
                details: {
                    mode: mode.toString(8),
                    readable: Boolean(mode & constants.S_IRUSR),
                    writable: Boolean(mode & constants.S_IWUSR),
                    executable: Boolean(mode & constants.S_IXUSR)
                }
            });

        } catch (error) {
            errors.push({
                code: 'PERMISSION_CHECK_FAILED',
                message: `Failed to check permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
                path: 'permissions',
                details: { error }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            info,
            metadata: {
                duration: Date.now() - startTime,
                timestamp: new Date(),
                rulesChecked
            }
        };
    }

    /**
     * Check if current user has specific permission
     */
    async hasPermission(path: string, permission: number): Promise<boolean> {
        try {
            await fs.access(path, permission);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if current user owns the file
     */
    async isOwner(path: string): Promise<boolean> {
        try {
            const stats = await fs.stat(path);
            const currentUid = os.userInfo().uid;
            return stats.uid === currentUid;
        } catch {
            return false;
        }
    }

    /**
     * Check if current group owns the file
     */
    async isGroupOwner(path: string): Promise<boolean> {
        try {
            const stats = await fs.stat(path);
            const currentGid = os.userInfo().gid;
            return stats.gid === currentGid;
        } catch {
            return false;
        }
    }

    /**
     * Get file permissions as octal string
     */
    async getPermissions(path: string): Promise<string> {
        const stats = await fs.stat(path);
        return stats.mode.toString(8);
    }
}
