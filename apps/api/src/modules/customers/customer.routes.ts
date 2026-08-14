import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { customerController } from './customer.controller.js';

export const customerRoutes = Router();

customerRoutes.use(requireAuth, requireBusiness);
customerRoutes.get('/', customerController.list);
customerRoutes.post('/', customerController.create);
customerRoutes.delete('/:id', customerController.remove);
