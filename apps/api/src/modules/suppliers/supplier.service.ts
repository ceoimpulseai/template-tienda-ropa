import { supplierRepository } from './supplier.repository.js';
import type { CreateSupplierInput, UpdateSupplierInput } from '@template/shared';

export const supplierService = {
  async list(businessId: string) {
    return supplierRepository.findAll(businessId, { order: [['name', 'ASC']] });
  },

  async create(businessId: string, input: CreateSupplierInput) {
    return supplierRepository.create(businessId, input);
  },

  async update(businessId: string, supplierId: string, input: UpdateSupplierInput) {
    return supplierRepository.update(businessId, supplierId, input);
  },

  async remove(businessId: string, supplierId: string) {
    await supplierRepository.remove(businessId, supplierId);
  },
};