// EJEMPLO: adaptar a la lógica del rubro concreto.
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../../config/database.js';
import { NotFoundError } from '../../../lib/errors.js';
import { Item } from '../../items/item.model.js';
import { Purchase } from './purchase.model.js';
import type { CreatePurchaseInput } from '@template/shared';

export const purchaseService = {
  async list(businessId: string) {
    return Purchase.findAll({ where: { businessId }, order: [['createdAt', 'DESC']] });
  },

  async create(businessId: string, branchId: string, input: CreatePurchaseInput) {
    return sequelize.transaction(async (transaction) => {
      const item = await Item.findOne({ where: { id: input.itemId, businessId }, transaction });
      if (!item) throw new NotFoundError('ITEM_NOT_FOUND');

      const purchase = await Purchase.create(
        {
          id: randomUUID(),
          businessId,
          branchId,
          itemId: input.itemId,
          supplierId: input.supplierId ?? null,
          quantity: input.quantity,
          unitCost: input.unitCost,
        },
        { transaction },
      );

      await item.increment('stock', { by: input.quantity, transaction });
      return purchase;
    });
  },
};
