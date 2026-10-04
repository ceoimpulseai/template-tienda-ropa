import { TenantRepository } from '../../../lib/repository/base.js';
import { PurchaseItemVariantDist } from './purchase-item-variant-dist.model.js';

export const purchaseItemVariantDistRepository = new TenantRepository(PurchaseItemVariantDist);