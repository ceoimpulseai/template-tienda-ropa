// EJEMPLO: adaptar a la lógica del rubro concreto.
import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../../lib/errors.js';
import { Cost } from './cost.model.js';
import type { CreateCostInput } from '@template/shared';

export const costService = {
  async list(businessId: string) {
    return Cost.findAll({ where: { businessId } });
  },

  async create(businessId: string, input: CreateCostInput) {
    return Cost.create({ id: randomUUID(), businessId, ...input });
  },

  async remove(businessId: string, costId: string) {
    const cost = await Cost.findOne({ where: { id: costId, businessId } });
    if (!cost) throw new NotFoundError('COST_NOT_FOUND');
    await cost.destroy();
  },

  async totalFixed(businessId: string) {
    const costs = await Cost.findAll({ where: { businessId, type: 'fixed' } });
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  },
};
