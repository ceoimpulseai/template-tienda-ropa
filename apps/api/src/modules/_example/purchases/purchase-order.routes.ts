// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../../middleware/requireAuth.js';
import { requireBusiness } from '../../../middleware/requireBusiness.js';
import { requireBranch } from '../../../middleware/requireBranch.js';
import { requirePermission } from '../../../middleware/requirePermission.js';
import { purchaseOrderController } from './purchase-order.controller.js';

export const purchaseOrderRoutes = Router();

purchaseOrderRoutes.use(requireAuth, requireBusiness, requireBranch);
purchaseOrderRoutes.get('/', requirePermission('purchases:read'), purchaseOrderController.list);
purchaseOrderRoutes.get('/:id', requirePermission('purchases:read'), purchaseOrderController.getById);
purchaseOrderRoutes.post('/', requirePermission('purchases:create'), purchaseOrderController.create);
purchaseOrderRoutes.patch('/:id/cancel', requirePermission('purchases:create'), purchaseOrderController.cancel);