export interface OpenAIConfig {
    apiKey: string;
    organization?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    rateLimits?: {
        tokensPerMinute: number;
        requestsPerMinute: number;
        maxConcurrent: number;
    };
    cache?: {
        enabled: boolean;
        ttl: number;
    };
}

export interface OpenAIResponse {
    data: {
        type: string;
        content: {
            summary: string;
            quality: number;
            suggestions: string[];
        };
    };
}

export interface OpenAIValidationResult {
    data: {
        isValid: boolean;
        score: number;
        errors: string[];
        warnings: string[];
        issues: string[];
        suggestions: string[];
    };
}

export interface OpenAIGenerationOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    format?: 'markdown' | 'text' | 'json';
    style?: 'concise' | 'detailed';
    maxLength?: number;
}

export interface OpenAIGenerationResult {
    data: {
        type: string;
        content: string;
        metadata: {
            tokens: number;
            model: string;
            type: string;
            format: string;
            quality: number;
            style: string;
        };
    };
}

export interface OpenAIEmbeddingOptions {
    model?: string;
    dimensions?: number;
}

export interface OpenAIGenerationRequest {
    type: string;
    context: { content: string };
    options?: OpenAIGenerationOptions;
}
