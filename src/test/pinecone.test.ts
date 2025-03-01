import { mockPineconeService, createMockDocument, type MockDocument } from './setup';
import { describe, test, expect } from '@jest/globals';

interface PineconeUpsertResult {
    status: string;
}

interface PineconeQueryResult {
    matches: MockDocument[];
}

interface PineconeFetchResult {
    vectors: { [key: string]: MockDocument };
}

describe('Pinecone Service', () => {
    const pinecone = mockPineconeService();
    const testDoc = createMockDocument('test-1');

    test('upsert should return success status', async () => {
        const response = await pinecone.upsert(testDoc);
        const result = response as PineconeUpsertResult;
        expect(result.status).toBe('success');
    });

    test('query should return matching documents', async () => {
        const response = await pinecone.query({ vector: [0.1] });
        const result = response as PineconeQueryResult;
        expect(Array.isArray(result.matches)).toBe(true);
        expect(result.matches[0]).toEqual(testDoc);
    });

    test('fetch should return document vectors', async () => {
        const response = await pinecone.fetch(['test-1']);
        const result = response as PineconeFetchResult;
        expect(result.vectors['test-1']).toEqual(testDoc);
    });

    test('mock functions should be called with correct arguments', async () => {
        await pinecone.upsert(testDoc);
        expect(pinecone.upsert).toHaveBeenCalledWith(testDoc);

        const queryParams = { vector: [0.1] };
        await pinecone.query(queryParams);
        expect(pinecone.query).toHaveBeenCalledWith(queryParams);

        const ids = ['test-1'];
        await pinecone.fetch(ids);
        expect(pinecone.fetch).toHaveBeenCalledWith(ids);
    });

    test('mock functions should maintain call count', async () => {
        await pinecone.upsert(testDoc);
        await pinecone.upsert(testDoc);
        expect(pinecone.upsert).toHaveBeenCalledTimes(2);

        await pinecone.query({ vector: [0.1] });
        expect(pinecone.query).toHaveBeenCalledTimes(1);
    });
});
