import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { supplierController } from './supplier.controller.js';

export const supplierRoutes = Router();

supplierRoutes.use(requireAuth, requireBusiness);
supplierRoutes.get('/', requirePermission('suppliers:read'), supplierController.list);
supplierRoutes.post('/', requirePermission('suppliers:create'), supplierController.create);
supplierRoutes.put('/:id', requirePermission('suppliers:update'), supplierController.update);
supplierRoutes.delete('/:id', requirePermission('suppliers:delete'), supplierController.remove);