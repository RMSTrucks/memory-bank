import {
    ValidationOptions,
    ValidationError,
    ValidationResult
} from '../types/validation';
import { FileMetadata } from '../types/files';
import { ContentValidator } from './content-validator';
import { PermissionValidator } from './permission-validator';
import { PathValidator } from './path-validator';
import { MetadataValidator } from './metadata-validator';

/**
 * Main file validation coordinator
 */
export class FileValidator {
    private contentValidator: ContentValidator;
    private permissionValidator: PermissionValidator;
    private pathValidator: PathValidator;
    private metadataValidator: MetadataValidator;

    constructor() {
        this.contentValidator = new ContentValidator();
        this.permissionValidator = new PermissionValidator();
        this.pathValidator = new PathValidator();
        this.metadataValidator = new MetadataValidator();
    }

    /**
     * Validate file
     */
    async validate(
        path: string,
        content: string | Buffer,
        metadata: FileMetadata,
        options: ValidationOptions
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const info: ValidationError[] = [];
        let rulesChecked = 0;

        try {
            // Validate path
            if (options.path) {
                const pathResult = await this.pathValidator.validate(path, options.path);
                errors.push(...pathResult.errors);
                warnings.push(...pathResult.warnings);
                info.push(...pathResult.info);
                rulesChecked += pathResult.metadata.rulesChecked;
            }

            // Validate permissions
            if (options.permissions) {
                const permissionResult = await this.permissionValidator.validate(path, options.permissions);
                errors.push(...permissionResult.errors);
                warnings.push(...permissionResult.warnings);
                info.push(...permissionResult.info);
                rulesChecked += permissionResult.metadata.rulesChecked;
            }

            // Validate content
            if (options.content) {
                const contentResult = await this.contentValidator.validate(content, options.content);
                errors.push(...contentResult.errors);
                warnings.push(...contentResult.warnings);
                info.push(...contentResult.info);
                rulesChecked += contentResult.metadata.rulesChecked;
            }

            // Validate metadata
            if (options.metadata) {
                const metadataResult = await this.metadataValidator.validate(metadata, options.metadata);
                errors.push(...metadataResult.errors);
                warnings.push(...metadataResult.warnings);
                info.push(...metadataResult.info);
                rulesChecked += metadataResult.metadata.rulesChecked;
            }

            // Add validation summary
            info.push({
                code: 'VALIDATION_SUMMARY',
                message: 'File validation summary',
                path: 'validation',
                details: {
                    path,
                    contentSize: Buffer.byteLength(content),
                    metadataFields: Object.keys(metadata),
                    validationTypes: Object.keys(options)
                }
            });

        } catch (error) {
            errors.push({
                code: 'VALIDATION_FAILED',
                message: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                path: 'validation',
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
     * Validate file path only
     */
    async validatePath(path: string, options: ValidationOptions['path']): Promise<ValidationResult> {
        return this.pathValidator.validate(path, options || {});
    }

    /**
     * Validate file permissions only
     */
    async validatePermissions(path: string, options: ValidationOptions['permissions']): Promise<ValidationResult> {
        return this.permissionValidator.validate(path, options || {});
    }

    /**
     * Validate file content only
     */
    async validateContent(content: string | Buffer, options: ValidationOptions['content']): Promise<ValidationResult> {
        return this.contentValidator.validate(content, options || {});
    }

    /**
     * Validate file metadata only
     */
    async validateMetadata(metadata: FileMetadata, options: ValidationOptions['metadata']): Promise<ValidationResult> {
        return this.metadataValidator.validate(metadata, options || {});
    }

    /**
     * Get individual validators
     */
    getValidators() {
        return {
            content: this.contentValidator,
            permissions: this.permissionValidator,
            path: this.pathValidator,
            metadata: this.metadataValidator
        };
    }
}
