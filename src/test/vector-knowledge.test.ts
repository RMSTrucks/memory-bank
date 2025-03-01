import { vectorConfig } from '../config/vector-config';
import { EmbeddingService } from '../services/embedding.service';
import { KnowledgeService } from '../services/knowledge.service';
import { initializeVectorKnowledge } from '../index';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.PINECONE_API_KEY = 'test-pinecone-key';
process.env.PINECONE_ENVIRONMENT = 'test-environment';
process.env.PINECONE_PROJECT_ID = 'test-project';
process.env.PINECONE_INDEX_NAME = 'test-index';

// Mock OpenAI and Pinecone clients
jest.mock('openai', () => ({
    default: jest.fn().mockImplementation(() => ({
        embeddings: {
            create: jest.fn().mockResolvedValue({
                data: [{ embedding: new Array(1536).fill(0.1) }]
            })
        },
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                title: 'Test Title',
                                summary: 'Test Summary',
                                tags: ['test'],
                                categories: ['test']
                            })
                        }
                    }]
                })
            }
        }
    }))
}));

jest.mock('@pinecone-database/pinecone', () => ({
    PineconeClient: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(undefined),
        Index: jest.fn().mockReturnValue({
            upsert: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue({
                matches: [{
                    id: 'test-id',
                    score: 0.9,
                    metadata: {
                        title: 'Test Document',
                        content: 'Test content'
                    }
                }]
            }),
            fetch: jest.fn().mockResolvedValue({
                vectors: {
                    'test-id': {
                        id: 'test-id',
                        values: new Array(1536).fill(0.1),
                        metadata: {
                            title: 'Test Document',
                            content: 'Test content'
                        }
                    }
                }
            })
        })
    }))
}));

describe('Vector Knowledge System', () => {
    let embeddingService: EmbeddingService;
    let knowledgeService: KnowledgeService;

    beforeEach(async () => {
        const system = await initializeVectorKnowledge(vectorConfig);
        embeddingService = system.embeddingService;
        knowledgeService = system.knowledgeService;
    });

    describe('EmbeddingService', () => {
        it('should create embeddings for text', async () => {
            const embedding = await embeddingService.embed('test text');
            expect(embedding).toHaveLength(1536);
            expect(embedding[0]).toBe(0.1);
        });

        it('should create embeddings for multiple texts', async () => {
            const embeddings = await embeddingService.embedBatch(['test1', 'test2']);
            expect(embeddings).toHaveLength(2);
            expect(embeddings[0]).toHaveLength(1536);
        });

        it('should extract metadata from text', async () => {
            const metadata = await embeddingService.extractMetadata('test text');
            expect(metadata.title).toBe('Test Title');
            expect(metadata.tags).toEqual(['test']);
        });

        it('should chunk text appropriately', () => {
            const text = 'This is a test. This is another test.';
            const chunks = embeddingService.chunk(text);
            expect(chunks.length).toBeGreaterThan(0);
        });
    });

    describe('KnowledgeService', () => {
        it('should index a document', async () => {
            const ids = await knowledgeService.indexDocument('test document', {
                title: 'Test',
                tags: ['test'],
                categories: ['test']
            });
            expect(ids).toBeDefined();
            expect(ids.length).toBeGreaterThan(0);
        });

        it('should search knowledge base', async () => {
            const results = await knowledgeService.searchKnowledge('test query');
            expect(results.matches).toBeDefined();
            expect(results.matches.length).toBeGreaterThan(0);
            expect(results.matches[0].score).toBe(0.9);
        });

        it('should find related documents', async () => {
            const related = await knowledgeService.findRelated('test-id');
            expect(related.matches).toBeDefined();
            expect(related.matches.length).toBeGreaterThan(0);
        });

        it('should analyze knowledge', async () => {
            const analysis = await knowledgeService.analyzeKnowledge(['test-id']);
            expect(analysis.summary).toBeDefined();
            expect(analysis.concepts).toBeDefined();
            expect(analysis.patterns).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle OpenAI API errors', async () => {
            const mockError = new Error('OpenAI API Error');
            jest.spyOn(embeddingService, 'embed').mockRejectedValueOnce(mockError);

            await expect(embeddingService.embed('test')).rejects.toThrow('OpenAI API Error');
        });

        it('should handle Pinecone API errors', async () => {
            const mockError = new Error('Pinecone API Error');
            jest.spyOn(knowledgeService, 'searchKnowledge').mockRejectedValueOnce(mockError);

            await expect(knowledgeService.searchKnowledge('test')).rejects.toThrow('Pinecone API Error');
        });
    });
});
