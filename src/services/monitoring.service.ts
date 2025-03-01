import { v4 as uuidv4 } from 'uuid';
import {
    MonitoringService,
    MonitoringConfig,
    MetricStatus,
    MetricSeverity,
    Metric
} from '../types/monitoring';
import { BaseError } from '../types/errors';
import { EventBusService } from './event-bus.service';
import { MetricsCollectorService } from './metrics-collector.service';
import { ResourceMonitorService } from './resource-monitor.service';
import { HealthMonitorService } from './health-monitor.service';
import { AlertManagerService } from './alert-manager.service';

class MonitoringError extends BaseError {
    constructor(
        message: string,
        errorType: string,
        originalError?: unknown
    ) {
        super(message, {
            severity: 'high',
            category: 'system',
            source: 'monitoring',
            context: {
                errorType,
                component: 'MonitoringService',
                originalError,
                stack: originalError instanceof Error ? originalError.stack : undefined
            }
        });
    }
}

export class MonitoringServiceImpl implements MonitoringService {
    private static instance: MonitoringServiceImpl;
    private readonly eventBus: EventBusService;
    private isRunning: boolean;
    private monitoringInterval: ReturnType<typeof setInterval> | null;
    private readonly config: MonitoringConfig;

    public readonly metrics: MetricsCollectorService;
    public readonly resources: ResourceMonitorService;
    public readonly health: HealthMonitorService;
    public readonly alerts: AlertManagerService;

    private constructor(config?: Partial<MonitoringConfig>) {
        this.eventBus = EventBusService.getInstance();
        this.metrics = MetricsCollectorService.getInstance();
        this.resources = ResourceMonitorService.getInstance();
        this.health = HealthMonitorService.getInstance();
        this.alerts = AlertManagerService.getInstance();
        this.isRunning = false;
        this.monitoringInterval = null;

        // Default configuration
        this.config = {
            metrics: {
                collectionInterval: config?.metrics?.collectionInterval || 5000,
                retentionPeriod: config?.metrics?.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
                batchSize: config?.metrics?.batchSize || 100
            },
            resources: {
                memoryThreshold: config?.resources?.memoryThreshold || { warning: 80, critical: 90 },
                cpuThreshold: config?.resources?.cpuThreshold || { warning: 70, critical: 85 },
                diskThreshold: config?.resources?.diskThreshold || { warning: 85, critical: 95 },
                eventQueueThreshold: config?.resources?.eventQueueThreshold || { warning: 75, critical: 90 }
            },
            health: {
                checkInterval: config?.health?.checkInterval || 10000,
                timeout: config?.health?.timeout || 5000
            },
            alerts: {
                enabled: config?.alerts?.enabled ?? true,
                configs: config?.alerts?.configs || []
            }
        };
    }

    public static getInstance(config?: Partial<MonitoringConfig>): MonitoringServiceImpl {
        if (!MonitoringServiceImpl.instance) {
            MonitoringServiceImpl.instance = new MonitoringServiceImpl(config);
        }
        return MonitoringServiceImpl.instance;
    }

    private async monitoringCycle(): Promise<void> {
        try {
            // Collect resource metrics
            const resourceStats = await this.resources.getResourceStats();
            for (const metric of Object.values(resourceStats)) {
                if ('type' in metric) {
                    await this.metrics.collect(metric as Metric);
                }
            }

            // Check resource thresholds
            const resourceAlerts = await this.resources.checkThresholds();
            for (const alert of resourceAlerts) {
                await this.alerts.createAlert(alert);
            }

            // Check system health
            const healthStatus = await this.health.getSystemHealth();
            if (healthStatus.status !== 'healthy') {
                await this.alerts.createAlert({
                    severity: healthStatus.status === 'failed' ? 'critical' : 'warning',
                    message: `System health ${healthStatus.status}`,
                    source: 'monitoring',
                    context: healthStatus.components
                });
            }

            // Publish monitoring cycle event
            await this.eventBus.publish({
                id: uuidv4(),
                type: 'system.monitoring.cycle',
                metadata: {
                    timestamp: new Date(),
                    priority: 'low',
                    category: 'system',
                    source: 'monitoring',
                    context: {
                        resourceMetrics: Object.keys(resourceStats).length,
                        alerts: resourceAlerts.length,
                        healthStatus: healthStatus.status
                    }
                },
                payload: {
                    status: 'completed',
                    details: {
                        resources: resourceStats,
                        health: healthStatus
                    }
                }
            });
        } catch (error) {
            throw new MonitoringError(
                'Monitoring cycle failed',
                'CycleError',
                error
            );
        }
    }

