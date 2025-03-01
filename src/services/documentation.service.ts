import { v4 as uuidv4 } from 'uuid';
import {
    DocumentationService,
    DocumentType,
    DocumentMetadata,
    DocumentContent,
    DocumentSection,
    DocumentPattern,
    DocumentReference,
    DocumentValidation,
    DocumentUpdate
} from '../types/documentation';
import { EventBus } from './event-bus.service';
import { FileOperationsService } from './file-operations.service';
import { BaseError } from '../types/errors';
import { DocumentValidatorService } from './document-validator.service';

class DocumentationError extends BaseError {
    constructor(message: string, errorType: string, originalError?: unknown) {
        super(message, {
            severity: 'high',
            category: 'documentation',
            source: 'DocumentationService',
            context: {
                errorType,
                originalError,
                stack: originalError instanceof Error ? originalError.stack : undefined
            }
        });
    }
}

export class DocumentationServiceImpl implements DocumentationService {
    private static instance: DocumentationServiceImpl;
    private readonly eventBus: EventBus;
    private readonly fileOps: FileOperationsService;
    private readonly documentsPath: string;

    private constructor() {
        this.eventBus = EventBus.getInstance();
        this.fileOps = new FileOperationsService(process.cwd());
        this.documentsPath = 'docs';
    }

    public static getInstance(): DocumentationServiceImpl {
        if (!DocumentationServiceImpl.instance) {
            DocumentationServiceImpl.instance = new DocumentationServiceImpl();
        }
        return DocumentationServiceImpl.instance;
    }

    private getDocumentPath(id: string): string {
        return `${this.documentsPath}/${id}.md`;
    }

    private getMetadataPath(id: string): string {
        return `${this.documentsPath}/${id}.meta.json`;
    }

