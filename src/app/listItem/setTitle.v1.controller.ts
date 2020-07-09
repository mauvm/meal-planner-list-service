import { AssertionError } from 'assert'
import { singleton } from 'tsyringe'
import {
  JsonController,
  Patch,
  OnUndefined,
  Params,
  Body,
  UnauthorizedError,
  NotFoundError,
  Authorized,
  CurrentUser,
} from 'routing-controllers'
import { IsUUID, IsString } from 'class-validator'
import HttpStatus from 'http-status-codes'
import UserEntity from '../../domain/user.entity'
import ListService from '../../domain/list/list.service'
import ListItemService from '../../domain/listItem/listItem.service'
import ListCreated from '../../domain/list/listCreated.event'
import ListItemCreated from '../../domain/listItem/listItemCreated.event'

class SetItemTitleRequestParamsDTO {
  @IsUUID()
  listId: string

  @IsUUID()
  itemId: string
}

class SetItemTitleRequestBodyDTO {
  @IsString()
  title: string
}

@singleton()
@JsonController('/v1/lists')
export default class SetListItemTitleV1Controller {
  constructor(
    private listService: ListService,
    private listItemService: ListItemService,
  ) {}

  @Authorized('list-items:update')
  @Patch('/:listId/items/:itemId')
  @OnUndefined(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: UserEntity,
    @Params() { listId, itemId }: SetItemTitleRequestParamsDTO,
    @Body() { title }: SetItemTitleRequestBodyDTO,
  ): Promise<void> {
    try {
      const list = await this.listService.findOneByIdOrFail(listId)

      if (!list.hasOwner(user)) {
        throw new UnauthorizedError(`No access to list "${list.id}"`)
      }

      const item = await this.listItemService.findOneByIdOrFail(itemId)

      if (!list.hasItem(item)) {
        throw new NotFoundError(`No list item found for ID "${item.id}"`)
      }

      await this.listItemService.setTitle(item.id, title, user)
    } catch (err) {
      if (err instanceof AssertionError && err.expected === ListCreated.name) {
        throw new NotFoundError(`No list found for ID "${listId}"`)
      }

      if (
        err instanceof AssertionError &&
        err.expected === ListItemCreated.name
      ) {
        throw new NotFoundError(`No list item found for ID "${itemId}"`)
      }

      throw err
    }
  }
}
