export interface Vector {
    dimensions: number;
    values: number[];
    metadata: VectorMetadata;
}

export interface VectorMetadata {
    source: string;
    timestamp: Date;
    confidence: number;
    context: {
        domain: string;
        type: string;
        version: number;
    };
    performance: {
        computeTime: number;
        quality: number;
    };
}

export interface VectorOperation<T = any> {
    type: VectorOperationType;
    input: Vector | Vector[];
    output: T;
    metadata: OperationMetadata;
}

export type VectorOperationType =
    | 'similarity'
    | 'clustering'
    | 'classification'
    | 'transformation'
    | 'reduction'
    | 'aggregation';

export interface OperationMetadata {
    timestamp: Date;
    duration: number;
    algorithm: string;
    parameters: Record<string, any>;
    performance: {
        accuracy: number;
        confidence: number;
        resourceUsage: {
            cpu: number;
            memory: number;
        };
    };
}

export interface VectorIndex {
    id: string;
    vectors: Vector[];
    metadata: IndexMetadata;
    operations: {
        search: SearchOptions;
        update: UpdateOptions;
        maintenance: MaintenanceOptions;
    };
}

export interface IndexMetadata {
    created: Date;
    updated: Date;
    size: number;
    dimensions: number;
    type: string;
    performance: {
        searchLatency: number;
        updateLatency: number;
        accuracy: number;
    };
}

export interface SearchOptions {
    algorithm: string;
    maxResults: number;
    minScore: number;
    timeout: number;
    filters?: Record<string, any>;
}

export interface UpdateOptions {
    batchSize: number;
    validateData: boolean;
    updateIndex: boolean;
    optimizeStorage: boolean;
}

export interface MaintenanceOptions {
    reindexInterval: number;
    cleanupThreshold: number;
    optimizationStrategy: string;
    backupFrequency: number;
}

export interface VectorSimilarity {
    vector1: Vector;
    vector2: Vector;
    score: number;
    metadata: SimilarityMetadata;
}

export interface SimilarityMetadata {
    algorithm: string;
    threshold: number;
    confidence: number;
    context: {
        domain: string;
        purpose: string;
    };
}

export interface VectorCluster {
    centroid: Vector;
    members: Vector[];
    metadata: ClusterMetadata;
}

export interface ClusterMetadata {
    algorithm: string;
    quality: number;
    stability: number;
    metrics: {
        cohesion: number;
        separation: number;
        silhouette: number;
    };
}

export interface FeatureVector extends Vector {
    features: Feature[];
    relationships: FeatureRelationship[];
    evolution: FeatureEvolution;
}

export interface Feature {
    name: string;
    value: number;
    importance: number;
    metadata: {
        source: string;
        confidence: number;
        timestamp: Date;
    };
}

export interface FeatureRelationship {
    source: string;
    target: string;
    type: string;
    strength: number;
    metadata: {
        discovered: Date;
        confidence: number;
        evidence: any;
    };
}

export interface FeatureEvolution {
    version: number;
    history: FeatureChange[];
    trends: {
        stability: number;
        importance: number;
        reliability: number;
    };
}

export interface FeatureChange {
    timestamp: Date;
    type: string;
    value: any;
    impact: {
        local: number;
        global: number;
    };
}
