import { TenantRepository } from '../../../lib/repository/base.js';
import { Purchase } from './purchase.model.js';

export const purchaseRepository = new TenantRepository(Purchase);