import { v4 as uuidv4 } from 'uuid';
import {
    Metric,
    MetricTimestamp,
    MetricsCollector,
    BaseMetric
} from '../types/monitoring';
import { BaseError } from '../types/errors';
import { EventBusService } from './event-bus.service';

class MetricsError extends BaseError {
    constructor(
        message: string,
        errorType: string,
        originalError?: unknown
    ) {
        super(message, {
            severity: 'high',
            category: 'system',
            source: 'metrics-collector',
            context: {
                errorType,
                component: 'MetricsCollectorService',
                originalError,
                stack: originalError instanceof Error ? originalError.stack : undefined
            }
        });
    }
}

export class MetricsCollectorService implements MetricsCollector {
    private static instance: MetricsCollectorService;
    private metrics: Metric[] = [];
    private readonly maxMetrics: number;
    private readonly eventBus: EventBusService;

    private constructor(maxMetrics: number = 10000) {
        this.maxMetrics = maxMetrics;
        this.eventBus = EventBusService.getInstance();
    }

    public static getInstance(maxMetrics?: number): MetricsCollectorService {
        if (!MetricsCollectorService.instance) {
            MetricsCollectorService.instance = new MetricsCollectorService(maxMetrics);
        }
        return MetricsCollectorService.instance;
    }

    private validateMetric(metric: Metric): void {
        if (!metric.name || typeof metric.name !== 'string') {
            throw new MetricsError(
                'Invalid metric name',
                'ValidationError'
            );
        }

        if (!metric.type) {
            throw new MetricsError(
                'Invalid metric type',
                'ValidationError'
            );
        }

        if (metric.timestamp && typeof metric.timestamp !== 'number') {
            throw new MetricsError(
                'Invalid metric timestamp',
                'ValidationError'
            );
        }

        if (!metric.labels || typeof metric.labels !== 'object') {
            throw new MetricsError(
                'Invalid metric labels',
                'ValidationError'
            );
        }
    }

    private enrichMetric<T extends BaseMetric>(metric: T): T {
        return {
            ...metric,
            timestamp: metric.timestamp || Date.now(),
            labels: {
                ...metric.labels,
                collector: 'metrics-collector',
                id: uuidv4()
            }
        };
    }

    public async collect(metric: Metric): Promise<void> {
        try {
            this.validateMetric(metric);
            const enrichedMetric = this.enrichMetric(metric);

            // Prune old metrics if we're at capacity
            if (this.metrics.length >= this.maxMetrics) {
                const oldestTimestamp = Math.min(...this.metrics.map(m => m.timestamp));
                await this.clearMetrics(oldestTimestamp);
            }

            this.metrics.push(enrichedMetric);

            // Publish metric collection event
            await this.eventBus.publish({
                id: uuidv4(),
                type: 'system.metric.collected',
                metadata: {
                    timestamp: new Date(),
                    priority: 'low',
                    category: 'system',
                    source: 'metrics-collector',
                    context: {
                        metricType: metric.type,
                        metricName: metric.name
                    }
                },
                payload: {
                    status: 'collected',
                    details: {
                        metric: enrichedMetric
                    }
                }
            });
        } catch (error) {
            throw new MetricsError(
                'Failed to collect metric',
                'CollectionError',
                error
            );
        }
    }

    public async getMetrics(filter?: {
        type?: Metric['type'];
        from?: MetricTimestamp;
        to?: MetricTimestamp;
    }): Promise<Metric[]> {
        try {
            let filteredMetrics = this.metrics;

            if (filter?.type) {
                filteredMetrics = filteredMetrics.filter(m => m.type === filter.type);
            }

            if (filter?.from) {
                filteredMetrics = filteredMetrics.filter(m => m.timestamp >= filter.from!);
            }

            if (filter?.to) {
                filteredMetrics = filteredMetrics.filter(m => m.timestamp <= filter.to!);
            }

            return filteredMetrics;
        } catch (error) {
            throw new MetricsError(
                'Failed to retrieve metrics',
                'RetrievalError',
                error
            );
        }
    }

    public async clearMetrics(before: MetricTimestamp): Promise<void> {
        try {
            const initialCount = this.metrics.length;
            this.metrics = this.metrics.filter(m => m.timestamp > before);
            const clearedCount = initialCount - this.metrics.length;

            // Publish metric cleanup event
            await this.eventBus.publish({
                id: uuidv4(),
                type: 'system.metric.cleared',
                metadata: {
                    timestamp: new Date(),
                    priority: 'low',
                    category: 'system',
                    source: 'metrics-collector',
                    context: {
                        beforeTimestamp: before,
                        clearedCount
                    }
                },
                payload: {
                    status: 'cleared',
                    details: {
                        clearedCount,
                        remainingCount: this.metrics.length
                    }
                }
            });
        } catch (error) {
            throw new MetricsError(
                'Failed to clear metrics',
                'ClearError',
                error
            );
        }
    }

    // Utility methods
    public getMetricCount(): number {
        return this.metrics.length;
    }

    public getMetricsByType(): Record<Metric['type'], number> {
        return this.metrics.reduce((acc, metric) => {
            acc[metric.type] = (acc[metric.type] || 0) + 1;
            return acc;
        }, {} as Record<Metric['type'], number>);
    }

    public getOldestMetricTimestamp(): MetricTimestamp | null {
        if (this.metrics.length === 0) return null;
        return Math.min(...this.metrics.map(m => m.timestamp));
    }

    public getNewestMetricTimestamp(): MetricTimestamp | null {
        if (this.metrics.length === 0) return null;
        return Math.max(...this.metrics.map(m => m.timestamp));
    }

    public clear(): void {
        this.metrics = [];
    }

    public async getStats(): Promise<{
        total: number;
        byType: Record<Metric['type'], number>;
        oldestTimestamp: MetricTimestamp | null;
        newestTimestamp: MetricTimestamp | null;
    }> {
        return {
            total: this.getMetricCount(),
            byType: this.getMetricsByType(),
            oldestTimestamp: this.getOldestMetricTimestamp(),
            newestTimestamp: this.getNewestMetricTimestamp()
        };
    }
}
