import {
    DocumentValidation,
    DocumentValidationError,
    DocumentValidationWarning,
    DocumentValidationSuggestion,
    DocumentMetadata,
    DocumentContent,
    DocumentReference
} from '../types/documentation';
import { FileValidator } from '../utils/file-validator';
import { ContentValidator } from '../utils/content-validator';
import { MetadataValidator } from '../utils/metadata-validator';
import { FileMetadata, FileContent } from '../types/files';
import { ValidationError, ValidationResult, ContentFormat, ContentEncoding } from '../types/validation';

export class DocumentValidatorService {
    private static instance: DocumentValidatorService;
    private readonly fileValidator: FileValidator;
    private readonly contentValidator: ContentValidator;
    private readonly metadataValidator: MetadataValidator;

    private constructor() {
        this.fileValidator = new FileValidator();
        this.contentValidator = new ContentValidator();
        this.metadataValidator = new MetadataValidator();
    }

    public static getInstance(): DocumentValidatorService {
        if (!DocumentValidatorService.instance) {
            DocumentValidatorService.instance = new DocumentValidatorService();
        }
        return DocumentValidatorService.instance;
    }

    private toFileMetadata(docMetadata: DocumentMetadata, path: string): FileMetadata {
        return {
            path,
            lastModified: docMetadata.updatedAt,
            size: 0, // Will be updated by file system
            hash: '', // Will be updated by file system
            version: parseInt(docMetadata.version.split('.')[0]),
            custom: {
                documentType: docMetadata.type,
                documentStatus: docMetadata.status,
                documentAuthor: docMetadata.author,
                documentTags: docMetadata.tags,
                documentDependencies: docMetadata.dependencies
            }
        };
    }

    private toDocumentValidationError(error: ValidationError): DocumentValidationError {
        return {
            code: error.code,
            message: error.message,
            location: {
                line: 0,
                column: 0,
                path: error.path
            },
            severity: 'error',
            context: error.details || {}
        };
    }

    private toDocumentValidationWarning(warning: ValidationError): DocumentValidationWarning {
        return {
            code: warning.code,
            message: warning.message,
            location: {
                line: 0,
                column: 0,
                path: warning.path
            },
            severity: 'warning',
            context: warning.details || {}
        };
    }

    private convertValidationResult(result: ValidationResult): {
        errors: DocumentValidationError[];
        warnings: DocumentValidationWarning[];
    } {
        return {
            errors: result.errors.map(error => this.toDocumentValidationError(error)),
            warnings: result.warnings.map(warning => this.toDocumentValidationWarning(warning))
        };
    }