    private async parseMarkdown(content: string): Promise<DocumentSection[]> {
        const sections: DocumentSection[] = [];
        const lines = content.split('\n');
        let currentSection: DocumentSection | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

            if (headerMatch) {
                if (currentSection) {
                    currentSection.endLine = i - 1;
                    sections.push(currentSection);
                }

                currentSection = {
                    id: uuidv4(),
                    title: headerMatch[2],
                    level: headerMatch[1].length,
                    content: line,
                    startLine: i,
                    endLine: i,
                    subsections: []
                };
            } else if (currentSection) {
                currentSection.content += '\n' + line;
                currentSection.endLine = i;
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        // Build section hierarchy
        const organizedSections: DocumentSection[] = [];
        const sectionStack: DocumentSection[] = [];

        for (const section of sections) {
            while (sectionStack.length > 0 &&
                   sectionStack[sectionStack.length - 1].level >= section.level) {
                sectionStack.pop();
            }

            if (sectionStack.length > 0) {
                sectionStack[sectionStack.length - 1].subsections.push(section);
            } else {
                organizedSections.push(section);
            }

            sectionStack.push(section);
        }

        return organizedSections;
    }

    private async findCrossReferences(content: string, documentId: string): Promise<DocumentReference[]> {
        const references: DocumentReference[] = [];
        const lines = content.split('\n');

        // Match internal references like [[documentId#section]]
        const internalRefRegex = /\[\[([^#\]]+)(?:#([^\]]+))?\]\]/g;

        // Match external references like [text](url)
        const externalRefRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Find internal references
            let match;
            while ((match = internalRefRegex.exec(line)) !== null) {
                const [_, targetDocId, sectionId] = match;
                references.push({
                    type: 'internal',
                    source: {
                        documentId,
                        line: i + 1
                    },
                    target: {
                        documentId: targetDocId,
                        sectionId,
                    },
                    context: line
                });
            }

            // Find external references
            while ((match = externalRefRegex.exec(line)) !== null) {
                const [_, text, url] = match;
                if (!url.startsWith('#')) { // Ignore internal anchor links
                    references.push({
                        type: 'external',
                        source: {
                            documentId,
                            line: i + 1
                        },
                        target: {
                            documentId: '',
                            url
                        },
                        context: line
                    });
                }
            }
        }

        return references;
    }

    public async createDocument(
        type: DocumentType,
        content: string,
        metadata: Partial<DocumentMetadata>
    ): Promise<DocumentMetadata> {
        try {
            const id = uuidv4();
            const now = new Date();

            const fullMetadata: DocumentMetadata = {
                id,
                type,
                title: metadata.title || `New ${type} Document`,
                status: metadata.status || 'draft',
                priority: metadata.priority || 'medium',
                author: metadata.author || 'system',
                createdAt: now,
                updatedAt: now,
                version: '1.0.0',
                tags: metadata.tags || [],
                dependencies: metadata.dependencies || [],
                dependents: metadata.dependents || [],
                ...metadata
            };

            const sections = await this.parseMarkdown(content);
            const crossReferences = await this.findCrossReferences(content, id);

            const documentContent: DocumentContent = {
                markdown: content,
                sections,
                crossReferences,
                patterns: []
            };

            // Save document content and metadata
            const contentResult = await this.fileOps.writeFile(
                this.getDocumentPath(id),
                content
            );

            const metadataResult = await this.fileOps.writeFile(
                this.getMetadataPath(id),
                JSON.stringify(fullMetadata, null, 2)
            );

            if (!contentResult.success || !metadataResult.success) {
                throw new DocumentationError(
                    'Failed to write document files',
                    'WriteError',
                    contentResult.error || metadataResult.error
                );
            }

            // Emit creation event
            await this.eventBus.emit('documentation:created', {
                type: 'doc.created',
                metadata: {
                    timestamp: now,
                    priority: 'medium',
                    category: 'doc',
                    source: 'DocumentationService',
                    context: { documentId: id }
                },
                payload: {
                    metadata: fullMetadata,
                    sections: sections.length,
                    crossReferences: crossReferences.length
                }
            });

            return fullMetadata;
        } catch (error) {
            throw new DocumentationError(
                'Failed to create document',
                'CreateError',
                error
            );
        }
    }

    public async getDocument(id: string): Promise<{ metadata: DocumentMetadata; content: DocumentContent }> {
        try {
            const [contentResult, metadataResult] = await Promise.all([
                this.fileOps.readFile(this.getDocumentPath(id)),
                this.fileOps.readFile(this.getMetadataPath(id))
            ]);

            if (!contentResult.success || !metadataResult.success) {
                throw new DocumentationError(
                    'Failed to read document files',
                    'ReadError',
                    contentResult.error || metadataResult.error
                );
            }

            if (!contentResult.data || !metadataResult.data) {
                throw new DocumentationError(
                    'Invalid file operation result',
                    'ReadError',
                    new Error('Missing data in file operation result')
                );
            }

            const content = contentResult.data.raw;
            const metadata = JSON.parse(metadataResult.data.raw) as DocumentMetadata;
            const sections = await this.parseMarkdown(content);
            const crossReferences = await this.findCrossReferences(content, id);

            return {
                metadata,
                content: {
                    markdown: content,
                    sections,
                    crossReferences,
                    patterns: []
                }
            };
        } catch (error) {
            throw new DocumentationError(
                'Failed to get document',
                'GetError',
                error
            );
        }
    }

    public async updateDocument(id: string, update: DocumentUpdate): Promise<DocumentMetadata> {
        try {
            const { metadata, content } = await this.getDocument(id);

            // Update metadata
            const updatedMetadata: DocumentMetadata = {
                ...metadata,
                updatedAt: update.timestamp
            };

            if (update.type === 'metadata') {
                Object.assign(updatedMetadata, update.changes);
            }

            // Update content if needed
            if (update.type === 'content') {
                const newContent = update.changes.content as string;
                const contentResult = await this.fileOps.writeFile(
                    this.getDocumentPath(id),
                    newContent
                );

                if (!contentResult.success) {
                    throw new DocumentationError(
                        'Failed to write document content',
                        'WriteError',
                        contentResult.error
                    );
                }

                // Update sections and cross-references
                const sections = await this.parseMarkdown(newContent);
                const crossReferences = await this.findCrossReferences(newContent, id);

                // Emit content update event
                await this.eventBus.emit('documentation:updated', {
                    type: 'doc.updated',
                    metadata: {
                        timestamp: update.timestamp,
                        priority: 'medium',
                        category: 'doc',
                        source: 'DocumentationService',
                        context: { documentId: id }
                    },
                    payload: {
                        metadata: updatedMetadata,
                        sections: sections.length,
                        crossReferences: crossReferences.length,
                        changes: update.changes
                    }
                });
            }

            // Save updated metadata
            const metadataResult = await this.fileOps.writeFile(
                this.getMetadataPath(id),
                JSON.stringify(updatedMetadata, null, 2)
            );

            if (!metadataResult.success) {
                throw new DocumentationError(
                    'Failed to write document metadata',
                    'WriteError',
                    metadataResult.error
                );
            }

            return updatedMetadata;
        } catch (error) {
            throw new DocumentationError(
                'Failed to update document',
                'UpdateError',
                error
            );
        }
    }

    public async deleteDocument(id: string): Promise<void> {
        try {
            const { metadata } = await this.getDocument(id);

            const [contentResult, metadataResult] = await Promise.all([
                this.fileOps.deleteFile(this.getDocumentPath(id)),
                this.fileOps.deleteFile(this.getMetadataPath(id))
            ]);

            if (!contentResult.success || !metadataResult.success) {
                throw new DocumentationError(
                    'Failed to delete document files',
                    'DeleteError',
                    contentResult.error || metadataResult.error
                );
            }

            // Emit deletion event
            await this.eventBus.emit('documentation:deleted', {
                type: 'doc.deleted',
                metadata: {
                    timestamp: new Date(),
                    priority: 'high',
                    category: 'doc',
                    source: 'DocumentationService',
                    context: { documentId: id }
                },
                payload: { metadata }
            });
        } catch (error) {
            throw new DocumentationError(
                'Failed to delete document',
                'DeleteError',
                error
            );
        }
    }

    // Placeholder implementations for other interface methods
    // These will be implemented in subsequent steps

    public async validateDocument(id: string): Promise<DocumentValidation> {
        try {
            const { metadata, content } = await this.getDocument(id);
            const validator = DocumentValidatorService.getInstance();
            return await validator.validateDocument(
                this.getDocumentPath(id),
                content,
                metadata
            );
        } catch (error) {
            throw new DocumentationError(
                'Failed to validate document',
                'ValidationError',
                error
            );
        }
    }

    public async validateDocuments(ids: string[]): Promise<Record<string, DocumentValidation>> {
        const results: Record<string, DocumentValidation> = {};
        await Promise.all(
            ids.map(async (id) => {
                try {
                    results[id] = await this.validateDocument(id);
                } catch (error) {
                    results[id] = {
                        isValid: false,
                        errors: [{
                            code: 'VALIDATION_FAILED',
                            message: error instanceof Error ? error.message : 'Unknown error',
                            location: { line: 0, column: 0, path: id },
                            severity: 'error',
                            context: { error }
                        }],
                        warnings: [],
                        suggestions: []
                    };
                }
            })
        );
        return results;
    }

    public async detectPatterns(id: string): Promise<DocumentPattern[]> {
        throw new Error('Method not implemented.');
    }

    public async updatePatterns(id: string, patterns: DocumentPattern[]): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async updateCrossReferences(id: string): Promise<DocumentReference[]> {
        throw new Error('Method not implemented.');
    }

    public async validateCrossReferences(id: string): Promise<DocumentValidation> {
        throw new Error('Method not implemented.');
    }

    public async updateDependencies(id: string): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    public async validateDependencies(id: string): Promise<DocumentValidation> {
        throw new Error('Method not implemented.');
    }

    public async searchDocuments(query: string): Promise<DocumentMetadata[]> {
        throw new Error('Method not implemented.');
    }

    public async findRelatedDocuments(id: string): Promise<DocumentMetadata[]> {
        throw new Error('Method not implemented.');
    }

    public async generateTableOfContents(id: string): Promise<DocumentSection[]> {
        throw new Error('Method not implemented.');
    }

    public async generateCrossReferences(id: string): Promise<DocumentReference[]> {
        throw new Error('Method not implemented.');
    }

    public async generatePatternDocumentation(patternId: string): Promise<DocumentContent> {
        throw new Error('Method not implemented.');
    }

    public async generateComponentDocumentation(componentId: string): Promise<DocumentContent> {
        throw new Error('Method not implemented.');
    }
}
