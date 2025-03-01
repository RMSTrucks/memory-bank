import { VectorService } from '../services/vector.service';
import { MetricsCollectorService } from '../services/metrics-collector.service';
import { MonitoringServiceImpl } from '../services/monitoring.service';
import { VectorConfig, VectorRecord, VectorMetadata } from '../types/vector-knowledge';
import { EventBus } from '../services/event-bus.service';
import { Logger } from '../utils/logger';

// Mock dependencies
jest.mock('../utils/logger');
jest.mock('../services/metrics-collector.service');
jest.mock('../services/monitoring.service');
jest.mock('../services/event-bus.service');

describe('VectorService', () => {
    let service: VectorService;
    let metricsCollector: jest.Mocked<MetricsCollectorService>;
    let monitoringService: jest.Mocked<MonitoringServiceImpl>;
    let eventBus: jest.Mocked<EventBus>;
    let mockLogger: jest.Mocked<Logger>;

    const mockConfig: VectorConfig = {
        pinecone: {
            apiKey: 'test-api-key',
            environment: 'test-env',
            projectId: 'test-project',
            indexName: 'test-index',
            namespace: 'test-namespace'
        },
        openai: {
            apiKey: 'test-openai-key',
            model: 'test-model',
            dimensions: 1536
        },
        chunking: {
            maxTokens: 1000,
            overlap: 200,
            minLength: 100
        },
        indexing: {
            batchSize: 100,
            concurrency: 5,
            retryAttempts: 3,
            retryDelay: 1000
        }
    };

    const mockVectorRecord: VectorRecord = {
        id: 'test-id',
        vector: [0.1, 0.2, 0.3],
        metadata: {
            source: 'document',
            sourceId: 'test-source',
            title: 'Test Document',
            content: 'Test content',
            tags: ['test'],
            categories: ['test'],
            confidence: 0.9,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            version: 1,
            relationships: [],
            childIds: []
        }
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock instances
        metricsCollector = {
            collect: jest.fn(),
            getMetrics: jest.fn(),
            clearMetrics: jest.fn(),
            clear: jest.fn(),
            getStats: jest.fn()
        } as any;

        monitoringService = {
            alerts: {
                createAlert: jest.fn(),
                getAlerts: jest.fn(),
                clearAlerts: jest.fn()
            }
        } as any;

        eventBus = {
            getInstance: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            on: jest.fn()
        } as any;

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        } as any;

        // Create service instance
        service = new VectorService(mockConfig, metricsCollector, monitoringService);
        (service as any).logger = mockLogger;
        (service as any).eventBus = eventBus;
    });

    describe('initialize', () => {
        it('should initialize Pinecone client', async () => {
            await service.initialize();
            expect(mockLogger.info).toHaveBeenCalledWith('Initialized Pinecone client');
        });

        it('should handle initialization errors', async () => {
            const error = new Error('Init failed');
            (service as any).client.init = jest.fn().mockRejectedValue(error);

            await expect(service.initialize()).rejects.toThrow('Init failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize Pinecone client', error);
        });
    });

    describe('upsert', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should upsert vectors and emit event', async () => {
            const records = [mockVectorRecord];
            await service.upsert(records);

            expect(eventBus.emit).toHaveBeenCalledWith(
                'vector.upsert',
                expect.objectContaining({
                    type: 'vector.upsert',
                    payload: expect.objectContaining({
                        vectorIds: [mockVectorRecord.id],
                        namespace: mockConfig.pinecone.namespace
                    })
                })
            );

            expect(mockLogger.info).toHaveBeenCalledWith('Upserted 1 vectors');
        });

        it('should handle upsert errors', async () => {
            const error = new Error('Upsert failed');
            (service as any).index.upsert = jest.fn().mockRejectedValue(error);

            await expect(service.upsert([mockVectorRecord])).rejects.toThrow('Upsert failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to upsert vectors', error);
        });
    });

    describe('query', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should query vectors and emit event', async () => {
            const vector = [0.1, 0.2, 0.3];
            const mockResponse = {
                matches: [{
                    id: 'test-id',
                    score: 0.9,
                    values: vector,
                    metadata: mockVectorRecord.metadata
                }]
            };

            (service as any).index.query = jest.fn().mockResolvedValue(mockResponse);

            const result = await service.query(vector);

            expect(result.matches).toHaveLength(1);
            expect(result.matches[0].id).toBe('test-id');
            expect(eventBus.emit).toHaveBeenCalledWith(
                'vector.query',
                expect.objectContaining({
                    type: 'vector.query',
                    payload: expect.objectContaining({
                        namespace: mockConfig.pinecone.namespace
                    })
                })
            );
        });

        it('should handle query errors', async () => {
            const error = new Error('Query failed');
            (service as any).index.query = jest.fn().mockRejectedValue(error);

            await expect(service.query([0.1, 0.2, 0.3])).rejects.toThrow('Query failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to query vectors', error);
        });
    });

    describe('delete', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should delete vectors and emit event', async () => {
            const ids = ['test-id'];
            await service.delete(ids);

            expect(eventBus.emit).toHaveBeenCalledWith(
                'vector.delete',
                expect.objectContaining({
                    type: 'vector.delete',
                    payload: expect.objectContaining({
                        vectorIds: ids,
                        namespace: mockConfig.pinecone.namespace
                    })
                })
            );

            expect(mockLogger.info).toHaveBeenCalledWith('Deleted 1 vectors');
        });

        it('should handle delete errors', async () => {
            const error = new Error('Delete failed');
            (service as any).index.delete = jest.fn().mockRejectedValue(error);

            await expect(service.delete(['test-id'])).rejects.toThrow('Delete failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete vectors', error);
        });
    });

    describe('fetch', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should fetch vectors from cache and emit event', async () => {
            const ids = ['test-id'];
            (service as any).cache.get = jest.fn().mockReturnValue(mockVectorRecord);

            const result = await service.fetch(ids);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockVectorRecord);
            expect(eventBus.emit).toHaveBeenCalledWith(
                'vector.cache_hit',
                expect.objectContaining({
                    type: 'vector.cache_hit',
                    payload: expect.objectContaining({
                        operation: 'fetch'
                    })
                })
            );
        });

        it('should fetch vectors from Pinecone when not in cache', async () => {
            const ids = ['test-id'];
            const mockResponse = {
                vectors: {
                    'test-id': {
                        id: 'test-id',
                        values: mockVectorRecord.vector,
                        metadata: mockVectorRecord.metadata
                    }
                }
            };

            (service as any).cache.get = jest.fn().mockReturnValue(undefined);
            (service as any).index.fetch = jest.fn().mockResolvedValue(mockResponse);

            const result = await service.fetch(ids);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockVectorRecord);
        });

        it('should handle fetch errors', async () => {
            const error = new Error('Fetch failed');
            (service as any).index.fetch = jest.fn().mockRejectedValue(error);

            await expect(service.fetch(['test-id'])).rejects.toThrow('Fetch failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch vectors', error);
        });
    });
});
