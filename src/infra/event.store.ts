import path from 'path'
import assert from 'assert'
import { singleton } from 'tsyringe'
import DataStore from 'nedb-promises'
import { v4 as uuid } from 'uuid'
import AutoLoadableStore from './autoLoadableStore.interface'
import LoggerService from '../domain/logger.service'
import ConfigService from '../domain/config.service'
import UserEntity from '../domain/user.entity'

export class Event {
  static readonly type: string
  // @todo Remove this by determining class constructor from instance and then get static type
  readonly type: string // Add: readonly type = MyEventClass.type

  constructor(
    readonly eventId: string | null,
    readonly aggregateId: string,
    readonly data: any = {},
  ) {
    this.data.id = aggregateId
  }

  applyTo(aggregate: any): void {
    this.assertAggregateId(aggregate)

    // Fold left
    Object.assign(aggregate, this.data)
  }

  assertAggregateId(aggregate: any) {
    assert.ok(
      aggregate.id === this.data.id,
      `Invalid aggregate ID for ${this.type} event (${aggregate.id} must be equal to ${this.data.id})`,
    )
  }
}

type EventDocument = {
  eventId: string
  type: string
  data: any
  meta: any
  createdAt: Date
}

export type EventCallback = (event: Event) => void

const eventClasses: typeof Event[] = []

export function registerEventClass(eventClass: typeof Event) {
  eventClasses.push(eventClass)
}

@singleton()
export default class EventStore implements AutoLoadableStore {
  private dataStores: { [streamName: string]: DataStore } = {}
  private timers: NodeJS.Timeout[] = []

  constructor(private logger: LoggerService, private config: ConfigService) {}

  async init() {
    // Data stores are lazy loaded
  }

  async cleanUp() {
    this.timers.forEach(clearInterval)
  }

  private async getDataStore(streamName: string): Promise<DataStore> {
    if (!this.dataStores[streamName]) {
      const dataStore = DataStore.create({
        filename: path.join(
          this.config.get('database.basePath', process.cwd()),
          `${streamName}.db.json`,
        ),
        timestampData: true,
      })

      await dataStore.ensureIndex({ fieldName: 'eventId', unique: true })
      await dataStore.ensureIndex({ fieldName: 'createdAt' })
      await dataStore.load()

      this.dataStores[streamName] = dataStore
    }

    return this.dataStores[streamName]
  }

  async persistEvent(
    streamName: string,
    event: Event,
    user: UserEntity,
  ): Promise<string> {
    const eventToStore: EventDocument = {
      eventId: uuid(),
      type: event.type,
      data: event.data,
      meta: { userId: user.id },
      createdAt: new Date(),
    }

    this.logger.debug(`Appending ${streamName}:${eventToStore.type} event..`, {
      streamName,
      event,
      eventToStore,
    })

    const dataStore = await this.getDataStore(streamName)
    await dataStore.insert(eventToStore)

    this.logger.debug(`Appended ${streamName}:${event.type} event`, {
      event,
      storedEventId: eventToStore.eventId,
    })

    return eventToStore.eventId
  }

  catchUpStream(streamName: string, callback: EventCallback): void {
    let lastDate = new Date(2000, 1)

    this.getDataStore(streamName).then((dataStore) => {
      function catchUp() {
        dataStore
          .find({ createdAt: { $gt: lastDate } })
          .sort({ createdAt: 1 })
          .limit(100)
          .exec()
          .then((documents: any) => {
            for (const document of documents as EventDocument[]) {
              if (document.createdAt > lastDate) {
                lastDate = document.createdAt
              }

              const { eventId, type, data } = document

              const eventClass = eventClasses.find(
                (foundClass) => foundClass.type === type,
              )

              if (!eventClass) {
                this.logger.error(`No event handler for "${type}"`, {
                  streamName,
                  eventId,
                  type,
                  data,
                })
                return
              }

              const observedEvent = new eventClass(eventId, data.id, data)
              callback(observedEvent)
            }
          })
          .catch((err) => {
            this.logger.error(
              `Error catching up with stream ${streamName}: ${err.message}`,
            )
          })
      }

      catchUp()
      this.timers.push(setInterval(catchUp, 1000))
    })
  }
}
