import {
    BaseEvent,
    EventQueue,
    EventPriority
} from '../types/events';

interface QueueItem {
    event: BaseEvent;
    priority: number;
    timestamp: number;
}

export class EventQueueService implements EventQueue {
    private static instance: EventQueueService;
    private queue: QueueItem[];
    private readonly priorityMap: Record<EventPriority, number>;
    private readonly maxSize: number;

    private constructor(maxSize: number = 1000) {
        this.queue = [];
        this.maxSize = maxSize;
        this.priorityMap = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
        };
    }

    public static getInstance(maxSize?: number): EventQueueService {
        if (!EventQueueService.instance) {
            EventQueueService.instance = new EventQueueService(maxSize);
        }
        return EventQueueService.instance;
    }

    private getPriorityScore(priority: EventPriority): number {
        return this.priorityMap[priority] || this.priorityMap.medium;
    }

    private sortQueue(): void {
        this.queue.sort((a, b) => {
            // First compare by priority
            const priorityDiff = b.priority - a.priority;
            if (priorityDiff !== 0) return priorityDiff;

            // If same priority, compare by timestamp (FIFO)
            return a.timestamp - b.timestamp;
        });
    }

    public enqueue<T extends BaseEvent>(event: T): void {
        if (this.queue.length >= this.maxSize) {
            // If queue is full, try to remove lowest priority item
            const lowestPriority = Math.min(...this.queue.map(item => item.priority));
            const lowestPriorityIndex = this.queue.findIndex(item => item.priority === lowestPriority);

            // Only remove if new event has higher priority
            const newPriority = this.getPriorityScore(event.metadata.priority);
            if (newPriority > lowestPriority) {
                this.queue.splice(lowestPriorityIndex, 1);
            } else {
                throw new Error('Queue is full and new event has lower or equal priority');
            }
        }

        const queueItem: QueueItem = {
            event,
            priority: this.getPriorityScore(event.metadata.priority),
            timestamp: Date.now()
        };

        this.queue.push(queueItem);
        this.sortQueue();
    }

    public dequeue(): BaseEvent | undefined {
        const item = this.queue.shift();
        return item?.event;
    }

    public peek(): BaseEvent | undefined {
        return this.queue[0]?.event;
    }

    public size(): number {
        return this.queue.length;
    }

    public clear(): void {
        this.queue = [];
    }

    // Additional utility methods
    public isEmpty(): boolean {
        return this.queue.length === 0;
    }

    public isFull(): boolean {
        return this.queue.length >= this.maxSize;
    }

    public getHighestPriority(): EventPriority | undefined {
        if (this.isEmpty()) return undefined;

        const highestPriorityScore = Math.max(...this.queue.map(item => item.priority));
        return Object.entries(this.priorityMap)
            .find(([_, value]) => value === highestPriorityScore)?.[0] as EventPriority;
    }

    public getEventsByPriority(priority: EventPriority): BaseEvent[] {
        const priorityScore = this.getPriorityScore(priority);
        return this.queue
            .filter(item => item.priority === priorityScore)
            .map(item => item.event);
    }

    public removeEventsByType(type: string): number {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => item.event.type !== type);
        return initialLength - this.queue.length;
    }

    public getQueueStats(): {
        total: number;
        byPriority: Record<EventPriority, number>;
        oldestTimestamp: number | null;
        newestTimestamp: number | null;
    } {
        const byPriority = Object.keys(this.priorityMap).reduce((acc, priority) => {
            acc[priority as EventPriority] = this.getEventsByPriority(priority as EventPriority).length;
            return acc;
        }, {} as Record<EventPriority, number>);

        const timestamps = this.queue.map(item => item.timestamp);
        const oldestTimestamp = timestamps.length ? Math.min(...timestamps) : null;
        const newestTimestamp = timestamps.length ? Math.max(...timestamps) : null;

        return {
            total: this.size(),
            byPriority,
            oldestTimestamp,
            newestTimestamp
        };
    }

    public pruneOldEvents(maxAgeMs: number): number {
        const now = Date.now();
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => (now - item.timestamp) <= maxAgeMs);
        return initialLength - this.queue.length;
    }

    public hasEventOfType(type: string): boolean {
        return this.queue.some(item => item.event.type === type);
    }

    public getNextEventOfType(type: string): BaseEvent | undefined {
        return this.queue.find(item => item.event.type === type)?.event;
    }
}
