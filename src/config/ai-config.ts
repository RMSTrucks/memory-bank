import { OpenAIConfig } from '../types/openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
}

export const aiConfig: OpenAIConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    organization: process.env.OPENAI_ORG_ID,
    maxTokens: 2000,
    temperature: 0.7,
    cache: {
        enabled: true,
        ttl: 3600000 // 1 hour
    },
    rateLimits: {
        tokensPerMinute: 90000,
        requestsPerMinute: 60,
        maxConcurrent: 5
    }
};
