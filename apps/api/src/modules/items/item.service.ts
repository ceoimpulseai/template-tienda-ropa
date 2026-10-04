import { itemRepository } from './item.repository.js';
import { Variant } from './variant.model.js';
import type { CreateItemInput, UpdateItemInput } from '@template/shared';

export const itemService = {
  async list(businessId: string) {
    return itemRepository.findAll(businessId, {
      order: [['name', 'ASC']],
      include: [{ model: Variant, as: 'variants', required: false }],
    });
  },

  async create(businessId: string, input: CreateItemInput) {
    return itemRepository.create(businessId, input);
  },

  async update(businessId: string, itemId: string, input: UpdateItemInput) {
    return itemRepository.update(businessId, itemId, input);
  },

  async remove(businessId: string, itemId: string) {
    await itemRepository.remove(businessId, itemId);
  },
};
