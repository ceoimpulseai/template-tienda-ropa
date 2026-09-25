import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { customerController } from './customer.controller.js';

export const customerRoutes = Router();

customerRoutes.use(requireAuth, requireBusiness);
customerRoutes.get('/', requirePermission('customers:read'), customerController.list);
customerRoutes.post('/', requirePermission('customers:create'), customerController.create);
customerRoutes.delete('/:id', requirePermission('customers:delete'), customerController.remove);
