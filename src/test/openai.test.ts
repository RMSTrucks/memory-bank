import { mockOpenAIService } from './setup';
import { describe, test, expect } from '@jest/globals';

interface OpenAIMetadata {
    title: string;
    tags: string[];
    categories: string[];
}

describe('OpenAI Service', () => {
    const openai = mockOpenAIService();

    test('embed should return vector embeddings', async () => {
        const embedding = await openai.embed('test text');
        const result = embedding as number[];
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1536);
        expect(typeof result[0]).toBe('number');
    });

    test('complete should return text completion', async () => {
        const completion = await openai.complete('test prompt');
        const result = completion as string;
        expect(typeof result).toBe('string');
        expect(result).toBe('Test completion');
    });

    test('extractMetadata should return structured metadata', async () => {
        const metadata = await openai.extractMetadata('test content');
        const result = metadata as OpenAIMetadata;
        expect(result).toEqual({
            title: 'Test',
            tags: ['test'],
            categories: ['test']
        });
    });

    test('mock functions should be called with correct arguments', async () => {
        const testText = 'test input';

        await openai.embed(testText);
        expect(openai.embed).toHaveBeenCalledWith(testText);

        await openai.complete(testText);
        expect(openai.complete).toHaveBeenCalledWith(testText);

        await openai.extractMetadata(testText);
        expect(openai.extractMetadata).toHaveBeenCalledWith(testText);
    });

    test('mock functions should maintain call count', async () => {
        const testText = 'test input';

        await openai.embed(testText);
        await openai.embed(testText);
        expect(openai.embed).toHaveBeenCalledTimes(2);

        await openai.complete(testText);
        expect(openai.complete).toHaveBeenCalledTimes(1);
    });
});
