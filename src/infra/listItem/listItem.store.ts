import { singleton } from 'tsyringe'
import { EventEmitter } from 'typed-ts-events'
import BaseStore from '../base.store'
import AutoLoadableStore from '../autoLoadableStore.interface'
import EventStore, { Event } from '../event.store'

@singleton()
export default class ListItemStore
  extends BaseStore
  implements AutoLoadableStore
{
  protected readonly streamName: string = 'list-items'

  constructor(
    eventStore: EventStore,
    handledEvents: EventEmitter<{ [eventId: string]: Event }>,
  ) {
    super(eventStore, handledEvents)
  }

  async init() {
    this.catchUpStream()
  }

  async cleanUp() {}
}
