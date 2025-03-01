import { v4 as uuidv4 } from 'uuid';
import {
    EventFactory,
    EventPriority,
    EventCategory,
    SystemEvent,
    PatternEvent,
    ResourceEvent,
    StateEvent,
    DocumentationEvent,
    ErrorEvent,
    EventMetadata
} from '../types/events';

export class EventFactoryService implements EventFactory {
    private static instance: EventFactoryService;

    private constructor() {}

    public static getInstance(): EventFactoryService {
        if (!EventFactoryService.instance) {
            EventFactoryService.instance = new EventFactoryService();
        }
        return EventFactoryService.instance;
    }

    private createMetadata(
        category: EventCategory,
        priority: EventPriority = 'medium',
        source: string = 'system',
        context: Record<string, unknown> = {}
    ): EventMetadata {
        return {
            timestamp: new Date(),
            priority,
            category,
            source,
            context
        };
    }

    public createSystemEvent(
        type: SystemEvent['type'],
        payload: SystemEvent['payload'],
        priority: EventPriority = 'medium'
    ): SystemEvent {
        return {
            id: uuidv4(),
            type,
            metadata: this.createMetadata('system', priority),
            payload
        };
    }

    public createPatternEvent(
        type: PatternEvent['type'],
        payload: PatternEvent['payload'],
        priority: EventPriority = 'medium'
    ): PatternEvent {
        return {
            id: uuidv4(),
            type,
            metadata: this.createMetadata('pattern', priority, 'pattern-system', {
                patternId: payload.patternId,
                confidence: payload.confidence
            }),
            payload
        };
    }

    public createResourceEvent(
        type: ResourceEvent['type'],
        payload: ResourceEvent['payload'],
        priority: EventPriority = 'medium'
    ): ResourceEvent {
        return {
            id: uuidv4(),
            type,
            metadata: this.createMetadata('resource', priority, 'resource-manager', {
                resourceId: payload.resourceId,
                resourceType: payload.resourceType
            }),
            payload
        };
    }

    public createStateEvent(
        type: StateEvent['type'],
        payload: StateEvent['payload'],
        priority: EventPriority = 'medium'
    ): StateEvent {
        return {
            id: uuidv4(),
            type,
            metadata: this.createMetadata('state', priority, 'state-manager', {
                stateId: payload.stateId,
                hasChanges: Object.keys(payload.changes).length > 0
            }),
            payload
        };
    }

    public createDocumentationEvent(
        type: DocumentationEvent['type'],
        payload: DocumentationEvent['payload'],
        priority: EventPriority = 'medium'
    ): DocumentationEvent {
        return {
            id: uuidv4(),
            type,
            metadata: this.createMetadata('doc', priority, 'doc-system', {
                docId: payload.docId,
                docType: payload.docType
            }),
            payload
        };
    }

    public createErrorEvent(
        type: ErrorEvent['type'],
        payload: ErrorEvent['payload'],
        priority: EventPriority = 'high'
    ): ErrorEvent {
        return {
            id: uuidv4(),
            type,
            metadata: this.createMetadata('error', priority, 'error-handler', {
                errorId: payload.errorId,
                errorType: payload.errorType
            }),
            payload
        };
    }

    // Helper methods for common event creation scenarios
    public createStartupEvent(details?: Record<string, unknown>): SystemEvent {
        return this.createSystemEvent(
            'system.startup',
            {
                status: 'starting',
                details
            },
            'high'
        );
    }

    public createShutdownEvent(details?: Record<string, unknown>): SystemEvent {
        return this.createSystemEvent(
            'system.shutdown',
            {
                status: 'shutting_down',
                details
            },
            'high'
        );
    }

    public createPatternDetectedEvent(
        patternId: string,
        confidence: number,
        impact: number,
        details: Record<string, unknown>
    ): PatternEvent {
        return this.createPatternEvent(
            'pattern.detected',
            {
                patternId,
                confidence,
                impact,
                details
            }
        );
    }

    public createResourceCreatedEvent(
        resourceId: string,
        resourceType: string,
        details: Record<string, unknown>
    ): ResourceEvent {
        return this.createResourceEvent(
            'resource.created',
            {
                resourceId,
                resourceType,
                operation: 'create',
                details
            }
        );
    }

    public createStateChangedEvent(
        stateId: string,
        previous: unknown,
        current: unknown,
        changes: Record<string, unknown>
    ): StateEvent {
        return this.createStateEvent(
            'state.changed',
            {
                stateId,
                previous,
                current,
                changes
            }
        );
    }

    public createDocCreatedEvent(
        docId: string,
        docType: string,
        details: Record<string, unknown>
    ): DocumentationEvent {
        return this.createDocumentationEvent(
            'doc.created',
            {
                docId,
                docType,
                operation: 'create',
                details
            }
        );
    }

    public createErrorThrownEvent(
        errorId: string,
        errorType: string,
        message: string,
        stack?: string,
        details: Record<string, unknown> = {}
    ): ErrorEvent {
        return this.createErrorEvent(
            'error.thrown',
            {
                errorId,
                errorType,
                message,
                stack,
                details
            }
        );
    }
}
