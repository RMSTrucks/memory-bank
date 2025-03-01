import { expect } from 'chai';
import { MonitoringServiceImpl } from '../services/monitoring.service';
import { MetricsCollectorService } from '../services/metrics-collector.service';
import { ResourceMonitorService } from '../services/resource-monitor.service';
import { HealthMonitorService } from '../services/health-monitor.service';
import { AlertManagerService } from '../services/alert-manager.service';
import { MetricStatus, MetricSeverity, MonitoringConfig } from '../types/monitoring';

describe('Monitoring System', () => {
    let monitoringService: MonitoringServiceImpl;
    let metricsCollector: MetricsCollectorService;
    let resourceMonitor: ResourceMonitorService;
    let healthMonitor: HealthMonitorService;
    let alertManager: AlertManagerService;

    beforeEach(() => {
        monitoringService = MonitoringServiceImpl.getInstance({
            metrics: {
                collectionInterval: 1000,
                retentionPeriod: 3600000,
                batchSize: 10
            }
        });
        metricsCollector = MetricsCollectorService.getInstance();
        resourceMonitor = ResourceMonitorService.getInstance();
        healthMonitor = HealthMonitorService.getInstance();
        alertManager = AlertManagerService.getInstance();
    });

    afterEach(async () => {
        if (monitoringService['isRunning']) {
            await monitoringService.stop();
        }
        metricsCollector.clear();
        healthMonitor.clearHealthChecks();
        await alertManager.clearAlerts(Date.now());
    });

    describe('MetricsCollector', () => {
        it('should collect and retrieve metrics', async () => {
            const metric = {
                name: 'test_metric',
                type: 'system' as const,
                value: 42,
                timestamp: Date.now(),
                component: 'test',
                status: 'healthy' as MetricStatus,
                labels: { test: 'true' }
            };

            await metricsCollector.collect(metric);
            const metrics = await metricsCollector.getMetrics();

            expect(metrics).to.have.lengthOf(1);
            expect(metrics[0].name).to.equal('test_metric');
            expect(metrics[0].value).to.equal(42);
        });

        it('should handle metric filtering', async () => {
            const metrics = [
                {
                    name: 'system_metric',
                    type: 'system' as const,
                    value: 1,
                    timestamp: Date.now(),
                    component: 'test',
                    status: 'healthy' as MetricStatus,
                    labels: {}
                },
                {
                    name: 'resource_metric',
                    type: 'resource' as const,
                    value: 2,
                    timestamp: Date.now(),
                    resourceType: 'memory' as const,
                    utilization: 50,
                    limit: 100,
                    labels: {}
                }
            ];

            await Promise.all(metrics.map(m => metricsCollector.collect(m)));
            const systemMetrics = await metricsCollector.getMetrics({ type: 'system' });
            const resourceMetrics = await metricsCollector.getMetrics({ type: 'resource' });

            expect(systemMetrics).to.have.lengthOf(1);
            expect(resourceMetrics).to.have.lengthOf(1);
            expect(systemMetrics[0].name).to.equal('system_metric');
            expect(resourceMetrics[0].name).to.equal('resource_metric');
        });
    });

    describe('ResourceMonitor', () => {
        it('should monitor system resources', async () => {
            const stats = await resourceMonitor.getResourceStats();

            expect(stats.memory).to.exist;
            expect(stats.cpu).to.exist;
            expect(stats.disk).to.exist;
            expect(stats.eventQueue).to.exist;
            expect(stats.alerts).to.be.an('array');
        });

        it('should generate alerts for resource thresholds', async () => {
            // Update thresholds to trigger alerts
            resourceMonitor.updateThresholds({
                memory: { warning: 0, critical: 50 },
                cpu: { warning: 0, critical: 50 }
            });

            const alerts = await resourceMonitor.checkThresholds();
            expect(alerts.length).to.be.greaterThan(0);
            expect(alerts[0].severity).to.be.oneOf(['warning', 'critical']);
        });
    });

    describe('HealthMonitor', () => {
        it('should track component health', async () => {
            healthMonitor.registerHealthCheck('test', async () => ({
                component: 'test',
                status: 'healthy',
                message: 'Test component healthy',
                timestamp: Date.now(),
                details: {}
            }));

            const health = await healthMonitor.checkHealth();
            expect(health).to.have.lengthOf(1);
            expect(health[0].status).to.equal('healthy');
            expect(health[0].component).to.equal('test');
        });

        it('should handle failed health checks', async () => {
            healthMonitor.registerHealthCheck('failing', async () => {
                throw new Error('Health check failed');
            });

            const health = await healthMonitor.checkHealth();
            expect(health[0].status).to.equal('failed');
            expect(health[0].message).to.include('Health check failed');
        });
    });

    describe('AlertManager', () => {
        it('should create and retrieve alerts', async () => {
            const alert = await alertManager.createAlert({
                severity: 'warning',
                message: 'Test alert',
                source: 'test',
                context: {}
            });

            const alerts = await alertManager.getAlerts();
            expect(alerts).to.have.lengthOf(1);
            expect(alerts[0].id).to.equal(alert.id);
            expect(alerts[0].message).to.equal('Test alert');
        });

        it('should filter alerts by severity', async () => {
            await Promise.all([
                alertManager.createAlert({
                    severity: 'warning',
                    message: 'Warning alert',
                    source: 'test',
                    context: {}
                }),
                alertManager.createAlert({
                    severity: 'critical',
                    message: 'Critical alert',
                    source: 'test',
                    context: {}
                })
            ]);

            const criticalAlerts = await alertManager.getAlerts({ severity: 'critical' });
            expect(criticalAlerts).to.have.lengthOf(1);
            expect(criticalAlerts[0].severity).to.equal('critical');
        });
    });

    describe('MonitoringService', () => {
        it('should start and stop monitoring', async () => {
            await monitoringService.start();
            expect(monitoringService['isRunning']).to.be.true;

            const status = await monitoringService.getStatus();
            expect(status.isRunning).to.be.true;
            expect(status.health.status).to.equal('healthy');

            await monitoringService.stop();
            expect(monitoringService['isRunning']).to.be.false;
        });

        it('should handle monitoring cycles', async () => {
            await monitoringService.start();

            // Wait for at least one monitoring cycle
            await new Promise(resolve => setTimeout(resolve, 1500));

            const status = await monitoringService.getStatus();
            expect(status.metrics.total).to.be.greaterThan(0);

            await monitoringService.stop();
        });

        it('should update configuration', async () => {
            const newConfig: Partial<MonitoringConfig> = {
                metrics: {
                    collectionInterval: 2000,
                    retentionPeriod: 3600000,
                    batchSize: 10
                }
            };

            monitoringService.updateConfig(newConfig);
            const config = monitoringService.getConfig();
            expect(config.metrics.collectionInterval).to.equal(2000);
        });

        it('should handle component failures gracefully', async () => {
            // Register a failing health check
            healthMonitor.registerHealthCheck('failing', async () => {
                throw new Error('Component failure');
            });

            await monitoringService.start();
            await new Promise(resolve => setTimeout(resolve, 1500));

            const status = await monitoringService.getStatus();
            expect(status.health.status).to.equal('failed');
            expect(status.alerts.total).to.be.greaterThan(0);

            await monitoringService.stop();
        });
    });
});
