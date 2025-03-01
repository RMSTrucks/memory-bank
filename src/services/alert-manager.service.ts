import { v4 as uuidv4 } from 'uuid';
import {
    AlertManager,
    Alert,
    MetricSeverity,
    MetricTimestamp
} from '../types/monitoring';
import { BaseError } from '../types/errors';
import { EventBusService } from './event-bus.service';

class AlertManagerError extends BaseError {
    constructor(
        message: string,
        errorType: string,
        originalError?: unknown
    ) {
        super(message, {
            severity: 'high',
            category: 'system',
            source: 'alert-manager',
            context: {
                errorType,
                component: 'AlertManagerService',
                originalError,
                stack: originalError instanceof Error ? originalError.stack : undefined
            }
        });
    }
}

export class AlertManagerService implements AlertManager {
    private static instance: AlertManagerService;
    private alerts: Alert[];
    private readonly eventBus: EventBusService;
    private readonly maxAlerts: number;

    private constructor(maxAlerts: number = 1000) {
        this.alerts = [];
        this.eventBus = EventBusService.getInstance();
        this.maxAlerts = maxAlerts;
    }

    public static getInstance(maxAlerts?: number): AlertManagerService {
        if (!AlertManagerService.instance) {
            AlertManagerService.instance = new AlertManagerService(maxAlerts);
        }
        return AlertManagerService.instance;
    }

    private validateAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
        if (!alert.severity || !['info', 'warning', 'critical'].includes(alert.severity)) {
            throw new AlertManagerError(
                'Invalid alert severity',
                'ValidationError'
            );
        }

        if (!alert.message || typeof alert.message !== 'string') {
            throw new AlertManagerError(
                'Invalid alert message',
                'ValidationError'
            );
        }

        if (!alert.source || typeof alert.source !== 'string') {
            throw new AlertManagerError(
                'Invalid alert source',
                'ValidationError'
            );
        }
    }

    public async createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert> {
        try {
            this.validateAlert(alert);

            // Remove oldest alerts if we're at capacity
            if (this.alerts.length >= this.maxAlerts) {
                const oldestTimestamp = Math.min(...this.alerts.map(a => a.timestamp));
                await this.clearAlerts(oldestTimestamp);
            }

            const newAlert: Alert = {
                ...alert,
                id: uuidv4(),
                timestamp: Date.now()
            };

            this.alerts.push(newAlert);

            // Publish alert creation event
            await this.eventBus.publish({
                id: uuidv4(),
                type: 'system.alert.created',
                metadata: {
                    timestamp: new Date(),
                    priority: alert.severity === 'critical' ? 'high' : 'medium',
                    category: 'system',
                    source: 'alert-manager',
                    context: {
                        alertId: newAlert.id,
                        severity: alert.severity
                    }
                },
                payload: {
                    status: 'created',
                    details: newAlert
                }
            });

            return newAlert;
        } catch (error) {
            throw new AlertManagerError(
                'Failed to create alert',
                'CreateError',
                error
            );
        }
    }

    public async getAlerts(filter?: {
        severity?: MetricSeverity;
        from?: MetricTimestamp;
        to?: MetricTimestamp;
    }): Promise<Alert[]> {
        try {
            let filteredAlerts = this.alerts;

            if (filter?.severity) {
                filteredAlerts = filteredAlerts.filter(a => a.severity === filter.severity);
            }

            if (filter?.from) {
                filteredAlerts = filteredAlerts.filter(a => a.timestamp >= filter.from!);
            }

            if (filter?.to) {
                filteredAlerts = filteredAlerts.filter(a => a.timestamp <= filter.to!);
            }

            return filteredAlerts;
        } catch (error) {
            throw new AlertManagerError(
                'Failed to retrieve alerts',
                'RetrievalError',
                error
            );
        }
    }

    public async clearAlerts(before: MetricTimestamp): Promise<void> {
        try {
            const initialCount = this.alerts.length;
            this.alerts = this.alerts.filter(a => a.timestamp > before);
            const clearedCount = initialCount - this.alerts.length;

            // Publish alert cleanup event
            await this.eventBus.publish({
                id: uuidv4(),
                type: 'system.alert.cleared',
                metadata: {
                    timestamp: new Date(),
                    priority: 'low',
                    category: 'system',
                    source: 'alert-manager',
                    context: {
                        beforeTimestamp: before,
                        clearedCount
                    }
                },
                payload: {
                    status: 'cleared',
                    details: {
                        clearedCount,
                        remainingCount: this.alerts.length
                    }
                }
            });
        } catch (error) {
            throw new AlertManagerError(
                'Failed to clear alerts',
                'ClearError',
                error
            );
        }
    }

    // Utility methods
    public getAlertCount(): number {
        return this.alerts.length;
    }

    public getAlertsBySeverity(): Record<MetricSeverity, number> {
        return this.alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {} as Record<MetricSeverity, number>);
    }

    public getOldestAlertTimestamp(): MetricTimestamp | null {
        if (this.alerts.length === 0) return null;
        return Math.min(...this.alerts.map(a => a.timestamp));
    }

    public getNewestAlertTimestamp(): MetricTimestamp | null {
        if (this.alerts.length === 0) return null;
        return Math.max(...this.alerts.map(a => a.timestamp));
    }

    public async getStats(): Promise<{
        total: number;
        bySeverity: Record<MetricSeverity, number>;
        oldestTimestamp: MetricTimestamp | null;
        newestTimestamp: MetricTimestamp | null;
    }> {
        return {
            total: this.getAlertCount(),
            bySeverity: this.getAlertsBySeverity(),
            oldestTimestamp: this.getOldestAlertTimestamp(),
            newestTimestamp: this.getNewestAlertTimestamp()
        };
    }
}
