import {
    EventState,
    EventStateManager
} from '../types/events';
import { BaseError } from '../types/errors';

class EventStateError extends BaseError {
    constructor(
        message: string,
        errorType: string,
        originalError?: unknown
    ) {
        super(message, {
            severity: 'high',
            category: 'system',
            source: 'event-state-manager',
            context: {
                errorType,
                component: 'EventStateManagerService',
                originalError,
                stack: originalError instanceof Error ? originalError.stack : undefined
            }
        });
    }
}

export class EventStateManagerService implements EventStateManager {
    private static instance: EventStateManagerService;
    private stateMap: Map<string, EventState>;
    private readonly maxStates: number;

    private constructor(maxStates: number = 1000) {
        this.stateMap = new Map();
        this.maxStates = maxStates;
    }

    public static getInstance(maxStates?: number): EventStateManagerService {
        if (!EventStateManagerService.instance) {
            EventStateManagerService.instance = new EventStateManagerService(maxStates);
        }
        return EventStateManagerService.instance;
    }

    public async setState(state: EventState): Promise<void> {
        try {
            if (this.stateMap.size >= this.maxStates) {
                // Remove oldest state when limit is reached
                const oldestKey = Array.from(this.stateMap.entries())
                    .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())[0][0];
                this.stateMap.delete(oldestKey);
            }

            this.stateMap.set(state.id, {
                ...state,
                timestamp: new Date(state.timestamp)
            });
        } catch (error) {
            throw new EventStateError(
                `Failed to set state: ${state.id}`,
                'SetStateError',
                error
            );
        }
    }

    public async getState(id: string): Promise<EventState | undefined> {
        try {
            return this.stateMap.get(id);
        } catch (error) {
            throw new EventStateError(
                `Failed to get state: ${id}`,
                'GetStateError',
                error
            );
        }
    }

    public async deleteState(id: string): Promise<void> {
        try {
            this.stateMap.delete(id);
        } catch (error) {
            throw new EventStateError(
                `Failed to delete state: ${id}`,
                'DeleteStateError',
                error
            );
        }
    }

    public async clear(): Promise<void> {
        try {
            this.stateMap.clear();
        } catch (error) {
            throw new EventStateError(
                'Failed to clear states',
                'ClearStatesError',
                error
            );
        }
    }

    // Utility methods
    public async getStateCount(): Promise<number> {
        return this.stateMap.size;
    }

    public async getStatesOlderThan(timestamp: Date): Promise<EventState[]> {
        return Array.from(this.stateMap.values())
            .filter(state => state.timestamp < timestamp);
    }

    public async pruneStatesOlderThan(timestamp: Date): Promise<number> {
        const oldStates = await this.getStatesOlderThan(timestamp);
        oldStates.forEach(state => this.stateMap.delete(state.id));
        return oldStates.length;
    }

    public async getStatesByMetadata(key: string, value: unknown): Promise<EventState[]> {
        return Array.from(this.stateMap.values())
            .filter(state => state.metadata[key] === value);
    }

    public async getStats(): Promise<{
        currentStates: number;
        maxStates: number;
        oldestState: Date | null;
        newestState: Date | null;
    }> {
        const states = Array.from(this.stateMap.values());
        const timestamps = states.map(state => state.timestamp);

        return {
            currentStates: this.stateMap.size,
            maxStates: this.maxStates,
            oldestState: timestamps.length ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null,
            newestState: timestamps.length ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null
        };
    }
}
