import { EventEmitter } from 'events';

export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Allow more listeners for complex pattern evolution
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public async emit(event: string, data: any): Promise<void> {
    this.emitter.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void): void {
    this.emitter.on(event, callback);
  }

  public off(event: string, callback: (data: any) => void): void {
    this.emitter.off(event, callback);
  }

  public once(event: string, callback: (data: any) => void): void {
    this.emitter.once(event, callback);
  }
}
