import { EventHandler, VectorEvent, EventPriority } from '../types/events';
import { Logger } from '../utils/logger';
import { MetricsCollectorService } from './metrics-collector.service';
import { MonitoringServiceImpl } from './monitoring.service';

/**
 * Handles vector-related events and provides monitoring and metrics collection
 */
export class VectorEventHandler implements EventHandler<VectorEvent> {
    private logger: Logger;
    private metricsCollector: MetricsCollectorService;
    private monitoringService: MonitoringServiceImpl;

    constructor(
        metricsCollector: MetricsCollectorService,
        monitoringService: MonitoringServiceImpl
    ) {
        this.logger = new Logger('VectorEventHandler');
        this.metricsCollector = metricsCollector;
        this.monitoringService = monitoringService;
    }

    /**
     * Event handler priority
     */
    public priority = 1;

    /**
     * Filter events based on type
     */
    public filter(event: VectorEvent): boolean {
        return event.type.startsWith('vector.');
    }

    /**
     * Handle vector events
     */
    public async handle(event: VectorEvent): Promise<void> {
        const startTime = Date.now();

        try {
            switch (event.type) {
                case 'vector.upsert':
                    await this.handleUpsert(event);
                    break;
                case 'vector.query':
                    await this.handleQuery(event);
                    break;
                case 'vector.delete':
                    await this.handleDelete(event);
                    break;
                case 'vector.batch':
                    await this.handleBatch(event);
                    break;
                case 'vector.cache_hit':
                    await this.handleCacheHit(event);
                    break;
                case 'vector.cache_miss':
                    await this.handleCacheMiss(event);
                    break;
                default:
                    this.logger.warn(`Unknown vector event type: ${event.type}`);
            }

            // Record event processing time
            const duration = Date.now() - startTime;
            await this.recordMetrics(event, duration);

            // Monitor performance thresholds
            await this.checkPerformance(event, duration);

        } catch (error) {
            this.logger.error(`Error handling vector event: ${error}`);
            throw error;
        }
    }

    /**
     * Handle vector upsert events
     */
    private async handleUpsert(event: VectorEvent): Promise<void> {
        const { vectorIds, namespace, performance } = event.payload;

        this.logger.info(`Vector upsert operation completed`, {
            vectorCount: vectorIds?.length,
            namespace,
            duration: performance?.duration
        });

        await this.metricsCollector.collect({
            type: 'performance',
            name: 'vector_upsert',
            value: performance?.duration || 0,
            timestamp: Date.now(),
            operation: 'upsert',
            duration: performance?.duration || 0,
            success: true,
            labels: {
                namespace: namespace || 'default',
                vectorCount: String(vectorIds?.length || 0)
            }
        });
    }

    /**
     * Handle vector query events
     */
    private async handleQuery(event: VectorEvent): Promise<void> {
        const { namespace, performance } = event.payload;

        this.logger.info(`Vector query operation completed`, {
            namespace,
            duration: performance?.duration,
            vectorCount: performance?.vectorCount
        });

        await this.metricsCollector.collect({
            type: 'performance',
            name: 'vector_query',
            value: performance?.duration || 0,
            timestamp: Date.now(),
            operation: 'query',
            duration: performance?.duration || 0,
            success: true,
            labels: {
                namespace: namespace || 'default',
                vectorCount: String(performance?.vectorCount || 0)
            }
        });
    }

    /**
     * Handle vector delete events
     */
    private async handleDelete(event: VectorEvent): Promise<void> {
        const { vectorIds, namespace, performance } = event.payload;

        this.logger.info(`Vector delete operation completed`, {
            vectorCount: vectorIds?.length,
            namespace,
            duration: performance?.duration
        });

        await this.metricsCollector.collect({
            type: 'performance',
            name: 'vector_delete',
            value: performance?.duration || 0,
            timestamp: Date.now(),
            operation: 'delete',
            duration: performance?.duration || 0,
            success: true,
            labels: {
                namespace: namespace || 'default',
                vectorCount: String(vectorIds?.length || 0)
            }
        });
    }

    /**
     * Handle vector batch operation events
     */
    private async handleBatch(event: VectorEvent): Promise<void> {
        const { operation, namespace, performance } = event.payload;

        this.logger.info(`Vector batch operation completed`, {
            operation,
            namespace,
            duration: performance?.duration,
            vectorCount: performance?.vectorCount
        });

        await this.metricsCollector.collect({
            type: 'performance',
            name: 'vector_batch',
            value: performance?.duration || 0,
            timestamp: Date.now(),
            operation: operation || 'batch',
            duration: performance?.duration || 0,
            success: true,
            labels: {
                namespace: namespace || 'default',
                vectorCount: String(performance?.vectorCount || 0)
            }
        });
    }

    /**
     * Handle cache hit events
     */
    private async handleCacheHit(event: VectorEvent): Promise<void> {
        const { performance } = event.payload;

        await this.metricsCollector.collect({
            type: 'event',
            name: 'vector_cache_hits',
            value: 1,
            timestamp: Date.now(),
            eventType: 'cache_hit',
            count: 1,
            errorRate: 0,
            labels: {
                duration: String(performance?.duration || 0)
            }
        });
    }

    /**
     * Handle cache miss events
     */
    private async handleCacheMiss(event: VectorEvent): Promise<void> {
        const { performance } = event.payload;

        await this.metricsCollector.collect({
            type: 'event',
            name: 'vector_cache_misses',
            value: 1,
            timestamp: Date.now(),
            eventType: 'cache_miss',
            count: 1,
            errorRate: 0,
            labels: {
                duration: String(performance?.duration || 0)
            }
        });
    }

    /**
     * Record event metrics
     */
    private async recordMetrics(event: VectorEvent, duration: number): Promise<void> {
        await this.metricsCollector.collect({
            type: 'performance',
            name: `vector_${event.type}_duration`,
            value: duration,
            timestamp: Date.now(),
            operation: event.type,
            duration: duration,
            success: true,
            labels: {
                ...event.payload.performance && {
                    vectorCount: String(event.payload.performance.vectorCount || 0),
                    cacheHits: String(event.payload.performance.cacheHits || 0),
                    cacheMisses: String(event.payload.performance.cacheMisses || 0)
                }
            }
        });
    }

    /**
     * Check performance thresholds
     */
    private async checkPerformance(event: VectorEvent, duration: number): Promise<void> {
        const thresholds = {
            upsert: 1000,    // 1 second
            query: 500,      // 500ms
            delete: 1000,    // 1 second
            batch: 5000      // 5 seconds
        };

        const threshold = thresholds[event.type.split('.')[1] as keyof typeof thresholds];
        if (threshold && duration > threshold) {
            await this.monitoringService.alerts.createAlert({
                severity: 'warning',
                message: `Vector operation exceeded threshold: ${event.type}`,
                source: 'vector-service',
                context: {
                    type: event.type,
                    duration,
                    threshold,
                    metadata: event.metadata
                }
            });
        }

        if (event.payload.performance) {
            const { cacheHits, cacheMisses } = event.payload.performance;
            if (cacheHits !== undefined && cacheMisses !== undefined) {
                const hitRate = cacheHits / (cacheHits + cacheMisses);
                if (hitRate < 0.8) { // Alert if cache hit rate falls below 80%
                    await this.monitoringService.alerts.createAlert({
                        severity: 'warning',
                        message: `Low cache hit rate detected: ${(hitRate * 100).toFixed(1)}%`,
                        source: 'vector-service',
                        context: {
                            hitRate,
                            cacheHits,
                            cacheMisses,
                            metadata: event.metadata
                        }
                    });
                }
            }
        }
    }
}
