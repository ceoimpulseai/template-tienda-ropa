import { variantRepository } from './variant.repository.js';
import type { CreateVariantInput, UpdateVariantInput } from '@template/shared';
import type { Transaction } from 'sequelize';

export const variantService = {
  async list(businessId: string, itemId: string) {
    return variantRepository.findAll(businessId, {
      where: { itemId },
      order: [['size', 'ASC'], ['color', 'ASC']],
    });
  },

  async create(businessId: string, itemId: string, input: CreateVariantInput) {
    return variantRepository.create(businessId, { ...input, itemId });
  },

  async getById(businessId: string, variantId: string) {
    return variantRepository.findById(businessId, variantId);
  },

  async update(businessId: string, variantId: string, input: UpdateVariantInput) {
    return variantRepository.update(businessId, variantId, input);
  },

  async remove(businessId: string, variantId: string) {
    await variantRepository.remove(businessId, variantId);
  },

  async decrementStock(variantId: string, quantity: number, transaction?: Transaction) {
    return variantRepository.decrementStock(variantId, quantity, transaction);
  },
};