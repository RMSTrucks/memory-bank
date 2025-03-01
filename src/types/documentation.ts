/**
 * Documentation System Types
 */

export type DocumentType =
    | 'core'          // Core documentation files (projectbrief.md, etc.)
    | 'pattern'       // Pattern documentation
    | 'component'     // Component documentation
    | 'api'          // API documentation
    | 'integration'   // Integration documentation
    | 'test'         // Test documentation
    | 'deployment'    // Deployment documentation
    | 'guide';        // User guides and tutorials

export type DocumentStatus =
    | 'draft'        // Document is in draft state
    | 'review'       // Document is under review
    | 'approved'     // Document has been approved
    | 'published'    // Document has been published
    | 'archived';    // Document has been archived

export type DocumentPriority =
    | 'low'
    | 'medium'
    | 'high'
    | 'critical';

export interface DocumentMetadata {
    id: string;
    type: DocumentType;
    title: string;
    status: DocumentStatus;
    priority: DocumentPriority;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    version: string;
    tags: string[];
    dependencies: string[]; // IDs of documents this one depends on
    dependents: string[];  // IDs of documents that depend on this one
}

export interface DocumentContent {
    markdown: string;
    sections: DocumentSection[];
    crossReferences: DocumentReference[];
    patterns: DocumentPattern[];
}

export interface DocumentSection {
    id: string;
    title: string;
    level: number;
    content: string;
    startLine: number;
    endLine: number;
    subsections: DocumentSection[];
}

export interface DocumentReference {
    type: 'internal' | 'external';
    source: {
        documentId: string;
        sectionId?: string;
        line: number;
    };
    target: {
        documentId: string;
        sectionId?: string;
        line?: number;
        url?: string;
    };
    context: string;
}

export interface DocumentPattern {
    id: string;
    type: string;
    name: string;
    description: string;
    context: string;
    implementation: string;
    examples: string[];
    relatedPatterns: string[];
}

export interface DocumentValidation {
    isValid: boolean;
    errors: DocumentValidationError[];
    warnings: DocumentValidationWarning[];
    suggestions: DocumentValidationSuggestion[];
}

export interface DocumentValidationError {
    code: string;
    message: string;
    location: {
        line: number;
        column: number;
        path: string;
    };
    severity: 'error';
    context: Record<string, unknown>;
}

export interface DocumentValidationWarning {
    code: string;
    message: string;
    location: {
        line: number;
        column: number;
        path: string;
    };
    severity: 'warning';
    context: Record<string, unknown>;
}

export interface DocumentValidationSuggestion {
    code: string;
    message: string;
    location: {
        line: number;
        column: number;
        path: string;
    };
    severity: 'suggestion';
    context: Record<string, unknown>;
    suggestedFix?: string;
}

export interface DocumentUpdate {
    id: string;
    type: 'content' | 'metadata' | 'validation' | 'pattern';
    timestamp: Date;
    changes: Record<string, unknown>;
    reason: string;
    impact: {
        dependencies: string[];
        patterns: string[];
        sections: string[];
    };
}

// Documentation Service Interfaces

export interface DocumentationService {
    // Core operations
    createDocument(type: DocumentType, content: string, metadata: Partial<DocumentMetadata>): Promise<DocumentMetadata>;
    getDocument(id: string): Promise<{ metadata: DocumentMetadata; content: DocumentContent }>;
    updateDocument(id: string, update: DocumentUpdate): Promise<DocumentMetadata>;
    deleteDocument(id: string): Promise<void>;

    // Validation
    validateDocument(id: string): Promise<DocumentValidation>;
    validateDocuments(ids: string[]): Promise<Record<string, DocumentValidation>>;

    // Pattern operations
    detectPatterns(id: string): Promise<DocumentPattern[]>;
    updatePatterns(id: string, patterns: DocumentPattern[]): Promise<void>;

    // Cross-reference operations
    updateCrossReferences(id: string): Promise<DocumentReference[]>;
    validateCrossReferences(id: string): Promise<DocumentValidation>;

    // Dependency operations
    updateDependencies(id: string): Promise<string[]>;
    validateDependencies(id: string): Promise<DocumentValidation>;

    // Search operations
    searchDocuments(query: string): Promise<DocumentMetadata[]>;
    findRelatedDocuments(id: string): Promise<DocumentMetadata[]>;

    // Automation operations
    generateTableOfContents(id: string): Promise<DocumentSection[]>;
    generateCrossReferences(id: string): Promise<DocumentReference[]>;
    generatePatternDocumentation(patternId: string): Promise<DocumentContent>;
    generateComponentDocumentation(componentId: string): Promise<DocumentContent>;
}

export interface DocumentationRepository {
    // Storage operations
    save(metadata: DocumentMetadata, content: DocumentContent): Promise<void>;
    load(id: string): Promise<{ metadata: DocumentMetadata; content: DocumentContent }>;
    delete(id: string): Promise<void>;
    list(): Promise<DocumentMetadata[]>;

    // Query operations
    findByType(type: DocumentType): Promise<DocumentMetadata[]>;
    findByStatus(status: DocumentStatus): Promise<DocumentMetadata[]>;
    findByTag(tag: string): Promise<DocumentMetadata[]>;
    search(query: string): Promise<DocumentMetadata[]>;

    // Version operations
    getVersions(id: string): Promise<DocumentMetadata[]>;
    getVersion(id: string, version: string): Promise<{ metadata: DocumentMetadata; content: DocumentContent }>;
    createVersion(id: string, version: string): Promise<void>;
}

export interface DocumentationEventEmitter {
    // Event emission
    emitCreated(metadata: DocumentMetadata): Promise<void>;
    emitUpdated(metadata: DocumentMetadata, update: DocumentUpdate): Promise<void>;
    emitDeleted(metadata: DocumentMetadata): Promise<void>;
    emitValidated(metadata: DocumentMetadata, validation: DocumentValidation): Promise<void>;
    emitPatternsDetected(metadata: DocumentMetadata, patterns: DocumentPattern[]): Promise<void>;

    // Event subscription
    onCreated(handler: (metadata: DocumentMetadata) => Promise<void>): void;
    onUpdated(handler: (metadata: DocumentMetadata, update: DocumentUpdate) => Promise<void>): void;
    onDeleted(handler: (metadata: DocumentMetadata) => Promise<void>): void;
    onValidated(handler: (metadata: DocumentMetadata, validation: DocumentValidation) => Promise<void>): void;
    onPatternsDetected(handler: (metadata: DocumentMetadata, patterns: DocumentPattern[]) => Promise<void>): void;
}
