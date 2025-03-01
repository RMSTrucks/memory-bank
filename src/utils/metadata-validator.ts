import {
    MetadataValidationOptions,
    ValidationError,
    ValidationResult,
    ValidationRule
} from '../types/validation';
import { FileMetadata } from '../types/files';

/**
 * Validates file metadata
 */
export class MetadataValidator {
    /**
     * Validate file metadata
     */
    async validate(
        metadata: FileMetadata,
        options: MetadataValidationOptions
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const info: ValidationError[] = [];
        let rulesChecked = 0;

        try {
            // Check required fields
            if (options.requiredFields?.length) {
                rulesChecked++;
                for (const field of options.requiredFields) {
                    const value = this.getFieldValue(metadata, field);
                    if (value === undefined) {
                        errors.push({
                            code: 'MISSING_FIELD',
                            message: `Required field "${field}" is missing`,
                            path: `metadata.${field}`
                        });
                    } else {
                        info.push({
                            code: 'FIELD_PRESENT',
                            message: `Required field "${field}" is present`,
                            path: `metadata.${field}`,
                            details: { value }
                        });
                    }
                }
            }

            // Check field types
            if (options.fieldTypes) {
                rulesChecked++;
                for (const [field, expectedType] of Object.entries(options.fieldTypes)) {
                    const value = this.getFieldValue(metadata, field);
                    if (value !== undefined) {
                        const actualType = this.getValueType(value);
                        if (actualType !== expectedType) {
                            errors.push({
                                code: 'INVALID_TYPE',
                                message: `Field "${field}" has invalid type. Expected ${expectedType}, got ${actualType}`,
                                path: `metadata.${field}`,
                                details: {
                                    expectedType,
                                    actualType,
                                    value
                                }
                            });
                        } else {
                            info.push({
                                code: 'VALID_TYPE',
                                message: `Field "${field}" has valid type ${expectedType}`,
                                path: `metadata.${field}`,
                                details: { value }
                            });
                        }
                    }
                }
            }

            // Run custom field validations
            if (options.fieldValidations) {
                for (const [field, rule] of Object.entries(options.fieldValidations)) {
                    rulesChecked++;
                    const value = this.getFieldValue(metadata, field);
                    if (value !== undefined) {
                        try {
                            const valid = await rule.validate(value);
                            if (!valid) {
                                const error: ValidationError = {
                                    code: rule.name.toUpperCase(),
                                    message: rule.errorMessage,
                                    path: `metadata.${field}`,
                                    rule,
                                    details: { value }
                                };

                                switch (rule.severity) {
                                    case 'error':
                                        errors.push(error);
                                        break;
                                    case 'warning':
                                        warnings.push(error);
                                        break;
                                    case 'info':
                                        info.push(error);
                                        break;
                                }
                            } else {
                                info.push({
                                    code: 'VALIDATION_PASSED',
                                    message: `Field "${field}" passed validation rule "${rule.name}"`,
                                    path: `metadata.${field}`,
                                    rule,
                                    details: { value }
                                });
                            }
                        } catch (err) {
                            errors.push({
                                code: 'VALIDATION_ERROR',
                                message: `Validation rule "${rule.name}" failed for field "${field}": ${err instanceof Error ? err.message : 'Unknown error'}`,
                                path: `metadata.${field}`,
                                rule,
                                details: { value, error: err }
                            });
                        }
                    }
                }
            }

            // Add metadata summary
            info.push({
                code: 'METADATA_SUMMARY',
                message: 'Metadata validation summary',
                path: 'metadata',
                details: {
                    fields: Object.keys(metadata),
                    customFields: metadata.custom ? Object.keys(metadata.custom) : []
                }
            });

        } catch (error) {
            errors.push({
                code: 'METADATA_VALIDATION_FAILED',
                message: `Failed to validate metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
                path: 'metadata',
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
     * Get field value from metadata
     */
    private getFieldValue(metadata: FileMetadata, field: string): unknown {
        if (field.startsWith('custom.') && metadata.custom) {
            const customField = field.slice(7);
            return metadata.custom[customField];
        }
        return (metadata as any)[field];
    }

    /**
     * Get value type
     */
    private getValueType(value: unknown): string {
        if (value === null) return 'null';
        if (value instanceof Date) return 'date';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * Create a metadata validation rule
     */
    static createRule(
        name: string,
        description: string,
        validate: (value: unknown) => Promise<boolean>,
        errorMessage: string,
        severity: 'error' | 'warning' | 'info' = 'error'
    ): ValidationRule {
        return {
            name,
            description,
            validate,
            errorMessage,
            severity
        };
    }

    /**
     * Common validation rules
     */
    static rules = {
        /**
         * Validate date is not in the future
         */
        notFutureDate: MetadataValidator.createRule(
            'notFutureDate',
            'Date should not be in the future',
            async (value) => {
                if (!(value instanceof Date)) return false;
                return value <= new Date();
            },
            'Date is in the future'
        ),

        /**
         * Validate string matches pattern
         */
        matchPattern: (pattern: RegExp) => MetadataValidator.createRule(
            'matchPattern',
            `Value should match pattern ${pattern}`,
            async (value) => {
                if (typeof value !== 'string') return false;
                return pattern.test(value);
            },
            `Value does not match pattern ${pattern}`
        ),

        /**
         * Validate number is within range
         */
        numberRange: (min: number, max: number) => MetadataValidator.createRule(
            'numberRange',
            `Number should be between ${min} and ${max}`,
            async (value) => {
                if (typeof value !== 'number') return false;
                return value >= min && value <= max;
            },
            `Number is not between ${min} and ${max}`
        )
    };
}
