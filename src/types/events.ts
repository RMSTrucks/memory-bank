/**
 * Event System Types
 */

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export type EventCategory =
    | 'system'      // System-level events
    | 'pattern'     // Pattern-related events
    | 'resource'    // Resource management events
    | 'state'       // State change events
    | 'doc'         // Documentation events
    | 'error';      // Error events

export interface EventMetadata {
    timestamp: Date;
    priority: EventPriority;
    category: EventCategory;
    source: string;
    context: Record<string, unknown>;
}

export interface BaseEvent {
    id: string;
    type: string;
    metadata: EventMetadata;
    payload: unknown;
}

// System Events
export interface SystemEvent extends BaseEvent {
    type: 'system.startup' | 'system.shutdown' | 'system.ready' | 'system.error' | 'system.info' | 'system.test' | 'system.critical';
    payload: {
        status: string;
        details?: Record<string, unknown>;
    };
}

// Pattern Events
export interface PatternEvent extends BaseEvent {
    type: 'pattern.detected' | 'pattern.learned' | 'pattern.optimized' | 'pattern.validated';
    payload: {
        patternId: string;
        confidence: number;
        impact: number;
        details: Record<string, unknown>;
    };
}

// Resource Events
export interface ResourceEvent extends BaseEvent {
    type: 'resource.created' | 'resource.updated' | 'resource.deleted' | 'resource.accessed';
    payload: {
        resourceId: string;
        resourceType: string;
        operation: string;
        details: Record<string, unknown>;
    };
}

// State Events
export interface StateEvent extends BaseEvent {
    type: 'state.changed' | 'state.validated' | 'state.restored' | 'state.saved';
    payload: {
        stateId: string;
        previous: unknown;
        current: unknown;
        changes: Record<string, unknown>;
    };
}

// Documentation Events
export interface DocumentationEvent extends BaseEvent {
    type: 'doc.created' | 'doc.updated' | 'doc.validated' | 'doc.linked';
    payload: {
        docId: string;
        docType: string;
        operation: string;
        details: Record<string, unknown>;
    };
}

// Error Events
export interface ErrorEvent extends BaseEvent {
    type: 'error.thrown' | 'error.handled' | 'error.recovered' | 'error.logged';
    payload: {
        errorId: string;
        errorType: string;
        message: string;
        stack?: string;
        details: Record<string, unknown>;
    };
}

// Vector Events
export interface VectorEvent extends BaseEvent {
    type: 'vector.upsert' | 'vector.query' | 'vector.delete' | 'vector.batch' | 'vector.cache_hit' | 'vector.cache_miss';
    payload: {
        vectorIds?: string[];
        namespace?: string;
        operation: string;
        metadata?: Record<string, unknown>;
        performance?: {
            duration: number;
            vectorCount: number;
            cacheHits?: number;
            cacheMisses?: number;
        };
    };
}

// Event Handler Types
export type EventHandler<T extends BaseEvent = BaseEvent> = {
    handle(event: T): Promise<void>;
    filter?(event: T): boolean;
    priority: number;
};

export interface EventSubscription {
    unsubscribe(): void;
}

// Event Bus Interface
export interface EventBus {
    publish<T extends BaseEvent>(event: T): Promise<void>;
    subscribe<T extends BaseEvent>(
        type: string | string[],
        handler: EventHandler<T>
    ): EventSubscription;
    unsubscribe(type: string, handler: EventHandler): void;
    clear(): void;
}

// Event Queue Interface
export interface EventQueue {
    enqueue<T extends BaseEvent>(event: T): void;
    dequeue(): BaseEvent | undefined;
    peek(): BaseEvent | undefined;
    size(): number;
    clear(): void;
    isEmpty(): boolean;
    isFull(): boolean;
    getQueueStats(): {
        total: number;
        byPriority: Record<EventPriority, number>;
        oldestTimestamp: number | null;
        newestTimestamp: number | null;
    };
    getEventsByPriority(priority: EventPriority): BaseEvent[];
    removeEventsByType(type: string): number;
    pruneOldEvents(maxAgeMs: number): number;
    hasEventOfType(type: string): boolean;
    getNextEventOfType(type: string): BaseEvent | undefined;
}

// Event State Interface
export interface EventState {
    id: string;
    timestamp: Date;
    data: unknown;
    metadata: Record<string, unknown>;
}

// Event State Manager Interface
export interface EventStateManager {
    setState(state: EventState): Promise<void>;
    getState(id: string): Promise<EventState | undefined>;
    deleteState(id: string): Promise<void>;
    clear(): Promise<void>;
}

// Event Factory Interface
export interface EventFactory {
    createSystemEvent(
        type: SystemEvent['type'],
        payload: SystemEvent['payload'],
        priority?: EventPriority
    ): SystemEvent;

    createPatternEvent(
        type: PatternEvent['type'],
        payload: PatternEvent['payload'],
        priority?: EventPriority
    ): PatternEvent;

    createResourceEvent(
        type: ResourceEvent['type'],
        payload: ResourceEvent['payload'],
        priority?: EventPriority
    ): ResourceEvent;

    createStateEvent(
        type: StateEvent['type'],
        payload: StateEvent['payload'],
        priority?: EventPriority
    ): StateEvent;

    createDocumentationEvent(
        type: DocumentationEvent['type'],
        payload: DocumentationEvent['payload'],
        priority?: EventPriority
    ): DocumentationEvent;

    createErrorEvent(
        type: ErrorEvent['type'],
        payload: ErrorEvent['payload'],
        priority?: EventPriority
    ): ErrorEvent;

    createVectorEvent(
        type: VectorEvent['type'],
        payload: VectorEvent['payload'],
        priority?: EventPriority
    ): VectorEvent;
}

// Event Registry Interface
export interface EventRegistry {
    registerHandler<T extends BaseEvent>(
        type: string | string[],
        handler: EventHandler<T>
    ): EventSubscription;

    unregisterHandler(type: string, handler: EventHandler): void;

    getHandlers(type: string): EventHandler[];

    clearHandlers(): void;
}
