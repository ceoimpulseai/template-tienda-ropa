import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { supplierController } from './supplier.controller.js';

export const supplierRoutes = Router();

supplierRoutes.use(requireAuth, requireBusiness);
supplierRoutes.get('/', supplierController.list);
supplierRoutes.post('/', supplierController.create);
supplierRoutes.put('/:id', supplierController.update);
supplierRoutes.delete('/:id', supplierController.remove);