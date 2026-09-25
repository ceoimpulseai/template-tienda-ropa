// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../../middleware/requireAuth.js';
import { requireBusiness } from '../../../middleware/requireBusiness.js';
import { requireBranch } from '../../../middleware/requireBranch.js';
import { requirePermission } from '../../../middleware/requirePermission.js';
import { purchaseController } from './purchase.controller.js';

export const purchaseRoutes = Router();

purchaseRoutes.use(requireAuth, requireBusiness, requireBranch);
purchaseRoutes.get('/', requirePermission('purchases:read'), purchaseController.list);
purchaseRoutes.post('/', requirePermission('purchases:create'), purchaseController.create);
