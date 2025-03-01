import { jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Types
export type MockResponse = {
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
    [key: string]: any;
};

export type MockRequest = {
    body: any;
    params: any;
    query: any;
};

export type MockDocument = {
    id: string;
    title: string;
    content: string;
    metadata: {
        created: string;
        tags: string[];
        version: string;
    };
};

// Service response types
type OpenAIServiceTypes = {
    embed: number[];
    complete: string;
    extractMetadata: {
        title: string;
        tags: string[];
        categories: string[];
    };
};

type PineconeServiceTypes = {
    upsert: { status: string };
    query: { matches: MockDocument[] };
    fetch: { vectors: { [key: string]: MockDocument } };
};

// Mock service interfaces
export interface MockOpenAIService {
    embed: jest.Mock;
    complete: jest.Mock;
    extractMetadata: jest.Mock;
}

export interface MockPineconeService {
    upsert: jest.Mock;
    query: jest.Mock;
    fetch: jest.Mock;
}

// Test utilities
export const createMockResponse = (): MockResponse => {
    const res: MockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
    };
    return res;
};

export const createMockRequest = (body = {}, params = {}, query = {}): MockRequest => ({
    body,
    params,
    query
});

// Mock data generators
export const createMockEmbedding = (dimensions = 1536): number[] =>
    Array.from({ length: dimensions }, () => Math.random());

export const createMockDocument = (id: string): MockDocument => ({
    id,
    title: `Test Document ${id}`,
    content: `Test content for document ${id}`,
    metadata: {
        created: new Date().toISOString(),
        tags: ['test'],
        version: '1.0'
    }
});

// Test environment setup
const setupTestEnv = (): void => {
    // Load test environment variables
    dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

    // Configure test environment
    process.env.NODE_ENV = 'test';
    process.env.DEBUG = process.env.DEBUG || 'false';

    // Setup global utilities
    if (typeof global.TextEncoder === 'undefined') {
        const { TextEncoder, TextDecoder } = require('util');
        global.TextEncoder = TextEncoder;
        global.TextDecoder = TextDecoder;
    }
};

// Console mock configuration
const setupConsoleMocks = (): void => {
    const originalConsole = { ...console };
    const isDebug = process.env.DEBUG === 'true';

    type ConsoleMethods = 'log' | 'info' | 'warn' | 'error' | 'debug';
    const methods: ConsoleMethods[] = ['log', 'info', 'warn', 'error', 'debug'];

    methods.forEach(method => {
        const original = originalConsole[method];
        if (original && typeof original === 'function') {
            jest.spyOn(console, method).mockImplementation((...args: any[]) => {
                if (isDebug) {
                    original.apply(console, args);
                }
            });
        }
    });
};

// Test lifecycle hooks
beforeAll(async () => {
    setupTestEnv();
    setupConsoleMocks();
});

beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.clearAllTimers();
});

afterEach(async () => {
    // Clean up any test-specific resources
});

afterAll(async () => {
    jest.restoreAllMocks();

    // Ensure all pending operations complete
    await new Promise(resolve => setTimeout(resolve, 1000));
});

// Error handling utilities
export const expectError = async (promise: Promise<any>, errorType: any): Promise<void> => {
    try {
        await promise;
        fail('Expected error was not thrown');
    } catch (error) {
        expect(error).toBeInstanceOf(errorType);
    }
};

// Mock service utilities
export const mockOpenAIService = (): MockOpenAIService => {
    const service: MockOpenAIService = {
        embed: jest.fn(),
        complete: jest.fn(),
        extractMetadata: jest.fn()
    };

    (service.embed as jest.Mock).mockImplementation(() => Promise.resolve(createMockEmbedding()));
    (service.complete as jest.Mock).mockImplementation(() => Promise.resolve('Test completion'));
    (service.extractMetadata as jest.Mock).mockImplementation(() => Promise.resolve({
        title: 'Test',
        tags: ['test'],
        categories: ['test']
    }));

    return service;
};

export const mockPineconeService = (): MockPineconeService => {
    const service: MockPineconeService = {
        upsert: jest.fn(),
        query: jest.fn(),
        fetch: jest.fn()
    };

    (service.upsert as jest.Mock).mockImplementation(() => Promise.resolve({ status: 'success' }));
    (service.query as jest.Mock).mockImplementation(() => Promise.resolve({
        matches: [createMockDocument('test-1')]
    }));
    (service.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
        vectors: { 'test-1': createMockDocument('test-1') }
    }));

    return service;
};
