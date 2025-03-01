import { describe, test, expect, beforeEach } from '@jest/globals';
import { mockAsyncOpenAIService } from './mocks/async.setup';
import type { MockOpenAIService } from './setup';

describe('OpenAI Service (Async)', () => {
    let openai: MockOpenAIService;

    beforeEach(() => {
        openai = mockAsyncOpenAIService();
        jest.clearAllMocks();
    });

    test('embed returns vector embeddings asynchronously', async () => {
        const result = await openai.embed('test text') as number[];
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1536);
        expect(typeof result[0]).toBe('number');
    });

    test('complete returns text completion asynchronously', async () => {
        const result = await openai.complete('test prompt') as string;
        expect(typeof result).toBe('string');
        expect(result).toBe('Test completion');
    });

    test('extractMetadata returns metadata asynchronously', async () => {
        const result = await openai.extractMetadata('test content') as {
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

    test('mock functions are called with correct arguments', async () => {
        const testText = 'test input';

        await openai.embed(testText);
        expect(openai.embed).toHaveBeenCalledWith(testText);

        await openai.complete(testText);
        expect(openai.complete).toHaveBeenCalledWith(testText);

        await openai.extractMetadata(testText);
        expect(openai.extractMetadata).toHaveBeenCalledWith(testText);
    });

    test('mock functions maintain call count', async () => {
        const testText = 'test input';

        await openai.embed(testText);
        await openai.embed(testText);
        expect(openai.embed).toHaveBeenCalledTimes(2);

        await openai.complete(testText);
        expect(openai.complete).toHaveBeenCalledTimes(1);
    });

    test('promises resolve in expected order', async () => {
        const results: string[] = [];

        const promise1 = (openai.embed('first') as Promise<number[]>).then(() => results.push('first'));
        const promise2 = (openai.embed('second') as Promise<number[]>).then(() => results.push('second'));
        const promise3 = (openai.embed('third') as Promise<number[]>).then(() => results.push('third'));

        await Promise.all([promise1, promise2, promise3]);

        expect(results).toEqual(['first', 'second', 'third']);
    });
});
