import * as path from 'path';
import * as fs from 'fs/promises';
import {
    PathValidationOptions,
    ValidationError,
    ValidationResult
} from '../types/validation';

/**
 * Validates file paths for security and correctness
 */
export class PathValidator {
    /**
     * Validate file path
     */
    async validate(
        filePath: string,
        options: PathValidationOptions
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const info: ValidationError[] = [];
        let rulesChecked = 0;

        try {
            // Normalize path
            const normalizedPath = path.normalize(filePath);
            const resolvedPath = options.baseDir
                ? path.resolve(options.baseDir, normalizedPath)
                : path.resolve(normalizedPath);

            // Check if path exists
            rulesChecked++;
            try {
                await fs.access(resolvedPath);
                info.push({
                    code: 'PATH_EXISTS',
                    message: 'Path exists',
                    path: 'path.exists'
                });
            } catch {
                warnings.push({
                    code: 'PATH_NOT_FOUND',
                    message: 'Path does not exist',
                    path: 'path.exists'
                });
            }

            // Check if path is within base directory
            if (options.baseDir) {
                rulesChecked++;
                const baseDir = path.resolve(options.baseDir);
                if (!resolvedPath.startsWith(baseDir)) {
                    errors.push({
                        code: 'PATH_TRAVERSAL',
                        message: 'Path traversal detected',
                        path: 'path.security',
                        details: {
                            resolvedPath,
                            baseDir
                        }
                    });
                }
            }

            // Check file extension
            if (options.allowedExtensions?.length) {
                rulesChecked++;
                const ext = path.extname(resolvedPath).toLowerCase();
                if (!options.allowedExtensions.includes(ext)) {
                    errors.push({
                        code: 'INVALID_EXTENSION',
                        message: `File extension ${ext} not allowed`,
                        path: 'path.extension',
                        details: {
                            extension: ext,
                            allowedExtensions: options.allowedExtensions
                        }
                    });
                }
            }

            // Check allowed patterns
            if (options.allowedPatterns?.length) {
                rulesChecked++;
                const matchesAllowed = options.allowedPatterns.some(pattern => {
                    const regex = new RegExp(pattern);
                    return regex.test(resolvedPath);
                });

                if (!matchesAllowed) {
                    errors.push({
                        code: 'PATH_NOT_ALLOWED',
                        message: 'Path does not match allowed patterns',
                        path: 'path.pattern',
                        details: {
                            path: resolvedPath,
                            allowedPatterns: options.allowedPatterns
                        }
                    });
                }
            }

            // Check restricted patterns
            if (options.restrictedPatterns?.length) {
                rulesChecked++;
                const matchesRestricted = options.restrictedPatterns.some(pattern => {
                    const regex = new RegExp(pattern);
                    return regex.test(resolvedPath);
                });

                if (matchesRestricted) {
                    errors.push({
                        code: 'PATH_RESTRICTED',
                        message: 'Path matches restricted pattern',
                        path: 'path.pattern',
                        details: {
                            path: resolvedPath,
                            restrictedPatterns: options.restrictedPatterns
                        }
                    });
                }
            }

            // Add path info
            info.push({
                code: 'PATH_INFO',
                message: 'Path information',
                path: 'path',
                details: {
                    original: filePath,
                    normalized: normalizedPath,
                    resolved: resolvedPath,
                    dirname: path.dirname(resolvedPath),
                    basename: path.basename(resolvedPath),
                    extension: path.extname(resolvedPath)
                }
            });

        } catch (error) {
            errors.push({
                code: 'PATH_VALIDATION_FAILED',
                message: `Failed to validate path: ${error instanceof Error ? error.message : 'Unknown error'}`,
                path: 'path',
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
     * Check if path exists
     */
    async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if path is within base directory
     */
    isWithinBaseDir(filePath: string, baseDir: string): boolean {
        const resolvedPath = path.resolve(filePath);
        const resolvedBase = path.resolve(baseDir);
        return resolvedPath.startsWith(resolvedBase);
    }

    /**
     * Check if path matches pattern
     */
    matchesPattern(filePath: string, pattern: string): boolean {
        const regex = new RegExp(pattern);
        return regex.test(filePath);
    }

    /**
     * Get path components
     */
    getPathInfo(filePath: string): {
        dirname: string;
        basename: string;
        extension: string;
        normalized: string;
        resolved: string;
    } {
        const normalized = path.normalize(filePath);
        const resolved = path.resolve(normalized);
        return {
            dirname: path.dirname(resolved),
            basename: path.basename(resolved),
            extension: path.extname(resolved),
            normalized,
            resolved
        };
    }
}
