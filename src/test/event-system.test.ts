import { expect } from 'chai';
import { EventBusService } from '../services/event-bus.service';
import { EventQueueService } from '../services/event-queue.service';
import { EventStateManagerService } from '../services/event-state-manager.service';
import { EventFactoryService } from '../services/event-factory.service';
import { BaseEvent, EventHandler, SystemEvent } from '../types/events';

describe('Event System', () => {
    let eventBus: EventBusService;
    let eventQueue: EventQueueService;
    let eventStateManager: EventStateManagerService;
    let eventFactory: EventFactoryService;

    beforeEach(() => {
        eventBus = EventBusService.getInstance();
        eventQueue = EventQueueService.getInstance();
        eventStateManager = EventStateManagerService.getInstance();
        eventFactory = EventFactoryService.getInstance();

        // Clear any existing state
        eventBus.clear();
        eventQueue.clear();
        eventStateManager.clear();
    });

    describe('EventFactory', () => {
        it('should create system events', () => {
            const event = eventFactory.createSystemEvent('system.startup', {
                status: 'starting',
                details: { version: '1.0.0' }
            });

            expect(event.type).to.equal('system.startup');
            expect(event.metadata.category).to.equal('system');
            expect(event.payload.status).to.equal('starting');
            expect(event.payload.details?.version).to.equal('1.0.0');
        });

        it('should create pattern events', () => {
            const event = eventFactory.createPatternEvent('pattern.detected', {
                patternId: 'test-pattern',
                confidence: 0.95,
                impact: 0.8,
                details: { type: 'workflow' }
            });

            expect(event.type).to.equal('pattern.detected');
            expect(event.metadata.category).to.equal('pattern');
            expect(event.payload.patternId).to.equal('test-pattern');
            expect(event.payload.confidence).to.equal(0.95);
        });
    });

    describe('EventQueue', () => {
        it('should enqueue and dequeue events in priority order', () => {
            const highPriorityEvent = eventFactory.createSystemEvent(
                'system.error',
                { status: 'error' },
                'high'
            );

            const lowPriorityEvent = eventFactory.createSystemEvent(
                'system.info',
                { status: 'info' },
                'low'
            );

            eventQueue.enqueue(lowPriorityEvent);
            eventQueue.enqueue(highPriorityEvent);

            const firstDequeued = eventQueue.dequeue();
            expect(firstDequeued?.metadata.priority).to.equal('high');

            const secondDequeued = eventQueue.dequeue();
            expect(secondDequeued?.metadata.priority).to.equal('low');
        });

        it('should handle queue overflow correctly', () => {
            const maxSize = 1000;
            let overflowOccurred = false;

            // Fill queue to max
            for (let i = 0; i < maxSize; i++) {
                eventQueue.enqueue(eventFactory.createSystemEvent(
                    'system.test',
                    { status: 'test', details: { index: i } },
                    'low'
                ));
            }

            try {
                // Try to add one more low priority event
                eventQueue.enqueue(eventFactory.createSystemEvent(
                    'system.test',
                    { status: 'overflow' },
                    'low'
                ));
            } catch (error) {
                overflowOccurred = true;
            }

            expect(overflowOccurred).to.be.true;

            // High priority event should still be accepted
            const highPriorityEvent = eventFactory.createSystemEvent(
                'system.critical',
                { status: 'critical' },
                'high'
            );

            let highPriorityAccepted = true;
            try {
                eventQueue.enqueue(highPriorityEvent);
            } catch {
                highPriorityAccepted = false;
            }

            expect(highPriorityAccepted).to.be.true;
        });
    });

    describe('EventBus', () => {
        it('should deliver events to subscribed handlers', async () => {
            let eventReceived = false;
            const testHandler: EventHandler<SystemEvent> = {
                handle: async (event) => {
                    eventReceived = true;
                    expect(event.type).to.equal('system.test');
                },
                priority: 1
            };

            eventBus.subscribe('system.test', testHandler);

            await eventBus.publish(eventFactory.createSystemEvent(
                'system.test',
                { status: 'test' }
            ));

            // Wait for async event processing
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(eventReceived).to.be.true;
        });

        it('should handle multiple handlers for same event type', async () => {
            const receivedEvents: string[] = [];

            const handler1: EventHandler = {
                handle: async () => {
                    receivedEvents.push('handler1');
                },
                priority: 1
            };

            const handler2: EventHandler = {
                handle: async () => {
                    receivedEvents.push('handler2');
                },
                priority: 2
            };

            eventBus.subscribe('test.event', handler1);
            eventBus.subscribe('test.event', handler2);

            await eventBus.publish({
                id: 'test',
                type: 'test.event',
                metadata: {
                    timestamp: new Date(),
                    priority: 'medium',
                    category: 'system',
                    source: 'test',
                    context: {}
                },
                payload: {}
            });

            // Wait for async event processing
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(receivedEvents).to.have.lengthOf(2);
            expect(receivedEvents).to.include('handler1');
            expect(receivedEvents).to.include('handler2');
        });
    });

    describe('EventStateManager', () => {
        it('should store and retrieve event state', async () => {
            const stateId = 'test-state';
            const state = {
                id: stateId,
                timestamp: new Date(),
                data: { value: 'test' },
                metadata: { type: 'test' }
            };

            await eventStateManager.setState(state);
            const retrieved = await eventStateManager.getState(stateId);

            expect(retrieved).to.not.be.undefined;
            expect(retrieved?.id).to.equal(stateId);
            expect(retrieved?.data).to.deep.equal({ value: 'test' });
        });

        it('should handle state expiration', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 1);

            const state1 = {
                id: 'old-state',
                timestamp: oldDate,
                data: { value: 'old' },
                metadata: {}
            };

            const state2 = {
                id: 'new-state',
                timestamp: new Date(),
                data: { value: 'new' },
                metadata: {}
            };

            await eventStateManager.setState(state1);
            await eventStateManager.setState(state2);

            const oldStates = await eventStateManager.getStatesOlderThan(new Date());
            expect(oldStates).to.have.lengthOf(1);
            expect(oldStates[0].id).to.equal('old-state');

            const pruned = await eventStateManager.pruneStatesOlderThan(new Date());
            expect(pruned).to.equal(1);

            const remaining = await eventStateManager.getState('new-state');
            expect(remaining).to.not.be.undefined;
        });
    });
});
