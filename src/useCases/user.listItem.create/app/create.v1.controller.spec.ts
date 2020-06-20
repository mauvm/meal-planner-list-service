import 'mocha' // @todo Find out why VSCode gives "Cannot find name 'describe'." error without this
import { Server } from 'http'
import { container } from 'tsyringe'
import { expect } from 'chai'
import request from 'supertest'
import HttpStatus from 'http-status-codes'
import { createApp, cleanUpApp } from '../../../app'
import ConfigService from '../../../shared/domain/config.service'
import ListItemStore from '../../../shared/infra/listItem.store'
import EventStore from '../../../shared/infra/event.store'
import EventMockStore from '../../../shared/infra/event.store.mock'

describe('CreateListItemV1Controller', () => {
  let server: Server
  let config: ConfigService
  let eventStore: EventStore

  beforeEach(async () => {
    container.clearInstances()

    config = container.resolve(ConfigService)
    config.set('logger.level', 'warn')

    eventStore = container.resolve(EventMockStore)
    container.registerInstance(EventStore, eventStore)

    const app = await createApp()
    server = app.listen()
  })

  afterEach(async () => {
    await cleanUpApp(server)
  })

  describe('should have a POST /v1/lists/items endpoint that', () => {
    it('returns a 400 Bad Request on a title that is too long (over 300 characters)', async () => {
      // Data
      const tooLongTitle = Array(301).fill('a').join('')

      // Execute
      const response = await request(server)
        .post('/v1/lists/items')
        .send({ title: tooLongTitle })
        .expect(HttpStatus.BAD_REQUEST)

      // Test
      const constraint = response.body?.errors?.[0]
      expect(constraint.property).to.equal('title')
      expect(constraint.constraints).to.deep.equal({
        maxLength: 'title must be shorter than or equal to 300 characters',
      })
    })

    it('returns a 303 See Other with location header containing the ID', async () => {
      // Dependencies
      const listItemStore = container.resolve(ListItemStore)

      // Execute
      const response = await request(server)
        .post('/v1/lists/items')
        .send({ title: 'Test' })
        .expect(HttpStatus.SEE_OTHER)

      // Test
      expect(response.header.location).to.include('/v1/lists/items/')
      const id = response.header['x-resource-id']
      expect(listItemStore.getAggregateById(id)?.data?.title).to.equal('Test')
    })
  })
})