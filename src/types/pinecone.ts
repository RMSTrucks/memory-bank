/**
 * Pinecone SDK Types
 */

export interface PineconeRecord {
    id: string;
    values: number[];
    metadata?: Record<string, any>;
}

export interface PineconeQuery {
    vector: number[];
    topK?: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
    includeValues?: boolean;
    namespace?: string;
}

export interface PineconeMatch {
    id: string;
    score: number;
    values?: number[];
    metadata?: Record<string, any>;
}

export interface PineconeQueryResponse {
    matches: PineconeMatch[];
    namespace: string;
}

export interface PineconeUpsertRequest {
    vectors: PineconeRecord[];
    namespace?: string;
}

export interface PineconeFetchResponse {
    vectors: {
        [key: string]: {
            id: string;
            values: number[];
            metadata?: Record<string, any>;
        };
    };
    namespace: string;
}

export interface PineconeIndexStats {
    dimension: number;
    indexFullness: number;
    totalVectorCount: number;
    namespaces: {
        [key: string]: {
            vectorCount: number;
        };
    };
}

export interface PineconeIndex {
    upsert(request: { upsertRequest: PineconeUpsertRequest }): Promise<void>;
    query(request: { queryRequest: PineconeQuery }): Promise<PineconeQueryResponse>;
    fetch(request: { ids: string[]; namespace?: string }): Promise<PineconeFetchResponse>;
    delete(request: { ids: string[]; namespace?: string }): Promise<void>;
    describeIndexStats(request: {}): Promise<PineconeIndexStats>;
}

export interface PineconeClient {
    init(config: { apiKey: string; environment: string }): Promise<void>;
    Index(indexName: string): PineconeIndex;
}
