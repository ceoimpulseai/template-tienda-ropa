// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requireBranch } from '../../middleware/requireBranch.js';
import { saleController } from './sale.controller.js';

export const saleRoutes = Router();

saleRoutes.use(requireAuth, requireBusiness, requireBranch);
saleRoutes.get('/', saleController.list);
saleRoutes.post('/', saleController.create);
