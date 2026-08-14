// EJEMPLO: adaptar a la lógica del rubro concreto.
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Item } from '../purchases/item.model.js';
import { Sale } from './sale.model.js';
import type { CreateSaleInput } from '@template/shared';

export const saleService = {
  async list(businessId: string) {
    return Sale.findAll({ where: { businessId }, order: [['createdAt', 'DESC']] });
  },

  async create(businessId: string, branchId: string, input: CreateSaleInput) {
    return sequelize.transaction(async (transaction) => {
      const item = await Item.findOne({ where: { id: input.itemId, businessId }, transaction });
      if (!item) throw new Error('ITEM_NOT_FOUND');
      if (item.stock < input.quantity) throw new Error('INSUFFICIENT_STOCK');

      const sale = await Sale.create(
        {
          id: randomUUID(),
          businessId,
          branchId,
          itemId: input.itemId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
        },
        { transaction },
      );

      await item.decrement('stock', { by: input.quantity, transaction });
      return sale;
    });
  },
};
