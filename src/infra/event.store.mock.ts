import { singleton } from 'tsyringe'
import { v4 as uuid } from 'uuid'
import EventStore, { Event, EventCallback } from './event.store'

@singleton()
export default class EventMockStore extends EventStore {
  private streamListeners: Map<string, Array<(event: Event) => void>> =
    new Map()

  async init() {}
  async cleanUp() {}

  /**
   * This mock EventStore simply replays the persisted events
   * to the listeners that are registered via `catchUpStream()`.
   */
  async persistEvent(streamName: string, event: Event) {
    // Recreate event to add eventId
    const eventToStore = new (event.constructor as typeof Event)(
      uuid(),
      event.aggregateId,
      event.data,
    )

    const listeners = this.streamListeners.get(streamName) || []

    for (const listener of listeners) {
      listener(eventToStore)
    }

    return eventToStore.eventId as string
  }

  catchUpStream(streamName: string, callback: EventCallback) {
    const listeners = this.streamListeners.get(streamName) || []
    listeners.push(callback)
    this.streamListeners.set(streamName, listeners)
  }
}
