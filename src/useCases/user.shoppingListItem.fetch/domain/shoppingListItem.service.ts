import { singleton } from 'tsyringe'
import ShoppingListItemEntity from '../../../shared/domain/shoppingListItem.entity'
import ShoppingListItemRepository from '../infra/shoppingListItem.repository'

@singleton()
export default class ShoppingListItemService {
  constructor(private repository: ShoppingListItemRepository) {}

  async findOneByIdOrFail(id: string): Promise<ShoppingListItemEntity> {
    const item = await this.repository.findOneOrFail(id)
    return item
  }
}
