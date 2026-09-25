// EJEMPLO: adaptar a la lógica del rubro concreto.
import { sequelize } from '../../../config/database.js';
import { ConflictError } from '../../../lib/errors.js';
import { itemRepository } from '../../items/item.repository.js';
import { saleRepository } from './sale.repository.js';
import type { CreateSaleInput } from '@template/shared';

export const saleService = {
  async list(businessId: string) {
    return saleRepository.findAll(businessId, { order: [['createdAt', 'DESC']] });
  },

  async create(businessId: string, branchId: string, input: CreateSaleInput) {
    return sequelize.transaction(async (transaction) => {
      const item = await itemRepository.findOne(businessId, input.itemId, { transaction });
      if (!item) throw new ConflictError('ITEM_NOT_FOUND');
      if (item.stock < input.quantity) throw new ConflictError('INSUFFICIENT_STOCK');

      const isInternal = input.isInternal ?? false;
      const amountReceived =
        input.amountReceived ?? (isInternal ? 0 : input.unitPrice * input.quantity);

      const sale = await saleRepository.create(
        businessId,
        {
          branchId,
          itemId: input.itemId,
          customerId: input.customerId ?? null,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          isInternal,
          amountReceived,
        },
        { transaction }
      );

      await item.decrement('stock', { by: input.quantity, transaction });
      return sale;
    });
  },
};
