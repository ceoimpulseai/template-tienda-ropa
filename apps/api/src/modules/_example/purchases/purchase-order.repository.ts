import { TenantRepository } from '../../../lib/repository/base.js';
import { PurchaseOrder } from './purchase-order.model.js';

export const purchaseOrderRepository = new TenantRepository(PurchaseOrder);