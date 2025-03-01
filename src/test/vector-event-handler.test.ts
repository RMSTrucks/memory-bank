import { VectorEventHandler } from '../services/vector-event-handler.service';
import { MetricsCollectorService } from '../services/metrics-collector.service';
import { MonitoringServiceImpl } from '../services/monitoring.service';
import { VectorEvent } from '../types/events';
import { Logger } from '../utils/logger';

// Mock dependencies
jest.mock('../utils/logger');
jest.mock('../services/metrics-collector.service');
jest.mock('../services/monitoring.service');

describe('VectorEventHandler', () => {
    let handler: VectorEventHandler;
    let metricsCollector: jest.Mocked<MetricsCollectorService>;
    let monitoringService: jest.Mocked<MonitoringServiceImpl>;
    let mockLogger: jest.Mocked<Logger>;

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

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        } as any;

        // Create handler instance
        handler = new VectorEventHandler(metricsCollector, monitoringService);
        (handler as any).logger = mockLogger;
    });

    describe('filter', () => {
        it('should return true for vector events', () => {
            const event = { type: 'vector.upsert' } as VectorEvent;
            expect(handler.filter(event)).toBe(true);
        });

        it('should return false for non-vector events', () => {
            const event: VectorEvent = {
                id: 'test-id',
                type: 'system.test' as any,
                metadata: {
                    timestamp: new Date(),
                    priority: 'low',
                    category: 'system',
                    source: 'test',
                    context: {}
                },
                payload: {
                    operation: 'test'
                }
            };
            expect(handler.filter(event)).toBe(false);
        });
    });

    describe('handle', () => {
        const mockEvent: VectorEvent = {
            id: 'test-id',
            type: 'vector.upsert',
            metadata: {
                timestamp: new Date(),
                priority: 'low',
                category: 'system',
                source: 'test',
                context: {}
            },
            payload: {
                vectorIds: ['1', '2', '3'],
                namespace: 'test',
                operation: 'upsert',
                performance: {
                    duration: 100,
                    vectorCount: 3
                }
            }
        };

        it('should handle vector upsert events', async () => {
            await handler.handle(mockEvent);

            expect(metricsCollector.collect).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'performance',
                    name: 'vector_upsert',
                    operation: 'upsert'
                })
            );

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Vector upsert operation completed',
                expect.any(Object)
            );
        });

        it('should handle cache hit events', async () => {
            const cacheHitEvent: VectorEvent = {
                ...mockEvent,
                type: 'vector.cache_hit',
                payload: {
                    operation: 'cache_hit',
                    performance: {
                        duration: 50,
                        vectorCount: 0
                    }
                }
            };

            await handler.handle(cacheHitEvent);

            expect(metricsCollector.collect).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'event',
                    name: 'vector_cache_hits',
                    eventType: 'cache_hit'
                })
            );
        });

        it('should handle slow operations', async () => {
            const slowEvent: VectorEvent = {
                ...mockEvent,
                payload: {
                    ...mockEvent.payload,
                    performance: {
                        duration: 2000, // Over threshold
                        vectorCount: 3
                    }
                }
            };

            await handler.handle(slowEvent);

            expect(monitoringService.alerts.createAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'warning',
                    message: expect.stringContaining('exceeded threshold')
                })
            );
        });

        it('should handle low cache hit rates', async () => {
            const lowHitRateEvent: VectorEvent = {
                ...mockEvent,
                payload: {
                    ...mockEvent.payload,
                    performance: {
                        duration: 100,
                        vectorCount: 3,
                        cacheHits: 1,
                        cacheMisses: 9 // 10% hit rate
                    }
                }
            };

            await handler.handle(lowHitRateEvent);

            expect(monitoringService.alerts.createAlert).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'warning',
                    message: expect.stringContaining('Low cache hit rate')
                })
            );
        });

        it('should handle unknown event types', async () => {
            const unknownEvent: VectorEvent = {
                ...mockEvent,
                type: 'vector.unknown' as any
            };

            await handler.handle(unknownEvent);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Unknown vector event type')
            );
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Test error');
            metricsCollector.collect.mockRejectedValueOnce(error);

            await expect(handler.handle(mockEvent)).rejects.toThrow('Test error');
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error handling vector event'),
                error
            );
        });
    });
});
