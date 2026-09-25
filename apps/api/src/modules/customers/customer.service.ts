import { customerRepository } from './customer.repository.js';
import type { CreateCustomerInput } from '@template/shared';

export const customerService = {
  async list(businessId: string) {
    return customerRepository.findAll(businessId, { order: [['name', 'ASC']] });
  },

  async create(businessId: string, input: CreateCustomerInput) {
    return customerRepository.create(businessId, {
      ...input,
      email: input.email ?? null,
      phone: input.phone ?? null,
    });
  },

  async remove(businessId: string, customerId: string) {
    await customerRepository.remove(businessId, customerId);
  },
};