    public async validateDocument(
        path: string,
        content: DocumentContent,
        metadata: DocumentMetadata
    ): Promise<DocumentValidation> {
        const errors: DocumentValidationError[] = [];
        const warnings: DocumentValidationWarning[] = [];
        const suggestions: DocumentValidationSuggestion[] = [];

        // Convert metadata for file validation
        const fileMetadata = this.toFileMetadata(metadata, path);

        // Validate file
        const fileValidation = await this.fileValidator.validate(
            path,
            content.markdown,
            fileMetadata,
            {
                path: {
                    baseDir: process.cwd(),
                    allowedExtensions: ['.md']
                },
                permissions: {
                    requireRead: true,
                    requireWrite: true
                }
            }
        );

        if (!fileValidation.isValid) {
            const converted = this.convertValidationResult(fileValidation);
            errors.push(...converted.errors);
            warnings.push(...converted.warnings);
        }

        // Validate content
        const contentValidation = await this.validateContent(content);
        errors.push(...contentValidation.errors);
        warnings.push(...contentValidation.warnings);
        suggestions.push(...contentValidation.suggestions);

        // Validate metadata
        const metadataValidation = await this.validateMetadata(metadata);
        errors.push(...metadataValidation.errors);
        warnings.push(...metadataValidation.warnings);
        suggestions.push(...metadataValidation.suggestions);

        // Validate cross-references
        const referenceValidation = await this.validateCrossReferences(content.crossReferences);
        errors.push(...referenceValidation.errors);
        warnings.push(...referenceValidation.warnings);
        suggestions.push(...referenceValidation.suggestions);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    private async validateContent(content: DocumentContent): Promise<DocumentValidation> {
        const errors: DocumentValidationError[] = [];
        const warnings: DocumentValidationWarning[] = [];
        const suggestions: DocumentValidationSuggestion[] = [];

        // Check for empty content
        if (!content.markdown.trim()) {
            errors.push({
                code: 'EMPTY_CONTENT',
                message: 'Document content cannot be empty',
                location: { line: 1, column: 1, path: 'content' },
                severity: 'error',
                context: {}
            });
        }

        // Check section structure
        if (content.sections.length === 0) {
            warnings.push({
                code: 'NO_SECTIONS',
                message: 'Document has no sections',
                location: { line: 1, column: 1, path: 'content' },
                severity: 'warning',
                context: {}
            });
        } else {
            // Validate section hierarchy
            for (const section of content.sections) {
                this.validateSection(section, errors, warnings, suggestions);
            }
        }

        // Check for common markdown issues
        const markdownValidation = await this.contentValidator.validate(content.markdown, {
            format: ContentFormat.MARKDOWN,
            encoding: ContentEncoding.UTF8
        });
        const converted = this.convertValidationResult(markdownValidation);
        errors.push(...converted.errors);
        warnings.push(...converted.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    private validateSection(
        section: any,
        errors: DocumentValidationError[],
        warnings: DocumentValidationWarning[],
        suggestions: DocumentValidationSuggestion[],
        parentLevel: number = 0
    ): void {
        // Check section structure
        if (!section.title) {
            errors.push({
                code: 'INVALID_SECTION',
                message: 'Section must have a title',
                location: {
                    line: section.startLine,
                    column: 1,
                    path: `sections[${section.id}]`
                },
                severity: 'error',
                context: { section }
            });
        }

        // Check section level hierarchy
        if (section.level <= parentLevel) {
            warnings.push({
                code: 'INVALID_HIERARCHY',
                message: 'Section level should be greater than parent level',
                location: {
                    line: section.startLine,
                    column: 1,
                    path: `sections[${section.id}]`
                },
                severity: 'warning',
                context: { section, parentLevel }
            });
        }

        // Check section content
        if (!section.content.trim()) {
            warnings.push({
                code: 'EMPTY_SECTION',
                message: 'Section has no content',
                location: {
                    line: section.startLine,
                    column: 1,
                    path: `sections[${section.id}]`
                },
                severity: 'warning',
                context: { section }
            });
        }

        // Validate subsections
        if (section.subsections) {
            for (const subsection of section.subsections) {
                this.validateSection(
                    subsection,
                    errors,
                    warnings,
                    suggestions,
                    section.level
                );
            }
        }
    }

    private async validateMetadata(metadata: DocumentMetadata): Promise<DocumentValidation> {
        const errors: DocumentValidationError[] = [];
        const warnings: DocumentValidationWarning[] = [];
        const suggestions: DocumentValidationSuggestion[] = [];

        // Validate required fields
        const requiredFields = ['id', 'type', 'title', 'status', 'author', 'createdAt', 'updatedAt'];
        for (const field of requiredFields) {
            if (!metadata[field as keyof DocumentMetadata]) {
                errors.push({
                    code: 'MISSING_FIELD',
                    message: `Required field '${field}' is missing`,
                    location: { line: 0, column: 0, path: `metadata.${field}` },
                    severity: 'error',
                    context: { field }
                });
            }
        }

        // Validate dates
        if (metadata.createdAt > metadata.updatedAt) {
            errors.push({
                code: 'INVALID_DATES',
                message: 'Updated date cannot be before created date',
                location: { line: 0, column: 0, path: 'metadata.dates' },
                severity: 'error',
                context: {
                    createdAt: metadata.createdAt,
                    updatedAt: metadata.updatedAt
                }
            });
        }

        // Check version format
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(metadata.version)) {
            warnings.push({
                code: 'INVALID_VERSION',
                message: 'Version should follow semantic versioning (x.y.z)',
                location: { line: 0, column: 0, path: 'metadata.version' },
                severity: 'warning',
                context: { version: metadata.version }
            });
        }

        // Additional metadata validations
        const fileMetadata = this.toFileMetadata(metadata, 'metadata');
        const metadataValidation = await this.metadataValidator.validate(fileMetadata, {
            requiredFields,
            fieldTypes: {
                id: 'string',
                type: 'string',
                title: 'string',
                status: 'string',
                author: 'string',
                version: 'string',
                createdAt: 'date',
                updatedAt: 'date'
            }
        });
        const converted = this.convertValidationResult(metadataValidation);
        errors.push(...converted.errors);
        warnings.push(...converted.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    private async validateCrossReferences(references: DocumentReference[]): Promise<DocumentValidation> {
        const errors: DocumentValidationError[] = [];
        const warnings: DocumentValidationWarning[] = [];
        const suggestions: DocumentValidationSuggestion[] = [];

        for (const ref of references) {
            // Validate internal references
            if (ref.type === 'internal') {
                if (!ref.target.documentId) {
                    errors.push({
                        code: 'INVALID_REFERENCE',
                        message: 'Internal reference must have a target document ID',
                        location: {
                            line: ref.source.line,
                            column: 1,
                            path: `references[${ref.source.documentId}]`
                        },
                        severity: 'error',
                        context: { reference: ref }
                    });
                }
            }

            // Validate external references
            if (ref.type === 'external') {
                if (!ref.target.url) {
                    errors.push({
                        code: 'INVALID_REFERENCE',
                        message: 'External reference must have a URL',
                        location: {
                            line: ref.source.line,
                            column: 1,
                            path: `references[${ref.source.documentId}]`
                        },
                        severity: 'error',
                        context: { reference: ref }
                    });
                } else {
                    try {
                        new URL(ref.target.url);
                    } catch {
                        warnings.push({
                            code: 'INVALID_URL',
                            message: 'External reference URL is invalid',
                            location: {
                                line: ref.source.line,
                                column: 1,
                                path: `references[${ref.source.documentId}]`
                            },
                            severity: 'warning',
                            context: { reference: ref }
                        });
                    }
                }
            }

            // Check for context
            if (!ref.context) {
                warnings.push({
                    code: 'MISSING_CONTEXT',
                    message: 'Reference is missing context',
                    location: {
                        line: ref.source.line,
                        column: 1,
                        path: `references[${ref.source.documentId}]`
                    },
                    severity: 'warning',
                    context: { reference: ref }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }
}
