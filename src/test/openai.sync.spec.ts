import { describe, test, expect, beforeEach } from '@jest/globals';
import { mockSyncOpenAIService } from './mocks/sync.setup';
import type { MockOpenAIService } from './setup';

describe('OpenAI Service (Sync)', () => {
    let openai: MockOpenAIService;

    beforeEach(() => {
        openai = mockSyncOpenAIService();
        jest.clearAllMocks();
    });

    test('embed returns vector embeddings synchronously', () => {
        const result = openai.embed('test text') as number[];
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1536);
        expect(typeof result[0]).toBe('number');
    });

    test('complete returns text completion synchronously', () => {
        const result = openai.complete('test prompt') as string;
        expect(typeof result).toBe('string');
        expect(result).toBe('Test completion');
    });

    test('extractMetadata returns metadata synchronously', () => {
        const result = openai.extractMetadata('test content') as {
            title: string;
            tags: string[];
            categories: string[];
        };
        expect(result).toEqual({
            title: 'Test',
            tags: ['test'],
            categories: ['test']
        });
    });

    test('mock functions are called with correct arguments', () => {
        const testText = 'test input';

        openai.embed(testText);
        expect(openai.embed).toHaveBeenCalledWith(testText);

        openai.complete(testText);
        expect(openai.complete).toHaveBeenCalledWith(testText);

        openai.extractMetadata(testText);
        expect(openai.extractMetadata).toHaveBeenCalledWith(testText);
    });

    test('mock functions maintain call count', () => {
        const testText = 'test input';

        openai.embed(testText);
        openai.embed(testText);
        expect(openai.embed).toHaveBeenCalledTimes(2);

        openai.complete(testText);
        expect(openai.complete).toHaveBeenCalledTimes(1);
    });
});
