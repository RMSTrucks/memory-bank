/**
 * Monitoring System Types
 */

export type MetricValue = number | string | boolean;
export type MetricTimestamp = number;

export type MetricSeverity = 'info' | 'warning' | 'critical';
export type MetricStatus = 'healthy' | 'degraded' | 'failed';
export type ResourceType = 'memory' | 'cpu' | 'disk' | 'network' | 'event-system';

export interface BaseMetric {
    name: string;
    value: MetricValue;
    timestamp: MetricTimestamp;
    labels: Record<string, string>;
}

export interface SystemMetric extends BaseMetric {
    type: 'system';
    component: string;
    status: MetricStatus;
}

export interface PerformanceMetric extends BaseMetric {
    type: 'performance';
    operation: string;
    duration: number;
    success: boolean;
}

export interface ResourceMetric extends BaseMetric {
    type: 'resource';
    resourceType: ResourceType;
    utilization: number;
    limit: number;
}

export interface EventMetric extends BaseMetric {
    type: 'event';
    eventType: string;
    count: number;
    errorRate: number;
}

export type Metric = SystemMetric | PerformanceMetric | ResourceMetric | EventMetric;

export interface HealthCheck {
    component: string;
    status: MetricStatus;
    message: string;
    timestamp: MetricTimestamp;
    details: Record<string, unknown>;
}

export interface Alert {
    id: string;
    severity: MetricSeverity;
    message: string;
    source: string;
    timestamp: MetricTimestamp;
    metric?: Metric;
    context: Record<string, unknown>;
}

export interface ThresholdConfig {
    warning: number;
    critical: number;
}

export interface AlertConfig {
    name: string;
    description: string;
    severity: MetricSeverity;
    threshold: ThresholdConfig;
    enabled: boolean;
}

export interface MonitoringConfig {
    metrics: {
        collectionInterval: number;
        retentionPeriod: number;
        batchSize: number;
    };
    resources: {
        memoryThreshold: ThresholdConfig;
        cpuThreshold: ThresholdConfig;
        diskThreshold: ThresholdConfig;
        eventQueueThreshold: ThresholdConfig;
    };
    health: {
        checkInterval: number;
        timeout: number;
    };
    alerts: {
        enabled: boolean;
        configs: AlertConfig[];
    };
}

// Monitoring Service Interfaces
export interface MetricsCollector {
    collect(metric: Metric): Promise<void>;
    getMetrics(filter?: {
        type?: Metric['type'];
        from?: MetricTimestamp;
        to?: MetricTimestamp;
    }): Promise<Metric[]>;
    clearMetrics(before: MetricTimestamp): Promise<void>;
    clear(): void;
}

export interface ResourceMonitor {
    getMemoryUsage(): Promise<ResourceMetric>;
    getCpuUsage(): Promise<ResourceMetric>;
    getDiskUsage(): Promise<ResourceMetric>;
    getEventSystemMetrics(): Promise<ResourceMetric>;
    checkThresholds(): Promise<Alert[]>;
}

export interface HealthMonitor {
    checkHealth(): Promise<HealthCheck[]>;
    getComponentHealth(component: string): Promise<HealthCheck>;
    registerHealthCheck(component: string, check: () => Promise<HealthCheck>): void;
}

export interface AlertManager {
    createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert>;
    getAlerts(filter?: {
        severity?: MetricSeverity;
        from?: MetricTimestamp;
        to?: MetricTimestamp;
    }): Promise<Alert[]>;
    clearAlerts(before: MetricTimestamp): Promise<void>;
}

export interface MonitoringService {
    metrics: MetricsCollector;
    resources: ResourceMonitor;
    health: HealthMonitor;
    alerts: AlertManager;

    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): Promise<{
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
    }>;
}
