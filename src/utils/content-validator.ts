import {
    ContentFormat,
    ContentEncoding,
    ContentValidationOptions,
    ValidationRule,
    ValidationError,
    ValidationResult
} from '../types/validation';

/**
 * Validates file content based on format, encoding, and size
 */
export class ContentValidator {
    /**
     * Validate file content
     */
    async validate(
        content: string | Buffer,
        options: ContentValidationOptions
    ): Promise<ValidationResult> {
        const startTime = Date.now();
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const info: ValidationError[] = [];
        let rulesChecked = 0;

        // Validate size if limits are specified
        if (options.sizeLimits) {
            rulesChecked++;
            const size = Buffer.byteLength(content);

            if (size > options.sizeLimits.maxSize) {
                errors.push({
                    code: 'SIZE_EXCEEDED',
                    message: `File size ${size} bytes exceeds maximum ${options.sizeLimits.maxSize} bytes`,
                    path: 'content.size'
                });
            }

            if (options.sizeLimits.minSize && size < options.sizeLimits.minSize) {
                errors.push({
                    code: 'SIZE_TOO_SMALL',
                    message: `File size ${size} bytes is below minimum ${options.sizeLimits.minSize} bytes`,
                    path: 'content.size'
                });
            }

            if (options.sizeLimits.warnThreshold && size > options.sizeLimits.warnThreshold) {
                warnings.push({
                    code: 'SIZE_WARNING',
                    message: `File size ${size} bytes exceeds warning threshold ${options.sizeLimits.warnThreshold} bytes`,
                    path: 'content.size'
                });
            }
        }

        // Validate format if specified
        if (options.format) {
            rulesChecked++;
            const formatValid = await this.validateFormat(content.toString(), options.format);
            if (!formatValid) {
                errors.push({
                    code: 'INVALID_FORMAT',
                    message: `Content does not match expected format ${options.format}`,
                    path: 'content.format'
                });
            }
        }

        // Validate encoding if specified
        if (options.encoding) {
            rulesChecked++;
            const encodingValid = await this.validateEncoding(content, options.encoding);
            if (!encodingValid) {
                errors.push({
                    code: 'INVALID_ENCODING',
                    message: `Content does not match expected encoding ${options.encoding}`,
                    path: 'content.encoding'
                });
            }
        }

        // Run custom validation rules
        if (options.rules) {
            for (const rule of options.rules) {
                rulesChecked++;
                try {
                    const valid = await rule.validate(content);
                    if (!valid) {
                        const error: ValidationError = {
                            code: rule.name.toUpperCase(),
                            message: rule.errorMessage,
                            path: 'content',
                            rule
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
                    }
                } catch (err) {
                    errors.push({
                        code: 'RULE_ERROR',
                        message: `Rule ${rule.name} failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                        path: 'content',
                        rule
                    });
                }
            }
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
     * Validate content format
     */
    private async validateFormat(content: string, format: ContentFormat): Promise<boolean> {
        try {
            switch (format) {
                case ContentFormat.JSON:
                    JSON.parse(content);
                    return true;

                case ContentFormat.YAML:
                    // Basic YAML validation (could use js-yaml package for better validation)
                    return content.includes(':') && !content.includes('{') && !content.includes('}');

                case ContentFormat.XML:
                    // Basic XML validation
                    return content.startsWith('<?xml') ||
                           (content.startsWith('<') && content.endsWith('>'));

                case ContentFormat.MARKDOWN:
                    // Basic Markdown validation (headers, lists, or links)
                    return content.includes('#') ||
                           content.includes('-') ||
                           content.includes('[') && content.includes('](');

                case ContentFormat.TEXT:
                    // Text is always valid
                    return true;

                default:
                    return false;
            }
        } catch {
            return false;
        }
    }

    /**
     * Validate content encoding
     */
    private async validateEncoding(content: string | Buffer, encoding: ContentEncoding): Promise<boolean> {
        try {
            const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

            switch (encoding) {
                case ContentEncoding.UTF8:
                    return buffer.toString('utf8').length === buffer.length;

                case ContentEncoding.ASCII:
                    return buffer.toString('ascii').length === buffer.length;

                case ContentEncoding.UTF16:
                    return buffer.toString('utf16le').length * 2 === buffer.length;

                case ContentEncoding.BINARY:
                    // Binary is always valid
                    return true;

                default:
                    return false;
            }
        } catch {
            return false;
        }
    }

    /**
     * Create a validation rule
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
}
