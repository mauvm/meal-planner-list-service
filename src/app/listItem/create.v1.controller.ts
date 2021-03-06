import { AssertionError } from 'assert'
import { singleton } from 'tsyringe'
import {
  JsonController,
  Post,
  Body,
  Res,
  Params,
  NotFoundError,
  Authorized,
  CurrentUser,
} from 'routing-controllers'
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsArray,
  MaxLength,
} from 'class-validator'
import { Response } from 'koa'
import HttpStatus from 'http-status-codes'
import UserEntity from '../../domain/user.entity'
import ListItemService from '../../domain/listItem/listItem.service'
import ListCreated from '../../domain/list/listCreated.event'

class CreateRequestParamsDTO {
  @IsUUID()
  listId: string
}

class CreateRequestBodyDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  title: string

  @IsArray()
  @IsString({ each: true })
  labels: string[] = []
}

@singleton()
@JsonController('/v1/lists')
export default class CreateListItemV1Controller {
  constructor(private service: ListItemService) {}

  @Authorized('list-items:create')
  @Post('/:listId/items')
  async create(
    @CurrentUser() user: UserEntity,
    @Params() { listId }: CreateRequestParamsDTO,
    @Body() data: CreateRequestBodyDTO,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const id = await this.service.create({ listId, title: data.title }, user)

      if (data.labels.length > 0) {
        await this.service.setLabels(id, data.labels, user)
      }

      res.set('Access-Control-Expose-Headers', 'X-Resource-Id')
      res.set('X-Resource-Id', id)
      res.status = HttpStatus.CREATED
      res.body = { id }

      return res
    } catch (err) {
      if (err instanceof AssertionError && err.expected === ListCreated.name) {
        throw new NotFoundError(`No list found for ID "${listId}"`)
      }

      throw err
    }
  }
}
