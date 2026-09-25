// EJEMPLO: adaptar a la lógica del rubro concreto.
import { sequelize } from '../../../config/database.js';
import { NotFoundError } from '../../../lib/errors.js';
import { itemRepository } from '../../items/item.repository.js';
import { purchaseRepository } from './purchase.repository.js';
import type { CreatePurchaseInput } from '@template/shared';

export const purchaseService = {
  async list(businessId: string) {
    return purchaseRepository.findAll(businessId, { order: [['createdAt', 'DESC']] });
  },

  async create(businessId: string, branchId: string, input: CreatePurchaseInput) {
    return sequelize.transaction(async (transaction) => {
      const item = await itemRepository.findOne(businessId, input.itemId, { transaction });
      if (!item) throw new NotFoundError('ITEM_NOT_FOUND');

      const purchase = await purchaseRepository.create(
        businessId,
        {
          branchId,
          itemId: input.itemId,
          supplierId: input.supplierId ?? null,
          quantity: input.quantity,
          unitCost: input.unitCost,
        },
        { transaction }
      );

      await item.increment('stock', { by: input.quantity, transaction });
      return purchase;
    });
  },
};
