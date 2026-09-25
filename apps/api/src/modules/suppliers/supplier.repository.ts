import { TenantRepository } from '../../lib/repository/base.js';
import { Supplier } from './supplier.model.js';

export const supplierRepository = new TenantRepository(Supplier);