    public async start(): Promise<void> {
        if (this.isRunning) {
            throw new MonitoringError(
                'Monitoring service is already running',
                'StartError'
            );
        }

        try {
            this.isRunning = true;

            // Register health checks
            this.health.registerHealthCheck('metrics', async () => ({
                component: 'metrics',
                status: 'healthy',
                message: 'Metrics collector operational',
                timestamp: Date.now(),
                details: await this.metrics.getStats()
            }));

            this.health.registerHealthCheck('resources', async () => ({
                component: 'resources',
                status: 'healthy',
                message: 'Resource monitor operational',
                timestamp: Date.now(),
                details: await this.resources.getResourceStats()
            }));

            this.health.registerHealthCheck('alerts', async () => ({
                component: 'alerts',
                status: 'healthy',
                message: 'Alert manager operational',
                timestamp: Date.now(),
                details: await this.alerts.getStats()
            }));

            // Start monitoring cycle
            this.monitoringInterval = setInterval(
                () => this.monitoringCycle().catch(error => {
                    this.eventBus.publish({
                        id: uuidv4(),
                        type: 'system.monitoring.error',
                        metadata: {
                            timestamp: new Date(),
                            priority: 'high',
                            category: 'system',
                            source: 'monitoring',
                            context: {
                                error: error instanceof Error ? error.message : String(error)
                            }
                        },
                        payload: {
                            status: 'error',
                            details: {
                                error: error instanceof Error ? {
                                    name: error.name,
                                    message: error.message,
                                    stack: error.stack
                                } : error
                            }
                        }
                    });
                }),
                this.config.metrics.collectionInterval
            );

            await this.eventBus.publish({
                id: uuidv4(),
                type: 'system.monitoring.started',
                metadata: {
                    timestamp: new Date(),
                    priority: 'high',
                    category: 'system',
                    source: 'monitoring',
                    context: {
                        config: this.config
                    }
                },
                payload: {
                    status: 'started',
                    details: {
                        config: this.config
                    }
                }
            });
        } catch (error) {
            this.isRunning = false;
            throw new MonitoringError(
                'Failed to start monitoring service',
                'StartError',
                error
            );
        }
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) {
            throw new MonitoringError(
                'Monitoring service is not running',
                'StopError'
            );
        }

        try {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            this.isRunning = false;

            await this.eventBus.publish({
                id: uuidv4(),
                type: 'system.monitoring.stopped',
                metadata: {
                    timestamp: new Date(),
                    priority: 'high',
                    category: 'system',
                    source: 'monitoring',
                    context: {}
                },
                payload: {
                    status: 'stopped',
                    details: {
                        lastStats: await this.getStatus()
                    }
                }
            });
        } catch (error) {
            throw new MonitoringError(
                'Failed to stop monitoring service',
                'StopError',
                error
            );
        }
    }

    public async getStatus(): Promise<{
        isRunning: boolean;
        metrics: {
            total: number;
            byType: Record<Metric['type'], number>;
        };
        alerts: {
            total: number;
            bySeverity: Record<MetricSeverity, number>;
        };
        health: {
            status: MetricStatus;
            components: Record<string, MetricStatus>;
        };
    }> {
        try {
            const [metricsStats, alertsStats, healthStats] = await Promise.all([
                this.metrics.getStats(),
                this.alerts.getStats(),
                this.health.getSystemHealth()
            ]);

            return {
                isRunning: this.isRunning,
                metrics: {
                    total: metricsStats.total,
                    byType: metricsStats.byType
                },
                alerts: {
                    total: alertsStats.total,
                    bySeverity: alertsStats.bySeverity
                },
                health: {
                    status: healthStats.status,
                    components: healthStats.components
                }
            };
        } catch (error) {
            throw new MonitoringError(
                'Failed to get monitoring status',
                'StatusError',
                error
            );
        }
    }

    // Utility methods
    public getConfig(): MonitoringConfig {
        return { ...this.config };
    }

    public updateConfig(newConfig: Partial<MonitoringConfig>): void {
        Object.assign(this.config, newConfig);
        if (this.isRunning) {
            // Restart monitoring with new config
            this.stop().then(() => this.start());
        }
    }
}
