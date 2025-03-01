import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import {
    ResourceMonitor,
    ResourceMetric,
    Alert,
    ResourceType,
    ThresholdConfig
} from '../types/monitoring';
import { BaseError } from '../types/errors';
import { EventQueueService } from './event-queue.service';

class ResourceMonitorError extends BaseError {
    constructor(
        message: string,
        errorType: string,
        originalError?: unknown
    ) {
        super(message, {
            severity: 'high',
            category: 'system',
            source: 'resource-monitor',
            context: {
                errorType,
                component: 'ResourceMonitorService',
                originalError,
                stack: originalError instanceof Error ? originalError.stack : undefined
            }
        });
    }
}

interface ResourceThresholds {
    memory: ThresholdConfig;
    cpu: ThresholdConfig;
    disk: ThresholdConfig;
    eventQueue: ThresholdConfig;
}

export class ResourceMonitorService implements ResourceMonitor {
    private static instance: ResourceMonitorService;
    private readonly eventQueue: EventQueueService;
    private thresholds: ResourceThresholds;

    private constructor(thresholds?: Partial<ResourceThresholds>) {
        this.eventQueue = EventQueueService.getInstance();
        this.thresholds = {
            memory: thresholds?.memory || { warning: 80, critical: 90 },
            cpu: thresholds?.cpu || { warning: 70, critical: 85 },
            disk: thresholds?.disk || { warning: 85, critical: 95 },
            eventQueue: thresholds?.eventQueue || { warning: 75, critical: 90 }
        };
    }

    public static getInstance(thresholds?: Partial<ResourceThresholds>): ResourceMonitorService {
        if (!ResourceMonitorService.instance) {
            ResourceMonitorService.instance = new ResourceMonitorService(thresholds);
        }
        return ResourceMonitorService.instance;
    }

    private createResourceMetric(
        name: string,
        resourceType: ResourceType,
        utilization: number,
        limit: number
    ): ResourceMetric {
        return {
            name,
            type: 'resource',
            resourceType,
            utilization,
            limit,
            timestamp: Date.now(),
            value: utilization,
            labels: {
                resourceType,
                component: 'resource-monitor',
                id: uuidv4()
            }
        };
    }

    public async getMemoryUsage(): Promise<ResourceMetric> {
        try {
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const utilization = (usedMemory / totalMemory) * 100;

            return this.createResourceMetric(
                'memory_usage',
                'memory',
                utilization,
                totalMemory
            );
        } catch (error) {
            throw new ResourceMonitorError(
                'Failed to get memory usage',
                'MemoryMetricError',
                error
            );
        }
    }

    public async getCpuUsage(): Promise<ResourceMetric> {
        try {
            const cpus = os.cpus();
            const totalCpuTime = cpus.reduce((acc, cpu) => {
                return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
            }, 0);

            const totalIdleTime = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
            const utilization = ((totalCpuTime - totalIdleTime) / totalCpuTime) * 100;

            return this.createResourceMetric(
                'cpu_usage',
                'cpu',
                utilization,
                100 * cpus.length
            );
        } catch (error) {
            throw new ResourceMonitorError(
                'Failed to get CPU usage',
                'CpuMetricError',
                error
            );
        }
    }

    public async getDiskUsage(): Promise<ResourceMetric> {
        try {
            // Note: This is a simplified disk usage check
            // In a real implementation, you'd want to use a library like `diskusage`
            // or make system-specific calls to get actual disk usage
            const utilization = 70; // Placeholder value
            const limit = 100;

            return this.createResourceMetric(
                'disk_usage',
                'disk',
                utilization,
                limit
            );
        } catch (error) {
            throw new ResourceMonitorError(
                'Failed to get disk usage',
                'DiskMetricError',
                error
            );
        }
    }

    public async getEventSystemMetrics(): Promise<ResourceMetric> {
        try {
            const queueSize = this.eventQueue.size();
            const queueCapacity = 1000; // This should match EventQueueService's maxSize
            const utilization = (queueSize / queueCapacity) * 100;

            return this.createResourceMetric(
                'event_queue_usage',
                'event-system',
                utilization,
                queueCapacity
            );
        } catch (error) {
            throw new ResourceMonitorError(
                'Failed to get event system metrics',
                'EventSystemMetricError',
                error
            );
        }
    }

    private checkThreshold(
        metric: ResourceMetric,
        threshold: ThresholdConfig
    ): Alert | null {
        if (metric.utilization >= threshold.critical) {
            return {
                id: uuidv4(),
                severity: 'critical',
                message: `${metric.resourceType} utilization critical: ${metric.utilization.toFixed(2)}%`,
                source: 'resource-monitor',
                timestamp: Date.now(),
                metric,
                context: {
                    threshold: threshold.critical,
                    current: metric.utilization
                }
            };
        } else if (metric.utilization >= threshold.warning) {
            return {
                id: uuidv4(),
                severity: 'warning',
                message: `${metric.resourceType} utilization warning: ${metric.utilization.toFixed(2)}%`,
                source: 'resource-monitor',
                timestamp: Date.now(),
                metric,
                context: {
                    threshold: threshold.warning,
                    current: metric.utilization
                }
            };
        }

        return null;
    }

    public async checkThresholds(): Promise<Alert[]> {
        try {
            const alerts: Alert[] = [];
            const metrics = await Promise.all([
                this.getMemoryUsage(),
                this.getCpuUsage(),
                this.getDiskUsage(),
                this.getEventSystemMetrics()
            ]);

            const [memory, cpu, disk, eventQueue] = metrics;

            const memoryAlert = this.checkThreshold(memory, this.thresholds.memory);
            if (memoryAlert) alerts.push(memoryAlert);

            const cpuAlert = this.checkThreshold(cpu, this.thresholds.cpu);
            if (cpuAlert) alerts.push(cpuAlert);

            const diskAlert = this.checkThreshold(disk, this.thresholds.disk);
            if (diskAlert) alerts.push(diskAlert);

            const eventQueueAlert = this.checkThreshold(eventQueue, this.thresholds.eventQueue);
            if (eventQueueAlert) alerts.push(eventQueueAlert);

            return alerts;
        } catch (error) {
            throw new ResourceMonitorError(
                'Failed to check resource thresholds',
                'ThresholdCheckError',
                error
            );
        }
    }

    // Utility methods
    public getThresholds(): ResourceThresholds {
        return { ...this.thresholds };
    }

    public updateThresholds(newThresholds: Partial<ResourceThresholds>): void {
        this.thresholds = {
            ...this.thresholds,
            ...newThresholds
        };
    }

    public async getResourceStats(): Promise<{
        memory: ResourceMetric;
        cpu: ResourceMetric;
        disk: ResourceMetric;
        eventQueue: ResourceMetric;
        alerts: Alert[];
    }> {
        const [memory, cpu, disk, eventQueue, alerts] = await Promise.all([
            this.getMemoryUsage(),
            this.getCpuUsage(),
            this.getDiskUsage(),
            this.getEventSystemMetrics(),
            this.checkThresholds()
        ]);

        return {
            memory,
            cpu,
            disk,
            eventQueue,
            alerts
        };
    }
}
