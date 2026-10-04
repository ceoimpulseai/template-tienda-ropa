import { TenantRepository } from '../../lib/repository/base.js';
import { Variant } from './variant.model.js';
import type { Transaction } from 'sequelize';

class VariantRepository extends TenantRepository<Variant> {
  async decrementStock(variantId: string, quantity: number, transaction?: Transaction): Promise<void> {
    const variant = await this.findById('', variantId);
    await variant.decrement('stock', { by: quantity, transaction });
  }
}

export const variantRepository = new VariantRepository(Variant);