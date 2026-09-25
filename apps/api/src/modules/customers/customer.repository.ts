import { TenantRepository } from '../../lib/repository/base.js';
import { Customer } from './customer.model.js';

export const customerRepository = new TenantRepository(Customer);