// EJEMPLO: adaptar a la lógica del rubro concreto.
import { costRepository } from './cost.repository.js';
import type { CreateCostInput } from '@template/shared';

export const costService = {
  async list(businessId: string) {
    return costRepository.findAll(businessId);
  },

  async create(businessId: string, input: CreateCostInput) {
    return costRepository.create(businessId, input);
  },

  async remove(businessId: string, costId: string) {
    await costRepository.remove(businessId, costId);
  },

  async totalFixed(businessId: string) {
    const costs = await costRepository.findAll(businessId, { where: { type: 'fixed' } });
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  },
};
