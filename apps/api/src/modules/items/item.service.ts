import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../lib/errors.js';
import { Item } from './item.model.js';
import type { CreateItemInput, UpdateItemInput } from '@template/shared';

export const itemService = {
  async list(businessId: string) {
    return Item.findAll({ where: { businessId }, order: [['name', 'ASC']] });
  },

  async create(businessId: string, input: CreateItemInput) {
    return Item.create({
      id: randomUUID(),
      businessId,
      name: input.name,
      price: input.price,
      stock: input.stock ?? 0,
      visibleInCatalog: input.visibleInCatalog ?? false,
    });
  },

  async update(businessId: string, itemId: string, input: UpdateItemInput) {
    const item = await Item.findOne({ where: { id: itemId, businessId } });
    if (!item) throw new NotFoundError('ITEM_NOT_FOUND');
    return item.update(input);
  },

  async remove(businessId: string, itemId: string) {
    const item = await Item.findOne({ where: { id: itemId, businessId } });
    if (!item) throw new NotFoundError('ITEM_NOT_FOUND');
    await item.destroy();
  },
};
