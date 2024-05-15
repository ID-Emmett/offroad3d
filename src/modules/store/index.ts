class EventBus {
    private subscribers: { [name: string]: Array<Function> } = {};

    public subscribe<T extends string>(eventName: T, handler: Function): void {
        if (!this.subscribers[eventName]) {
            this.subscribers[eventName] = [];
        }
        this.subscribers[eventName].push(handler);

    }

    public unsubscribe<T extends string>(eventName: T, handler: Function): void {
        if (this.subscribers[eventName]) {
            this.subscribers[eventName] = this.subscribers[eventName].filter(subscriber => subscriber !== handler);
        }
    }

    public publish<T extends string>(eventName: T, eventData: object): void {
        if (this.subscribers[eventName]) {
            this.subscribers[eventName].forEach(subscriber => subscriber(eventData));
        }
    }

}

class StateManager {
    private states: { [key: string]: any } = {};
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    // Modify and publish
    public setState(key: string, value: any, eventName?: string): void {
        this.states[key] = value;
        if (eventName) this.eventBus.publish(eventName, { key, value });
    }

    public getState(key: string): any {
        return this.states[key];
    }
}

export const eventBus = new EventBus();
export const stateManager = new StateManager(eventBus);


// Example
/*
    file A publish
    import { eventBus } from '@/store/index'
    eventBus.publish('myEvent', { message: 'Hello, world!' });

    file B subscribe and Store data
    import { eventBus, stateManager } from '@/store/index'
    const subscriber = (data: any) => {
      console.log('Received data:', data);
    };
    eventBus.subscribe('myEvent', subscriber);

    // Modify and publish
    stateManager.setState("stateDataName1", 100, 'myEvent');
 */