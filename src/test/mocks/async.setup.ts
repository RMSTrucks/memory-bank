import { jest } from '@jest/globals';
import { MockOpenAIService } from '../setup';
import { createMockEmbedding } from '../setup';

export const mockAsyncOpenAIService = (): MockOpenAIService => {
    const service: MockOpenAIService = {
        embed: jest.fn(),
        complete: jest.fn(),
        extractMetadata: jest.fn()
    };

    // Async mock implementations
    service.embed.mockImplementation(() => Promise.resolve(createMockEmbedding()));
    service.complete.mockImplementation(() => Promise.resolve("Test completion"));
    service.extractMetadata.mockImplementation(() => Promise.resolve({
        title: "Test",
        tags: ["test"],
        categories: ["test"]
    }));

    return service;
};
