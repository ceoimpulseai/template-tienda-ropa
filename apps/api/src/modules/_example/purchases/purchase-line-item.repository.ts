import { TenantRepository } from '../../../lib/repository/base.js';
import { PurchaseLineItem } from './purchase-line-item.model.js';

export const purchaseLineItemRepository = new TenantRepository(PurchaseLineItem);