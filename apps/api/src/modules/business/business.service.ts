import { Business } from './business.model.js';
import type { UpdateBusinessInput } from '@template/shared';

export const businessService = {
  async getById(businessId: string) {
    return Business.findByPk(businessId);
  },

  async update(businessId: string, input: UpdateBusinessInput) {
    const business = await Business.findByPk(businessId);
    if (!business) throw new Error('BUSINESS_NOT_FOUND');
    return business.update(input);
  },
};
