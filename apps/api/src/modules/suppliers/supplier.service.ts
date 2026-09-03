import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../lib/errors.js';
import { Supplier } from './supplier.model.js';
import type { CreateSupplierInput, UpdateSupplierInput } from '@template/shared';

export const supplierService = {
  async list(businessId: string) {
    return Supplier.findAll({ where: { businessId }, order: [['name', 'ASC']] });
  },

  async create(businessId: string, input: CreateSupplierInput) {
    return Supplier.create({ id: randomUUID(), businessId, ...input });
  },

  async update(businessId: string, supplierId: string, input: UpdateSupplierInput) {
    const supplier = await Supplier.findOne({ where: { id: supplierId, businessId } });
    if (!supplier) throw new NotFoundError('SUPPLIER_NOT_FOUND');
    return supplier.update(input);
  },

  async remove(businessId: string, supplierId: string) {
    const supplier = await Supplier.findOne({ where: { id: supplierId, businessId } });
    if (!supplier) throw new NotFoundError('SUPPLIER_NOT_FOUND');
    await supplier.destroy();
  },
};