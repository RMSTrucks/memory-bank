import { v4 as uuidv4 } from 'uuid';
import {
    HealthMonitor,
    HealthCheck,
    MetricStatus
} from '../types/monitoring';
import { BaseError } from '../types/errors';
import { EventBusService } from './event-bus.service';

class HealthMonitorError extends BaseError {
    constructor(
        message: string,
        errorType: string,
        originalError?: unknown
    ) {
        super(message, {
            severity: 'high',
            category: 'system',
            source: 'health-monitor',
            context: {
                errorType,
                component: 'HealthMonitorService',
                originalError,
                stack: originalError instanceof Error ? originalError.stack : undefined
            }
        });
    }
}

type HealthCheckFunction = () => Promise<HealthCheck>;

export class HealthMonitorService implements HealthMonitor {
    private static instance: HealthMonitorService;
    private readonly eventBus: EventBusService;
    private healthChecks: Map<string, HealthCheckFunction>;
    private readonly timeout: number;

    private constructor(timeout: number = 5000) {
        this.eventBus = EventBusService.getInstance();
        this.healthChecks = new Map();
        this.timeout = timeout;
    }

    public static getInstance(timeout?: number): HealthMonitorService {
        if (!HealthMonitorService.instance) {
            HealthMonitorService.instance = new HealthMonitorService(timeout);
        }
        return HealthMonitorService.instance;
    }

    private async executeWithTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        component: string
    ): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new HealthMonitorError(
                    `Health check timeout for component: ${component}`,
                    'HealthCheckTimeout'
                ));
            }, timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]);
    }

    private createFailedHealthCheck(
        component: string,
        error: unknown
    ): HealthCheck {
        return {
            component,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Health check failed',
            timestamp: Date.now(),
            details: {
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error
            }
        };
    }

    public registerHealthCheck(
        component: string,
        check: HealthCheckFunction
    ): void {
        if (this.healthChecks.has(component)) {
            throw new HealthMonitorError(
                `Health check already registered for component: ${component}`,
                'DuplicateRegistration'
            );
        }

        this.healthChecks.set(component, check);
    }

    public async checkHealth(): Promise<HealthCheck[]> {
        const results: HealthCheck[] = [];
        const timestamp = Date.now();

        for (const [component, check] of this.healthChecks) {
            try {
                const result = await this.executeWithTimeout(
                    check(),
                    this.timeout,
                    component
                );

                results.push({
                    ...result,
                    timestamp
                });

                // Publish health check event
                await this.eventBus.publish({
                    id: uuidv4(),
                    type: 'system.health.checked',
                    metadata: {
                        timestamp: new Date(),
                        priority: result.status === 'failed' ? 'high' : 'low',
                        category: 'system',
                        source: 'health-monitor',
                        context: {
                            component,
                            status: result.status
                        }
                    },
                    payload: {
                        status: 'completed',
                        details: result
                    }
                });
            } catch (error) {
                const failedCheck = this.createFailedHealthCheck(component, error);
                results.push(failedCheck);

                // Publish health check failure event
                await this.eventBus.publish({
                    id: uuidv4(),
                    type: 'system.health.failed',
                    metadata: {
                        timestamp: new Date(),
                        priority: 'high',
                        category: 'system',
                        source: 'health-monitor',
                        context: {
                            component,
                            error: error instanceof Error ? error.message : String(error)
                        }
                    },
                    payload: {
                        status: 'failed',
                        details: failedCheck
                    }
                });
            }
        }

        return results;
    }

    public async getComponentHealth(component: string): Promise<HealthCheck> {
        const check = this.healthChecks.get(component);
        if (!check) {
            throw new HealthMonitorError(
                `No health check registered for component: ${component}`,
                'UnregisteredComponent'
            );
        }

        try {
            return await this.executeWithTimeout(check(), this.timeout, component);
        } catch (error) {
            return this.createFailedHealthCheck(component, error);
        }
    }

    // Utility methods
    public getRegisteredComponents(): string[] {
        return Array.from(this.healthChecks.keys());
    }

    public async getSystemHealth(): Promise<{
        status: MetricStatus;
        components: Record<string, MetricStatus>;
        details: HealthCheck[];
    }> {
        const checks = await this.checkHealth();
        const components: Record<string, MetricStatus> = {};

        let systemStatus: MetricStatus = 'healthy';
        for (const check of checks) {
            components[check.component] = check.status;

            if (check.status === 'failed') {
                systemStatus = 'failed';
            } else if (check.status === 'degraded' && systemStatus === 'healthy') {
                systemStatus = 'degraded';
            }
        }

        return {
            status: systemStatus,
            components,
            details: checks
        };
    }

    public clearHealthChecks(): void {
        this.healthChecks.clear();
    }

    public removeHealthCheck(component: string): boolean {
        return this.healthChecks.delete(component);
    }

    public getTimeout(): number {
        return this.timeout;
    }
}
