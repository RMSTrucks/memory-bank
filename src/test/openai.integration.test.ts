import { describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { OpenAIService } from '../services/openai.service';
import { OpenAIConfig } from '../types/openai';

describe('OpenAI Service (Integration)', () => {
    let openai: OpenAIService;

    beforeEach(() => {
        const config: OpenAIConfig = {
            apiKey: process.env.OPENAI_API_KEY || '',
            organization: process.env.OPENAI_ORG_ID,
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 150,
            rateLimits: {
                tokensPerMinute: 90000,
                requestsPerMinute: 3500,
                maxConcurrent: 5
            },
            cache: {
                enabled: true,
                ttl: 3600
            }
        };
        openai = new OpenAIService(config);
    });

    test('analyze returns valid analysis', async () => {
        const content = 'This is a test document for analysis.';
        const result = await openai.analyze(content);

        expect(result.data).toBeDefined();
        expect(result.data.type).toBe('documentation');
        expect(result.data.content.summary).toBeDefined();
        expect(result.data.content.quality).toBeGreaterThan(0);
        expect(result.data.content.suggestions).toBeInstanceOf(Array);
    });

    test('validate returns validation result', async () => {
        const content = 'This is a test document for validation.';
        const result = await openai.validate(content);

        expect(result.data).toBeDefined();
        expect(typeof result.data.isValid).toBe('boolean');
        expect(typeof result.data.score).toBe('number');
        expect(result.data.issues).toBeInstanceOf(Array);
        expect(result.data.suggestions).toBeInstanceOf(Array);
    });

    test('generate returns generated content', async () => {
        const request = {
            type: 'documentation' as const,
            context: {
                content: 'Create documentation for a login function.'
            },
            options: {
                format: 'markdown' as const,
                style: 'detailed' as const,
                maxLength: 200
            }
        };

        const result = await openai.generate(request);

        expect(result.data).toBeDefined();
        expect(result.data.content).toBeDefined();
        expect(result.data.metadata.type).toBe('documentation');
        expect(result.data.metadata.format).toBe('markdown');
        expect(result.data.metadata.quality).toBeGreaterThan(0);
    });

    test('rate limiter prevents excessive requests', async () => {
        const promises = Array(10).fill(null).map(() =>
            openai.analyze('Test content')
        );

        const results = await Promise.allSettled(promises);
        const rejected = results.filter(r => r.status === 'rejected');

        expect(rejected.length).toBeGreaterThan(0);
    });

    test('cache returns cached responses', async () => {
        const content = 'Cache test content';

        // First request
        const result1 = await openai.analyze(content);

        // Second request should be cached
        const result2 = await openai.analyze(content);

        expect(result2).toEqual(result1);
    });

    afterEach(async () => {
        // Clean up after each test
        openai.clearCache();
    });

    afterAll(async () => {
        // Ensure all resources are properly disposed
        if (openai) {
            openai.dispose();
        }
    });
});
