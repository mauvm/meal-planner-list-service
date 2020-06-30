import { singleton } from 'tsyringe'
import { JsonController, Post, Body, Res } from 'routing-controllers'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
import HttpStatus from 'http-status-codes'
import ListItemService from '../domain/listItem.service'
import { Response } from 'koa'

class CreateRequestParamsDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  title: string
}

@singleton()
@JsonController('/v1/lists/items')
export default class CreateListItemV1Controller {
  constructor(private service: ListItemService) {}

  @Post('/')
  async create(
    @Body() data: CreateRequestParamsDTO,
    @Res() res: Response,
  ): Promise<Response> {
    const id = await this.service.create(data)

    res.set('Access-Control-Expose-Headers', 'X-Resource-Id')
    res.set('X-Resource-Id', id)
    res.status = HttpStatus.CREATED
    res.body = { id }

    return res
  }
}
