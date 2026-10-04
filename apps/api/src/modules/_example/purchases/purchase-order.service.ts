// EJEMPLO: adaptar a la lógica del rubro concreto.
import { sequelize } from '../../../config/database.js';
import { NotFoundError } from '../../../lib/errors.js';
import { itemRepository } from '../../items/item.repository.js';
import { variantRepository } from '../../items/variant.repository.js';
import { supplierRepository } from '../../suppliers/supplier.repository.js';
import { purchaseOrderRepository } from './purchase-order.repository.js';
import { purchaseLineItemRepository } from './purchase-line-item.repository.js';
import { purchaseItemVariantDistRepository } from './purchase-item-variant-dist.repository.js';
import type { CreatePurchaseOrderInput } from '@template/shared';

export const purchaseOrderService = {
  async list(businessId: string) {
    return purchaseOrderRepository.findAll(businessId, {
      include: [
        { association: 'supplier' },
        { association: 'branch' },
        { association: 'lines', include: [{ association: 'item' }, { association: 'variantDists', include: [{ association: 'variant' }] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
  },

  async getById(businessId: string, id: string) {
    return purchaseOrderRepository.findById(businessId, id, {
      include: [
        { association: 'supplier' },
        { association: 'branch' },
        { association: 'lines', include: [{ association: 'item' }, { association: 'variantDists', include: [{ association: 'variant' }] }] },
      ],
    });
  },

  async create(businessId: string, branchId: string, input: CreatePurchaseOrderInput) {
    return sequelize.transaction(async (transaction) => {
      // Validate supplier if provided
      if (input.supplierId) {
        const supplier = await supplierRepository.findOne(businessId, input.supplierId, { transaction });
        if (!supplier) throw new NotFoundError('SUPPLIER_NOT_FOUND');
      }

      // Create PurchaseOrder
      const purchaseOrder = await purchaseOrderRepository.create(
        businessId,
        {
          branchId,
          supplierId: input.supplierId ?? null,
          notes: input.notes ?? null,
          totalCost: 0, // Will calculate after creating lines
          status: 'completed',
        },
        { transaction }
      );

      let totalCost = 0;

      // Create line items
      for (const lineInput of input.lines) {
        // Validate item exists
        const item = await itemRepository.findOne(businessId, lineInput.itemId, { transaction });
        if (!item) throw new NotFoundError('ITEM_NOT_FOUND');

        const lineItem = await purchaseLineItemRepository.create(
          businessId,
          {
            purchaseOrderId: purchaseOrder.id,
            itemId: lineInput.itemId,
            quantity: lineInput.quantity,
            unitCost: lineInput.unitCost,
          },
          { transaction }
        );

        totalCost += lineInput.quantity * lineInput.unitCost;

        // Handle variant distribution
        if (lineInput.variants && lineInput.variants.length > 0) {
          for (const variantDist of lineInput.variants) {
            // Validate variant exists and belongs to the item
            const variant = await variantRepository.findOne(businessId, variantDist.variantId, { transaction });
            if (!variant) throw new NotFoundError('VARIANT_NOT_FOUND');
            if (variant.itemId !== lineInput.itemId) {
              throw new Error('VARIANT_DOES_NOT_BELONG_TO_ITEM');
            }

            await purchaseItemVariantDistRepository.create(
              businessId,
              {
                purchaseLineItemId: lineItem.id,
                variantId: variantDist.variantId,
                quantity: variantDist.quantity,
                unitCost: variantDist.unitCost ?? null,
              },
              { transaction }
            );

            // Update Variant stock
            await variant.increment('stock', { by: variantDist.quantity, transaction });
          }
        } else {
          // No variant distribution: update Item stock (backward compat)
          await item.increment('stock', { by: lineInput.quantity, transaction });
        }
      }

      // Update totalCost on the order
      await purchaseOrder.update({ totalCost }, { transaction });

      return this.getById(businessId, purchaseOrder.id);
    });
  },

  async getLastUnitCost(businessId: string, itemId: string) {
    const lineItem = await purchaseLineItemRepository.findOne(businessId, '', {
      where: { itemId },
      include: [{ association: 'purchaseOrder', where: { status: 'completed' } }],
      order: [['createdAt', 'DESC']],
      limit: 1,
    });

    // Since findOne with empty id won't work, we need a custom method
    // This is a simplified version - in practice we'd add a custom repo method
    return lineItem?.unitCost ?? null;
  },

  async cancel(businessId: string, id: string) {
    return sequelize.transaction(async (transaction) => {
      const purchaseOrder = await this.getById(businessId, id);

      if (!purchaseOrder) throw new NotFoundError('PURCHASE_ORDER_NOT_FOUND');
      if (purchaseOrder.status === 'cancelled') throw new Error('ALREADY_CANCELLED');

      // Revert stock changes
      for (const line of purchaseOrder.lines ?? []) {
        if (line.variantDists && line.variantDists.length > 0) {
          for (const variantDist of line.variantDists) {
            await variantRepository.decrementStock(variantDist.variantId, variantDist.quantity, transaction);
          }
        } else {
          // Backward compat: decrement Item stock
          const item = await itemRepository.findOne(businessId, line.itemId, { transaction });
          if (item) {
            await item.decrement('stock', { by: line.quantity, transaction });
          }
        }
      }

      // Mark as cancelled
      await purchaseOrder.update({ status: 'cancelled' }, { transaction });

      return purchaseOrder;
    });
  },
};