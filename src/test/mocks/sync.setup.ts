import { jest } from '@jest/globals';
import { MockOpenAIService } from '../setup';

export const mockSyncOpenAIService = (): MockOpenAIService => {
    const service: MockOpenAIService = {
        embed: jest.fn(),
        complete: jest.fn(),
        extractMetadata: jest.fn()
    };

    // Synchronous mock implementations
    service.embed.mockReturnValue([...Array(1536)].map(() => Math.random()));
    service.complete.mockReturnValue("Test completion");
    service.extractMetadata.mockReturnValue({
        title: "Test",
        tags: ["test"],
        categories: ["test"]
    });

    return service;
};
