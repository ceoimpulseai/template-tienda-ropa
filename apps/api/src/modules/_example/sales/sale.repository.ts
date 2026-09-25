import { TenantRepository } from '../../../lib/repository/base.js';
import { Sale } from './sale.model.js';

export const saleRepository = new TenantRepository(Sale);