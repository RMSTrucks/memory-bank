/**
 * File validation types and interfaces
 */

/**
 * Content format options
 */
export enum ContentFormat {
    TEXT = 'text',
    MARKDOWN = 'markdown',
    JSON = 'json',
    YAML = 'yaml',
    XML = 'xml'
}

/**
 * Content encoding options
 */
export enum ContentEncoding {
    UTF8 = 'utf-8',
    ASCII = 'ascii',
    UTF16 = 'utf-16',
    BINARY = 'binary'
}

/**
 * File size limits
 */
export interface FileSizeLimits {
    /** Maximum file size in bytes */
    maxSize: number;
    /** Minimum file size in bytes */
    minSize?: number;
    /** Warning threshold in bytes */
    warnThreshold?: number;
}

/**
 * Content validation options
 */
export interface ContentValidationOptions {
    /** Expected content format */
    format?: ContentFormat;
    /** Expected content encoding */
    encoding?: ContentEncoding;
    /** Size limits */
    sizeLimits?: FileSizeLimits;
    /** Schema for validation (if applicable) */
    schema?: unknown;
    /** Custom validation rules */
    rules?: ValidationRule[];
}

/**
 * Permission validation options
 */
export interface PermissionValidationOptions {
    /** Required read access */
    requireRead?: boolean;
    /** Required write access */
    requireWrite?: boolean;
    /** Required execute access */
    requireExecute?: boolean;
    /** Required ownership */
    requireOwnership?: boolean;
}

/**
 * Path validation options
 */
export interface PathValidationOptions {
    /** Allowed file extensions */
    allowedExtensions?: string[];
    /** Allowed path patterns */
    allowedPatterns?: string[];
    /** Restricted path patterns */
    restrictedPatterns?: string[];
    /** Base directory for relative paths */
    baseDir?: string;
}

/**
 * Metadata validation options
 */
export interface MetadataValidationOptions {
    /** Required metadata fields */
    requiredFields?: string[];
    /** Field type validations */
    fieldTypes?: Record<string, string>;
    /** Custom field validations */
    fieldValidations?: Record<string, ValidationRule>;
}

/**
 * Combined validation options
 */
export interface ValidationOptions {
    /** Content validation options */
    content?: ContentValidationOptions;
    /** Permission validation options */
    permissions?: PermissionValidationOptions;
    /** Path validation options */
    path?: PathValidationOptions;
    /** Metadata validation options */
    metadata?: MetadataValidationOptions;
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
    /** Rule name */
    name: string;
    /** Rule description */
    description: string;
    /** Validation function */
    validate: (value: unknown) => Promise<boolean>;
    /** Error message */
    errorMessage: string;
    /** Severity level */
    severity: 'error' | 'warning' | 'info';
}

/**
 * Validation error details
 */
export interface ValidationError {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Error path */
    path: string;
    /** Error details */
    details?: Record<string, unknown>;
    /** Rule that triggered the error */
    rule?: ValidationRule;
}

/**
 * Validation result
 */
export interface ValidationResult {
    /** Whether validation passed */
    isValid: boolean;
    /** Validation errors */
    errors: ValidationError[];
    /** Validation warnings */
    warnings: ValidationError[];
    /** Validation info messages */
    info: ValidationError[];
    /** Validation metadata */
    metadata: {
        /** Time taken for validation */
        duration: number;
        /** Timestamp of validation */
        timestamp: Date;
        /** Number of rules checked */
        rulesChecked: number;
        /** Additional metadata */
        [key: string]: unknown;
    };
}
