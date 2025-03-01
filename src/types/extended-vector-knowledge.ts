import { VectorMetadata } from './vector-knowledge';

/**
 * Extended VectorMetadata interface that includes additional properties
 * used by the KnowledgeService
 */
export interface ExtendedVectorMetadata extends VectorMetadata {
    title?: string;
    content?: string;
    summary?: string;
    created?: string;
    updated?: string;
    version?: number;
    sourceId?: string;
    sourcePath?: string;
    relationships?: any[];
    childIds?: string[];
    tags?: string[];
    categories?: string[];
    domain?: string;
    project?: string;
}
