import { randomUUID } from 'node:crypto';
import { Customer } from './customer.model.js';
import type { CreateCustomerInput } from '@template/shared';

export const customerService = {
  async list(businessId: string) {
    return Customer.findAll({ where: { businessId }, order: [['name', 'ASC']] });
  },

  async create(businessId: string, input: CreateCustomerInput) {
    return Customer.create({
      id: randomUUID(),
      businessId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
    });
  },

  async remove(businessId: string, customerId: string) {
    const customer = await Customer.findOne({ where: { id: customerId, businessId } });
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
    await customer.destroy();
  },
};
