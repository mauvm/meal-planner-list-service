import { Event } from '../../../shared/infra/event.store'

export default class ShoppingListItemCreated extends Event {
  static readonly type = 'shoppingListItemCreated'
  readonly type = ShoppingListItemCreated.type

  readonly data: { id: string; title: string; createdAt: string }

  constructor(
    readonly eventId: string | null,
    readonly aggregateId: string,
    data: { title: string },
  ) {
    super(eventId, aggregateId, data)

    this.data.createdAt = new Date().toISOString()
  }

  applyTo(aggregate: any): void {
    Object.assign(aggregate, this.data)
  }
}
