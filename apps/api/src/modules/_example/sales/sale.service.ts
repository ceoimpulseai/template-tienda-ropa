// EJEMPLO: adaptar a la lógica del rubro concreto.
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../../config/database.js';
import { ConflictError, NotFoundError } from '../../../lib/errors.js';
import { Item } from '../../items/item.model.js';
import { Sale } from './sale.model.js';
import type { CreateSaleInput } from '@template/shared';

export const saleService = {
  async list(businessId: string) {
    return Sale.findAll({ where: { businessId }, order: [['createdAt', 'DESC']] });
  },

  async create(businessId: string, branchId: string, input: CreateSaleInput) {
    return sequelize.transaction(async (transaction) => {
      const item = await Item.findOne({ where: { id: input.itemId, businessId }, transaction });
      if (!item) throw new NotFoundError('ITEM_NOT_FOUND');
      if (item.stock < input.quantity) throw new ConflictError('INSUFFICIENT_STOCK');

      const isInternal = input.isInternal ?? false;
      const amountReceived =
        input.amountReceived ?? (isInternal ? 0 : input.unitPrice * input.quantity);

      const sale = await Sale.create(
        {
          id: randomUUID(),
          businessId,
          branchId,
          itemId: input.itemId,
          customerId: input.customerId ?? null,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          isInternal,
          amountReceived,
        },
        { transaction },
      );

      await item.decrement('stock', { by: input.quantity, transaction });
      return sale;
    });
  },
};
